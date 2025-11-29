import { and, eq } from 'drizzle-orm'
import { rates } from '../database/tables.ts'
import { db } from '../instances/database.ts'

export const isCurrencyCode = (value: string): boolean => {
  return /^[A-Z]{3}$/i.test(value)
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

  // Try direct conversion
  const directRate = await db.query.rates.findFirst({
    where: and(eq(rates.date, date), eq(rates.fromCurrency, from), eq(rates.toCurrency, to)),
  })

  if (directRate) {
    return price * Number(directRate.rate)
  }

  // Try inverse conversion
  const inverseRate = await db.query.rates.findFirst({
    where: and(eq(rates.date, date), eq(rates.fromCurrency, to), eq(rates.toCurrency, from)),
  })

  if (inverseRate) {
    return price / Number(inverseRate.rate)
  }

  // Try conversion through USD as intermediate
  if (from !== 'USD' && to !== 'USD') {
    const fromToUsd = await db.query.rates.findFirst({
      where: and(eq(rates.date, date), eq(rates.fromCurrency, from), eq(rates.toCurrency, 'USD')),
    })

    const usdToTarget = await db.query.rates.findFirst({
      where: and(eq(rates.date, date), eq(rates.fromCurrency, 'USD'), eq(rates.toCurrency, to)),
    })

    if (fromToUsd && usdToTarget) {
      return price * Number(fromToUsd.rate) * Number(usdToTarget.rate)
    }
  }
}
