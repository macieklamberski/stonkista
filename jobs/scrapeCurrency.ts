import { rates } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { frankfurter } from '../sources/frankfurter.ts'

export type ScrapeCurrencyData = {
  baseCurrency: string
  date: string // YYYY-MM-DD
}

export const scrapeCurrency = async (data: ScrapeCurrencyData) => {
  const rateData = await frankfurter.fetchHistorical(data.baseCurrency, data.date)

  if (!rateData) {
    console.error(`[scrapeCurrency] Failed to fetch rates for ${data.baseCurrency} on ${data.date}`)
    return
  }

  const values = Object.entries(rateData.rates).map(([currency, rate]) => ({
    date: data.date,
    fromCurrency: data.baseCurrency.toUpperCase(),
    toCurrency: currency,
    rate: rate.toString(),
    fetchedAt: new Date(),
  }))

  for (const value of values) {
    await db
      .insert(rates)
      .values(value)
      .onConflictDoUpdate({
        target: [rates.date, rates.fromCurrency, rates.toCurrency],
        set: {
          rate: value.rate,
          fetchedAt: new Date(),
        },
      })
  }

  console.log(
    `[scrapeCurrency] Scraped ${Object.keys(rateData.rates).length} rates for ${data.baseCurrency} on ${data.date}`,
  )
}
