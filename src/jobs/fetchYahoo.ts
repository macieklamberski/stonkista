import { eq } from 'drizzle-orm'
import { prices, tickers } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { fetchHistorical, fetchLatest } from '../sources/yahoo.ts'
import { getToday } from '../utils/dates.ts'
import { upsertPrice } from '../utils/prices.ts'
import { findOrSkip } from '../utils/queries.ts'

export type FetchYahooData = {
  tickerId: number
  fromDate?: string
}

export const fetchYahoo = async (data: FetchYahooData) => {
  const ticker = await findOrSkip(
    db.select().from(tickers).where(eq(tickers.id, data.tickerId)).limit(1),
  )

  if (!ticker) {
    console.error(`[fetchYahoo] Ticker not found: ${data.tickerId}`)
    return
  }

  // No fromDate = fetch latest (today).
  if (!data.fromDate) {
    const priceData = await fetchLatest(ticker.symbol)

    await upsertPrice({
      tickerId: ticker.id,
      date: getToday(),
      price: priceData?.price ?? null,
      available: priceData != null,
    })

    if (priceData) {
      console.log(`[fetchYahoo] Fetched ${ticker.symbol}: ${priceData.price}`)
    } else {
      console.log(`[fetchYahoo] Price unavailable for ${ticker.symbol}`)
    }

    return
  }

  // With fromDate = fetch historical.
  const historicalData = await fetchHistorical(ticker.symbol, data.fromDate)

  if (!historicalData || historicalData.prices.length === 0) {
    console.error(`[fetchYahoo] No historical data for ${ticker.symbol}`)
    return
  }

  const existingPrices = await db
    .select({ date: prices.date })
    .from(prices)
    .where(eq(prices.tickerId, ticker.id))

  const existingDates = new Set(existingPrices.map((p) => p.date))

  let inserted = 0
  for (const priceData of historicalData.prices) {
    if (existingDates.has(priceData.date)) {
      continue
    }

    await upsertPrice({
      tickerId: ticker.id,
      date: priceData.date,
      price: priceData.price,
      available: true,
    })

    inserted++
  }

  console.log(
    `[fetchYahoo] Backfilled ${inserted} prices for ${ticker.symbol} (${historicalData.prices.length} total)`,
  )
}
