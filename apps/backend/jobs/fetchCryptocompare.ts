import { inArray } from 'drizzle-orm'
import { tickers } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { fetchLatestBatch } from '../sources/cryptocompare.ts'
import { getToday } from '../utils/dates.ts'
import { upsertPrice } from '../utils/prices.ts'

export type FetchCryptocompareData = {
  tickerIds: Array<number>
}

export const fetchCryptocompare = async (data: FetchCryptocompareData) => {
  const tickerList = await db.select().from(tickers).where(inArray(tickers.id, data.tickerIds))

  if (tickerList.length === 0) {
    console.error('[fetchCryptocompare] No tickers found')
    return
  }

  const symbols = tickerList.map((t) => t.sourceId)
  const pricesMap = await fetchLatestBatch(symbols)
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

  console.log(`[fetchCryptocompare] Fetched ${fetched}, unavailable ${unavailable}`)
}
