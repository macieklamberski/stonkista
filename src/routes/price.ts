import { and, desc, eq, lte, ne } from 'drizzle-orm'
import { Hono } from 'hono'
import { prices, tickers } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { fetchHistorical } from '../sources/yahoo.ts'
import { convertPrice, isCurrencyCode } from '../utils/currency.ts'
import { getToday, isValidDate } from '../utils/dates.ts'
import { formatPrice, upsertPrice } from '../utils/prices.ts'

export const priceRoutes = new Hono()

const parseParams = (currencyOrDate?: string, date?: string) => {
  if (currencyOrDate && date) {
    if (!isValidDate(date)) {
      return
    }

    return { currency: currencyOrDate.toUpperCase(), date: date }
  }

  if (currencyOrDate) {
    if (isValidDate(currencyOrDate)) {
      return { currency: undefined, date: currencyOrDate }
    }

    if (isCurrencyCode(currencyOrDate)) {
      return { currency: currencyOrDate.toUpperCase(), date: getToday() }
    }

    return
  }

  return { currency: undefined, date: getToday() }
}

const parseForexParams = (to: string, date?: string) => {
  if (!isCurrencyCode(to)) {
    return
  }

  if (date && !isValidDate(date)) {
    return
  }

  return { currency: to.toUpperCase(), date: date ?? getToday() }
}

// GET /forex/:from/:to
// GET /forex/:from/:to/:date
priceRoutes.get('/forex/:from/:to/:date?', async (context) => {
  const { from, to, date } = context.req.param()
  const locale = context.req.query('locale')
  const params = parseForexParams(to, date)

  if (!isCurrencyCode(from) || !params) {
    return context.notFound()
  }

  const rate = await convertPrice(1, from.toUpperCase(), params.currency, params.date)

  if (rate === undefined) {
    return context.notFound()
  }

  return context.text(formatPrice(rate, locale))
})

// GET /crypto/:ticker
// GET /crypto/:ticker/:currencyOrDate
// GET /crypto/:ticker/:currency/:date
priceRoutes.get('/crypto/:ticker/:currencyOrDate?/:date?', async (context) => {
  const { ticker: symbol, currencyOrDate, date } = context.req.param()
  const locale = context.req.query('locale')
  const params = parseParams(currencyOrDate, date)

  const ticker = await db.query.tickers.findFirst({
    where: and(eq(tickers.symbol, symbol.toUpperCase()), eq(tickers.type, 'crypto')),
  })

  if (!ticker || !params) {
    return context.notFound()
  }

  let priceData = await db.query.prices.findFirst({
    where: and(eq(prices.tickerId, ticker.id), eq(prices.date, params.date)),
  })

  if (!priceData) {
    priceData = await db.query.prices.findFirst({
      where: and(eq(prices.tickerId, ticker.id), lte(prices.date, params.date)),
      orderBy: [desc(prices.date)],
    })
  }

  if (!priceData || !priceData.available || priceData.price === null) {
    return context.notFound()
  }

  if (params.currency && params.currency !== ticker.currency) {
    const priceConverted = await convertPrice(
      Number(priceData.price),
      ticker.currency,
      params.currency,
      priceData.date,
    )

    if (priceConverted === undefined) {
      return context.notFound()
    }

    return context.text(formatPrice(priceConverted, locale))
  }

  return context.text(formatPrice(priceData.price, locale))
})

// GET /:ticker
// GET /:ticker/:currencyOrDate
// GET /:ticker/:currency/:date
priceRoutes.get('/:ticker/:currencyOrDate?/:date?', async (context) => {
  const { ticker: symbol, currencyOrDate, date } = context.req.param()
  const locale = context.req.query('locale')
  const params = parseParams(currencyOrDate, date)

  if (!params) {
    return context.notFound()
  }

  let ticker = await db.query.tickers.findFirst({
    where: and(eq(tickers.symbol, symbol.toUpperCase()), ne(tickers.type, 'crypto')),
  })

  // Lazy load from Yahoo if ticker not found.
  if (!ticker) {
    const data = await fetchHistorical(symbol)

    if (!data || !data.name || !data.type) {
      return context.notFound()
    }

    const [newTicker] = await db
      .insert(tickers)
      .values({
        symbol: symbol.toUpperCase(),
        name: data.name,
        type: data.type,
        currency: data.currency,
        source: 'yahoo',
        sourceId: symbol.toUpperCase(),
      })
      .returning()

    for (const price of data.prices) {
      await upsertPrice({
        tickerId: newTicker.id,
        date: price.date,
        price: price.price,
        available: true,
      })
    }

    ticker = newTicker
  }

  let priceData = await db.query.prices.findFirst({
    where: and(eq(prices.tickerId, ticker.id), eq(prices.date, params.date)),
  })

  // If no exact date match, try closest previous date (handles weekends/holidays).
  if (!priceData) {
    priceData = await db.query.prices.findFirst({
      where: and(eq(prices.tickerId, ticker.id), lte(prices.date, params.date)),
      orderBy: [desc(prices.date)],
    })
  }

  if (!priceData || !priceData.available || priceData.price === null) {
    return context.notFound()
  }

  // Currency conversion needed - must convert to Number (some precision loss for large values).
  if (params.currency && params.currency !== ticker.currency) {
    const priceConverted = await convertPrice(
      Number(priceData.price),
      ticker.currency,
      params.currency,
      priceData.date,
    )

    if (priceConverted === undefined) {
      return context.notFound()
    }

    return context.text(formatPrice(priceConverted, locale))
  }

  // No conversion - keep DB string for full precision.
  return context.text(formatPrice(priceData.price, locale))
})
