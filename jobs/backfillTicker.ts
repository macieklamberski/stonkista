import { eq } from 'drizzle-orm'
import { prices, tickers } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { coingecko } from '../sources/coingecko.ts'
import { yahoo } from '../sources/yahoo.ts'

export type BackfillTickerData = {
  tickerId: number
  fromDate?: string // YYYY-MM-DD, optional
}

export const backfillTicker = async (data: BackfillTickerData) => {
  const ticker = await db.query.tickers.findFirst({
    where: eq(tickers.id, data.tickerId),
  })

  if (!ticker) {
    console.error(`[backfillTicker] Ticker not found: ${data.tickerId}`)
    return
  }

  const source = ticker.source === 'yahoo' ? yahoo : coingecko
  const historicalData = await source.fetchHistorical(ticker.symbol, data.fromDate)

  if (!historicalData || historicalData.prices.length === 0) {
    console.error(`[backfillTicker] No historical data for ${ticker.symbol}`)
    return
  }

  // Get existing dates to avoid duplicates
  const existingPrices = await db.query.prices.findMany({
    where: eq(prices.tickerId, ticker.id),
    columns: { date: true },
  })

  const existingDates = new Set(existingPrices.map((p) => p.date))

  let inserted = 0
  for (const priceData of historicalData.prices) {
    if (existingDates.has(priceData.date)) {
      continue
    }

    await db.insert(prices).values({
      tickerId: ticker.id,
      date: priceData.date,
      price: priceData.price.toString(),
      available: true,
      fetchedAt: new Date(),
    })

    inserted++
  }

  console.log(
    `[backfillTicker] Backfilled ${inserted} prices for ${ticker.symbol} (${historicalData.prices.length} total fetched)`,
  )
}
