import { tickers } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { coinstatsQueue } from '../queues/coinstats.ts'
import { yahooQueue } from '../queues/yahoo.ts'

export const scrapeTickers = async () => {
  const allTickers = await db.select().from(tickers)

  const yahooTickers = allTickers.filter((t) => t.source === 'yahoo')
  const coinstatsTickers = allTickers.filter((t) => t.source === 'coinstats')

  // Yahoo: individual jobs per ticker (no fromDate = fetch latest).
  for (const ticker of yahooTickers) {
    await yahooQueue.add('fetchYahoo', { tickerId: ticker.id })
  }

  // CoinStats: one job per sweep, which pages the ranked coin list itself.
  if (coinstatsTickers.length > 0) {
    await coinstatsQueue.add('fetchCoinstats', undefined)
  }

  console.log(
    `[scrapeTickers] Scheduled ${yahooTickers.length} Yahoo, ${coinstatsTickers.length > 0 ? 1 : 0} CoinStats jobs`,
  )
}
