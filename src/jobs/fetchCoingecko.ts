import { eq, inArray } from 'drizzle-orm'
import { prices, tickers } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { fetchHistorical, fetchLatestBatch } from '../sources/coingecko.ts'
import { getToday } from '../utils/dates.ts'
import { upsertPrice } from '../utils/prices.ts'

export type FetchCoingeckoData = {
  tickerIds: Array<number>
  fromDate?: string
}

export const fetchCoingecko = async (data: FetchCoingeckoData) => {
  const tickerList = await db.select().from(tickers).where(inArray(tickers.id, data.tickerIds))

  if (tickerList.length === 0) {
    console.error('[fetchCoingecko] No tickers found')
    return
  }

  // No fromDate = fetch latest (today) in batch.
  if (!data.fromDate) {
    const sourceIds = tickerList.map((t) => t.sourceId)
    const pricesMap = await fetchLatestBatch(sourceIds)
    const today = getToday()

    let fetched = 0
    let unavailable = 0

    for (const ticker of tickerList) {
      const priceData = pricesMap?.get(ticker.sourceId)

      await upsertPrice({
        tickerId: ticker.id,
        date: today,
        price: priceData?.price ?? null,
        available: priceData != null,
      })

      if (priceData) {
        fetched++
      } else {
        unavailable++
      }
    }

    console.log(`[fetchCoingecko] Fetched ${fetched}, unavailable ${unavailable}`)
    return
  }

  // With fromDate = fetch historical per ticker.
  let totalInserted = 0

  for (const ticker of tickerList) {
    const historicalData = await fetchHistorical(ticker.sourceId, data.fromDate)

    if (!historicalData || historicalData.prices.length === 0) {
      console.error(`[fetchCoingecko] No historical data for ${ticker.symbol}`)
      continue
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
      `[fetchCoingecko] Backfilled ${inserted} prices for ${ticker.symbol} (${historicalData.prices.length} total)`,
    )

    totalInserted += inserted
  }

  console.log(
    `[fetchCoingecko] Total backfilled: ${totalInserted} prices for ${tickerList.length} tickers`,
  )
}
