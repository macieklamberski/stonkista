import { tickers } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { cryptocompareQueue } from '../queues/cryptocompare.ts'
import { yahooQueue } from '../queues/yahoo.ts'
import { chunk } from '../utils/arrays.ts'

// CryptoCompare pricemulti endpoint has 300 char limit on fsyms param.
const CRYPTOCOMPARE_BATCH_SIZE = 50

export const scrapeTickers = async () => {
  const allTickers = await db.select().from(tickers)

  const yahooTickers = allTickers.filter((t) => t.source === 'yahoo')
  const cryptocompareTickers = allTickers.filter((t) => t.source === 'cryptocompare')

  // Yahoo: individual jobs per ticker (no fromDate = fetch latest).
  for (const ticker of yahooTickers) {
    await yahooQueue.add('fetchYahoo', { tickerId: ticker.id })
  }

  // CryptoCompare: batch jobs (~100 tickers per job).
  const cryptocompareBatches = chunk(cryptocompareTickers, CRYPTOCOMPARE_BATCH_SIZE)

  for (const batch of cryptocompareBatches) {
    const tickerIds = batch.map((t) => t.id)
    await cryptocompareQueue.add('fetchCryptocompare', { tickerIds })
  }

  console.log(
    `[scrapeTickers] Scheduled ${yahooTickers.length} Yahoo, ${cryptocompareBatches.length} CryptoCompare jobs`,
  )
}
