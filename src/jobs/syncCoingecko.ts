import { and, eq, notInArray } from 'drizzle-orm'
import { tickers } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { fetchTopCoins } from '../sources/coingecko.ts'

export const syncCoingecko = async () => {
  const limit = 5000
  const coins = await fetchTopCoins(limit)

  if (coins.length === 0) {
    console.error('[syncCoingecko] No coins fetched')
    return
  }

  const sourceIds = coins.map((coin) => coin.id)
  let inserted = 0
  let updated = 0

  for (const coin of coins) {
    const existing = await db._query.tickers.findFirst({
      where: and(eq(tickers.source, 'coingecko'), eq(tickers.sourceId, coin.id)),
    })

    if (existing) {
      // Update existing ticker.
      await db
        .update(tickers)
        .set({
          symbol: coin.symbol,
          name: coin.name,
          active: true,
        })
        .where(eq(tickers.id, existing.id))

      updated++
    } else {
      // Insert new ticker.
      await db.insert(tickers).values({
        symbol: coin.symbol,
        name: coin.name,
        type: 'crypto',
        currency: 'USD',
        source: 'coingecko',
        sourceId: coin.id,
        active: true,
      })

      inserted++
    }
  }

  // Mark tickers not in list as inactive.
  await db
    .update(tickers)
    .set({ active: false })
    .where(
      and(
        eq(tickers.source, 'coingecko'),
        eq(tickers.active, true),
        notInArray(tickers.sourceId, sourceIds),
      ),
    )

  console.log(`[syncCoingecko] Inserted ${inserted}, updated ${updated}`)
}
