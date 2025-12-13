import { and, desc, eq, lte } from 'drizzle-orm'
import { Hono } from 'hono'
import { prices, tickers } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { convertPrice, isCurrencyCode } from '../utils/currency.ts'
import { getToday, isValidDate } from '../utils/dates.ts'
import { formatPrice } from '../utils/prices.ts'

export const cryptoRoutes = new Hono()

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

// GET /crypto/:ticker
// GET /crypto/:ticker/:currencyOrDate
// GET /crypto/:ticker/:currency/:date
cryptoRoutes.get('/:ticker/:currencyOrDate?/:date?', async (context) => {
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

  if (params.date !== getToday()) {
    context.header('Cache-Control', 'public, max-age=31536000')
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
