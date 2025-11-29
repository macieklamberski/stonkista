import { db } from '../instances/database.ts'
import { currencyQueue } from '../queues/currency.ts'
import { getToday } from '../utils/dates.ts'

export const scrapeCurrencies = async () => {
  const today = getToday()
  const allTickers = await db.query.tickers.findMany({ columns: { currency: true } })
  const currencies = [...new Set(allTickers.map((t) => t.currency))]

  for (const currency of currencies) {
    await currencyQueue.add('scrapeCurrency', { baseCurrency: currency, date: today })
  }

  console.log(`[currency] Scheduled ${currencies.length} jobs for ${today}`)
}
