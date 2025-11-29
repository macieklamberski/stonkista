import { db } from '../instances/database.ts'
import { tickerQueue } from '../queues/ticker.ts'
import { getToday } from '../utils/dates.ts'

export const scrapeTickers = async () => {
  const today = getToday()
  const allTickers = await db.query.tickers.findMany()

  for (const ticker of allTickers) {
    await tickerQueue.add('scrapeTicker', { tickerId: ticker.id, date: today })
  }

  console.log(`[ticker] Scheduled ${allTickers.length} jobs for ${today}`)
}
