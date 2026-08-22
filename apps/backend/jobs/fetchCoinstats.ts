import { eq } from 'drizzle-orm'
import { pages } from '../constants/coinstats.ts'
import { tickers } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { fetchCoinsPage } from '../sources/coinstats.ts'
import { getToday } from '../utils/dates.ts'
import { upsertPrice } from '../utils/prices.ts'

export const fetchCoinstats = async () => {
  const tickerList = await db.select().from(tickers).where(eq(tickers.source, 'coinstats'))

  if (tickerList.length === 0) {
    return
  }

  const pricesById = new Map<string, number>()

  for (let page = 1; page <= pages; page++) {
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
