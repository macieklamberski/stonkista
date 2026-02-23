import { and, desc, eq, lte } from 'drizzle-orm'
import { rates } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import type { Rate } from '../types/schemas.ts'
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
  entries: Array<{ date: string; price: number }>,
  fromCurrency: string,
  toCurrency: string,
): Promise<Array<{ date: string; price: number }>> => {
  const result: Array<{ date: string; price: number }> = []

  for (const entry of entries) {
    const converted = await convertPrice(entry.price, fromCurrency, toCurrency, entry.date)

    if (converted !== undefined) {
      result.push({ date: entry.date, price: converted })
    }
  }

  return result
}
