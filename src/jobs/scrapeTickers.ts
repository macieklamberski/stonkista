import { tickers } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { coingeckoQueue } from '../queues/coingecko.ts'
import { yahooQueue } from '../queues/yahoo.ts'
import { chunk } from '../utils/arrays.ts'

const COINGECKO_BATCH_SIZE = 100

export const scrapeTickers = async () => {
  const allTickers = await db.select().from(tickers)

  const yahooTickers = allTickers.filter((t) => t.source === 'yahoo')
  const coingeckoTickers = allTickers.filter((t) => t.source === 'coingecko')

  // Yahoo: individual jobs per ticker (no fromDate = fetch latest).
  for (const ticker of yahooTickers) {
    await yahooQueue.add('fetchYahoo', { tickerId: ticker.id })
  }

  // CoinGecko: batch jobs (~100 tickers per job).
  const coingeckoBatches = chunk(coingeckoTickers, COINGECKO_BATCH_SIZE)

  for (const batch of coingeckoBatches) {
    const tickerIds = batch.map((t) => t.id)
    await coingeckoQueue.add('fetchCoingecko', { tickerIds })
  }

  console.log(
    `[scrapeTickers] Scheduled ${yahooTickers.length} Yahoo jobs, ${coingeckoBatches.length} CoinGecko jobs`,
  )
}
