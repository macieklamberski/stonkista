import { prices } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import type { NewPrice } from '../types/schemas.ts'

// Format price with dynamic precision, stripping trailing zeros.
export const formatPrice = (price: number) => {
  return price.toFixed(16).replace(/\.?0+$/, '')
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
