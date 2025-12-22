import { db } from '../instances/database.ts'
import { coingeckoQueue } from '../queues/coingecko.ts'
import { yahooQueue } from '../queues/yahoo.ts'

const COINGECKO_BATCH_SIZE = 100

const chunk = <T>(array: Array<T>, size: number): Array<Array<T>> => {
  const chunks: Array<Array<T>> = []

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }

  return chunks
}

export const scrapeTickers = async () => {
  const allTickers = await db._query.tickers.findMany()

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
