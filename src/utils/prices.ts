import { prices } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import type { NewPrice } from '../types/schemas.ts'

const stripTrailingZeros = (value: string) => {
  if (!value.includes('.')) {
    return value
  }

  return value.replace(/\.?0+$/, '')
}

export const formatPrice = (price: string | number, locale?: string) => {
  const significantDigits = 10
  const num = typeof price === 'string' ? parseFloat(price) : price

  if (num === 0 || !Number.isFinite(num)) {
    return '0'
  }

  // Use toPrecision for significant digits, then convert scientific notation to decimal.
  const precise = Number(num.toPrecision(significantDigits))

  let formatted: string
  if (precise !== 0 && Math.abs(precise) < 1) {
    const decimalPlaces =
      Math.max(0, -Math.floor(Math.log10(Math.abs(precise)))) + significantDigits - 1
    formatted = stripTrailingZeros(precise.toFixed(decimalPlaces))
  } else {
    formatted = stripTrailingZeros(precise.toString())
  }

  if (locale) {
    return Number(formatted).toLocaleString(locale, {
      useGrouping: false,
      maximumFractionDigits: 20,
    })
  }

  return formatted
}

export type UpsertPriceParams = Omit<NewPrice, 'id' | 'fetchedAt' | 'price'> & {
  price: number | null
}

export const upsertPrice = async (params: UpsertPriceParams) => {
  const price = params.price?.toString() ?? null

  await db
    .insert(prices)
    .values({
      tickerId: params.tickerId,
      date: params.date,
      price,
      available: params.available,
      fetchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [prices.tickerId, prices.date],
      set: {
        price,
        available: params.available,
        fetchedAt: new Date(),
      },
    })
}
