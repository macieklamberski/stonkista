import { eq } from 'drizzle-orm'
import { pages } from '../constants/coinstats.ts'
import { tickers } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { fetchCoinsPage } from '../sources/coinstats.ts'
import { sleep } from '../utils/async.ts'
import { getToday } from '../utils/dates.ts'
import { upsertPrice } from '../utils/prices.ts'

// CoinStats free plan allows 2 requests per second.
const REQUEST_DELAY_MS = 500

export const fetchCoinstats = async () => {
  const tickerList = await db.select().from(tickers).where(eq(tickers.source, 'coinstats'))

  if (tickerList.length === 0) {
    return
  }

  const pricesById = new Map<string, number>()

  for (let page = 1; page <= pages; page++) {
    if (page > 1) {
      await sleep(REQUEST_DELAY_MS)
    }

    for (const coin of await fetchCoinsPage(page)) {
      if (typeof coin.price === 'number') {
        pricesById.set(coin.id, coin.price)
      }
    }
  }

  const today = getToday()

  let fetched = 0
  let skipped = 0

  for (const ticker of tickerList) {
    const price = pricesById.get(ticker.sourceId)

    // Tickers ranked below the fetched pages keep whatever they already have.
    // Marking them unavailable here would erase good prices on every sweep.
    if (price === undefined) {
      skipped++
      continue
    }

    await upsertPrice({
      tickerId: ticker.id,
      date: today,
      price,
      available: true,
      source: ticker.source,
    })

    fetched++
  }

  console.log(`[fetchCoinstats] Fetched ${fetched}, out of range ${skipped}`)
}
