import { and, desc, eq, lte } from 'drizzle-orm'
import { Hono } from 'hono'
import { prices, tickers } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { convertPrice, convertPrices } from '../utils/currency.ts'
import { getToday } from '../utils/dates.ts'
import { parseCurrencyDateParams } from '../utils/params.ts'
import { findPricesInRange, formatPrice } from '../utils/prices.ts'
import { findOrSkip } from '../utils/queries.ts'

export const cryptoRoutes = new Hono()

// GET /crypto/:ticker
// GET /crypto/:ticker/:currencyOrDate
// GET /crypto/:ticker/:currency/:date
// GET /crypto/:ticker/:dateFrom..:dateTo
// GET /crypto/:ticker/:currency/:dateFrom..:dateTo
cryptoRoutes.get('/:ticker/:currencyOrDate?/:date?', async (context) => {
  const { ticker: symbol, currencyOrDate, date } = context.req.param()
  const locale = context.req.query('locale')
  const params = parseCurrencyDateParams(currencyOrDate, date)

  const ticker = await findOrSkip(
    db
      .select()
      .from(tickers)
      .where(and(eq(tickers.symbol, symbol.toUpperCase()), eq(tickers.type, 'crypto')))
      .limit(1),
  )

  if (!ticker || !params) {
    return context.notFound()
  }

  // Date range request.
  if (params.dateRange) {
    const { dateFrom, dateTo } = params.dateRange
    let entries = await findPricesInRange(ticker.id, dateFrom, dateTo)

    if (entries.length === 0) {
      return context.notFound()
    }

    if (params.currency && params.currency !== ticker.currency) {
      entries = await convertPrices(entries, ticker.currency, params.currency)
    }

    context.header('Cache-Control', 'public, max-age=31536000')

    const csv = entries.map((entry) => formatPrice(entry.price, locale)).join('\n')
    return context.text(csv)
  }

  let priceData = await findOrSkip(
    db
      .select()
      .from(prices)
      .where(and(eq(prices.tickerId, ticker.id), eq(prices.date, params.date)))
      .limit(1),
  )

  if (!priceData) {
    priceData = await findOrSkip(
      db
        .select()
        .from(prices)
        .where(and(eq(prices.tickerId, ticker.id), lte(prices.date, params.date)))
        .orderBy(desc(prices.date))
        .limit(1),
    )
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
