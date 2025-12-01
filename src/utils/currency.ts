import { and, desc, eq, lte } from 'drizzle-orm'
import { rates } from '../database/tables.ts'
import { db } from '../instances/database.ts'

export const isCurrencyCode = (value: string): boolean => {
  return /^[A-Z]{3}$/i.test(value)
}

export const findRate = async (from: string, to: string, date: string) => {
  // Try exact match first.
  let rate = await db.query.rates.findFirst({
    where: and(eq(rates.fromCurrency, from), eq(rates.toCurrency, to), eq(rates.date, date)),
  })

  // Fallback to closest previous date (handles weekends/holidays).
  if (!rate) {
    rate = await db.query.rates.findFirst({
      where: and(eq(rates.fromCurrency, from), eq(rates.toCurrency, to), lte(rates.date, date)),
      orderBy: [desc(rates.date)],
    })
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

  // Try conversion through USD as intermediate.
  if (from !== 'USD' && to !== 'USD') {
    const fromToUsd = await findRate(from, 'USD', date)
    const usdToTarget = await findRate('USD', to, date)

    if (fromToUsd && usdToTarget) {
      return price * Number(fromToUsd.rate) * Number(usdToTarget.rate)
    }
  }
}
