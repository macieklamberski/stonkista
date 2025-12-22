import { db } from '../instances/database.ts'
import { frankfurterQueue } from '../queues/frankfurter.ts'

export const scrapeCurrencies = async () => {
  const allTickers = await db._query.tickers.findMany({ columns: { currency: true } })
  const currencies = [...new Set(allTickers.map((t) => t.currency))]

  // No fromDate = fetch latest rates.
  for (const currency of currencies) {
    await frankfurterQueue.add('fetchFrankfurter', { baseCurrency: currency })
  }

  console.log(`[scrapeCurrencies] Scheduled ${currencies.length} Frankfurter jobs`)
}
