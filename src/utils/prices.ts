import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { prices } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import type { DatedPrice, NewPrice } from '../types/schemas.ts'
import { formatDate, generateDateRange } from './dates.ts'

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

export const findPricesInRange = async (
  tickerId: number,
  dateFrom: string,
  dateTo: string,
): Promise<Array<DatedPrice>> => {
  // Buffer 7 days before dateFrom to handle fallback for first days in range.
  const bufferDate = new Date(`${dateFrom}T00:00:00Z`)
  bufferDate.setUTCDate(bufferDate.getUTCDate() - 7)
  const bufferDateString = formatDate(bufferDate)

  const rows = await db
    .select()
    .from(prices)
    .where(
      and(
        eq(prices.tickerId, tickerId),
        gte(prices.date, bufferDateString),
        lte(prices.date, dateTo),
        eq(prices.available, true),
      ),
    )
    .orderBy(asc(prices.date))

  const allDates = generateDateRange(dateFrom, dateTo)
  const result: Array<DatedPrice> = []

  for (const date of allDates) {
    // Find latest price on or before this date.
    let lastPrice: number | undefined

    for (const row of rows) {
      if (row.date <= date && row.price !== null) {
        lastPrice = Number(row.price)
      }
    }

    if (lastPrice !== undefined) {
      result.push({ date, price: lastPrice })
    }
  }

  return result
}
