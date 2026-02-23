import { and, asc, desc, eq, gte, lte } from 'drizzle-orm'
import { rates } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import type { DatedPrice, Rate } from '../types/schemas.ts'
import { formatDate, generateDateRange } from './dates.ts'
import { findOrSkip } from './queries.ts'

export const isCurrencyCode = (value: string): boolean => {
  return /^[A-Z]{3}$/i.test(value)
}

export const findRate = async (
  from: string,
  to: string,
  date: string,
): Promise<Rate | undefined> => {
  // Try exact match first.
  let rate = await findOrSkip(
    db
      .select()
      .from(rates)
      .where(and(eq(rates.fromCurrency, from), eq(rates.toCurrency, to), eq(rates.date, date)))
      .limit(1),
  )

  // Fallback to closest previous date (handles weekends/holidays).
  if (!rate) {
    rate = await findOrSkip(
      db
        .select()
        .from(rates)
        .where(and(eq(rates.fromCurrency, from), eq(rates.toCurrency, to), lte(rates.date, date)))
        .orderBy(desc(rates.date))
        .limit(1),
    )
  }

  return rate
}

export const convertPrice = async (
  price: number,
  fromCurrency: string,
  toCurrency: string,
  date: string,
): Promise<number | undefined> => {
  const from = fromCurrency.toUpperCase()
  const to = toCurrency.toUpperCase()

  if (from === to) {
    return price
  }

  // Try direct conversion.
  const directRate = await findRate(from, to, date)

  if (directRate) {
    return price * Number(directRate.rate)
  }

  // Try inverse conversion.
  const inverseRate = await findRate(to, from, date)

  if (inverseRate) {
    return price / Number(inverseRate.rate)
  }

  // Try conversion through EUR as intermediate as only EUR rates are tracked.
  if (from !== 'EUR' && to !== 'EUR') {
    const fromToEur = await findRate('EUR', from, date)
    const eurToTarget = await findRate('EUR', to, date)

    if (fromToEur && eurToTarget) {
      return (price / Number(fromToEur.rate)) * Number(eurToTarget.rate)
    }
  }
}

export const convertPrices = async (
  entries: Array<DatedPrice>,
  fromCurrency: string,
  toCurrency: string,
): Promise<Array<DatedPrice>> => {
  const from = fromCurrency.toUpperCase()
  const to = toCurrency.toUpperCase()

  if (from === to || entries.length === 0) {
    return entries
  }

  const dateFrom = entries[0].date
  const dateTo = entries[entries.length - 1].date
  const ratesByDate = await fetchRatesByDate(from, to, dateFrom, dateTo)
  const result: Array<DatedPrice> = []

  for (const entry of entries) {
    const rate = ratesByDate.get(entry.date)

    if (rate !== undefined) {
      result.push({ date: entry.date, price: entry.price * rate })
    }
  }

  return result
}

export const fetchRateSeries = async (
  fromCurrency: string,
  toCurrency: string,
  dateFrom: string,
  dateTo: string,
): Promise<Array<{ date: string; rate: number }>> => {
  // Buffer 7 days before dateFrom to handle fallback for first days in range.
  const bufferDate = new Date(`${dateFrom}T00:00:00Z`)
  bufferDate.setUTCDate(bufferDate.getUTCDate() - 7)
  const bufferDateString = formatDate(bufferDate)

  const rows = await db
    .select()
    .from(rates)
    .where(
      and(
        eq(rates.fromCurrency, fromCurrency),
        eq(rates.toCurrency, toCurrency),
        gte(rates.date, bufferDateString),
        lte(rates.date, dateTo),
      ),
    )
    .orderBy(asc(rates.date))

  return rows.map((row) => {
    return { date: row.date, rate: Number(row.rate) }
  })
}

export const findLatestRate = (
  series: Array<{ date: string; rate: number }>,
  date: string,
): number | undefined => {
  let latest: number | undefined

  for (const entry of series) {
    if (entry.date <= date) {
      latest = entry.rate
    }
  }

  return latest
}

// Builds a map of date -> conversion rate for the given currency pair and date range.
const fetchRatesByDate = async (
  from: string,
  to: string,
  dateFrom: string,
  dateTo: string,
): Promise<Map<string, number>> => {
  const dates = generateDateRange(dateFrom, dateTo)
  const map = new Map<string, number>()

  if (from === 'EUR' || to === 'EUR') {
    // One currency is EUR — single query.
    const pair = from === 'EUR' ? { from: 'EUR', to } : { from: 'EUR', to: from }
    const series = await fetchRateSeries(pair.from, pair.to, dateFrom, dateTo)

    for (const date of dates) {
      const rate = findLatestRate(series, date)

      if (rate !== undefined) {
        // EUR->X: multiply by rate. X->EUR: divide by rate.
        map.set(date, from === 'EUR' ? rate : 1 / rate)
      }
    }
  } else {
    // Neither is EUR — two queries through EUR intermediate.
    const [fromSeries, toSeries] = await Promise.all([
      fetchRateSeries('EUR', from, dateFrom, dateTo),
      fetchRateSeries('EUR', to, dateFrom, dateTo),
    ])

    for (const date of dates) {
      const fromRate = findLatestRate(fromSeries, date)
      const toRate = findLatestRate(toSeries, date)

      if (fromRate !== undefined && toRate !== undefined) {
        map.set(date, toRate / fromRate)
      }
    }
  }

  return map
}

export const findRatesInRange = async (
  fromCurrency: string,
  toCurrency: string,
  dateFrom: string,
  dateTo: string,
): Promise<Array<DatedPrice>> => {
  const from = fromCurrency.toUpperCase()
  const to = toCurrency.toUpperCase()

  if (from === to) {
    return generateDateRange(dateFrom, dateTo).map((date) => {
      return { date, price: 1 }
    })
  }

  const ratesByDate = await fetchRatesByDate(from, to, dateFrom, dateTo)
  const result: Array<DatedPrice> = []

  for (const [date, rate] of ratesByDate) {
    result.push({ date, price: rate })
  }

  return result
}
