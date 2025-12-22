import { and, eq } from 'drizzle-orm'
import { rates } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { fetchHistorical, fetchLatest } from '../sources/frankfurter.ts'
import { getToday } from '../utils/dates.ts'

export type FetchFrankfurterData = {
  baseCurrency: string
  fromDate?: string
}

export const fetchFrankfurter = async (data: FetchFrankfurterData) => {
  // Frankfurter uses the same endpoint for latest and historical.
  // Pass 'latest' for today, or specific date for historical.
  const date = data.fromDate ?? getToday()
  const rateData = data.fromDate
    ? await fetchHistorical(data.baseCurrency, data.fromDate)
    : await fetchLatest(data.baseCurrency)

  if (!rateData) {
    console.error(`[fetchFrankfurter] Failed to fetch rates for ${data.baseCurrency} on ${date}`)
    return
  }

  let inserted = 0

  for (const [currency, rate] of Object.entries(rateData.rates)) {
    const existing = await db._query.rates.findFirst({
      where: and(
        eq(rates.date, rateData.date),
        eq(rates.fromCurrency, data.baseCurrency.toUpperCase()),
        eq(rates.toCurrency, currency),
      ),
    })

    if (existing) {
      continue
    }

    await db.insert(rates).values({
      date: rateData.date,
      fromCurrency: data.baseCurrency.toUpperCase(),
      toCurrency: currency,
      rate: rate.toString(),
      fetchedAt: new Date(),
    })

    inserted++
  }

  console.log(
    `[fetchFrankfurter] Fetched ${inserted} rates for ${data.baseCurrency} on ${rateData.date}`,
  )
}
