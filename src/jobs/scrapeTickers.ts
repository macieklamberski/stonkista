import { tickers } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { cryptocompareQueue } from '../queues/cryptocompare.ts'
import { yahooQueue } from '../queues/yahoo.ts'
import { chunk } from '../utils/arrays.ts'

// CryptoCompare pricemulti endpoint has 300 char limit on fsyms param.
const CRYPTOCOMPARE_FSYMS_MAX_LENGTH = 300

export const scrapeTickers = async () => {
  const allTickers = await db.select().from(tickers)

  const yahooTickers = allTickers.filter((t) => t.source === 'yahoo')
  const cryptocompareTickers = allTickers.filter((t) => t.source === 'cryptocompare')

  // Yahoo: individual jobs per ticker (no fromDate = fetch latest).
  for (const ticker of yahooTickers) {
    await yahooQueue.add('fetchYahoo', { tickerId: ticker.id })
  }

  // CryptoCompare: batch by fsyms string length to stay under API limit.
  const cryptocompareBatches: Array<typeof cryptocompareTickers> = []
  let currentBatch: typeof cryptocompareTickers = []
  let currentLength = 0

  for (const ticker of cryptocompareTickers) {
    const addition = currentBatch.length === 0 ? ticker.sourceId.length : ticker.sourceId.length + 1

    if (currentLength + addition > CRYPTOCOMPARE_FSYMS_MAX_LENGTH) {
      cryptocompareBatches.push(currentBatch)
      currentBatch = [ticker]
      currentLength = ticker.sourceId.length
    } else {
      currentBatch.push(ticker)
      currentLength += addition
    }
  }

  if (currentBatch.length > 0) {
    cryptocompareBatches.push(currentBatch)
  }

  for (const batch of cryptocompareBatches) {
    const tickerIds = batch.map((t) => t.id)
    await cryptocompareQueue.add('fetchCryptocompare', { tickerIds })
  }

  console.log(
    `[scrapeTickers] Scheduled ${yahooTickers.length} Yahoo, ${cryptocompareBatches.length} CryptoCompare jobs`,
  )
}
