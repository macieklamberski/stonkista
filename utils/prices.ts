import { prices } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import type { NewPrice } from '../types/schemas.ts'

export const formatPrice = (price: string | number) => {
  if (typeof price === 'string') {
    return price.replace(/\.?0+$/, '')
  }

  // For numbers, use toPrecision(15) to limit significant digits and avoid FP artifacts.
  // Handle scientific notation for small numbers by converting back through toFixed.
  const precise = price.toPrecision(15)

  if (precise.includes('e')) {
    return parseFloat(precise)
      .toFixed(16)
      .replace(/\.?0+$/, '')
  }

  return parseFloat(precise).toString()
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
