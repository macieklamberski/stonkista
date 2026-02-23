import { beforeEach, describe, expect, it, mock } from 'bun:test'

let mockDbRows: Array<{
  date: string
  price: string | null
  available: boolean
  id: number
  tickerId: number
  fetchedAt: Date
}> = []

mock.module('../instances/database.ts', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => Promise.resolve([...mockDbRows]),
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => Promise.resolve(),
      }),
    }),
  },
}))

import { findPricesInRange, formatPrice } from './prices.ts'

describe('formatPrice', () => {
  it('should limit to 10 significant digits', () => {
    expect(formatPrice('123.4567890123')).toBe('123.456789')
    expect(formatPrice(123.4567890123)).toBe('123.456789')
    expect(formatPrice('0.0000000117264327')).toBe('0.0000000117264327')
  })

  it('should strip trailing zeros', () => {
    expect(formatPrice('123.45000000000000')).toBe('123.45')
    expect(formatPrice('10.50000000000000')).toBe('10.5')
    expect(formatPrice('100.00000000000000')).toBe('100')
    expect(formatPrice('1.00000000000000')).toBe('1')
  })

  it('should handle small crypto prices', () => {
    expect(formatPrice('0.0000000119700000')).toBe('0.00000001197')
    expect(formatPrice('0.0000000100000000')).toBe('0.00000001')
    expect(formatPrice(0.00000001197)).toBe('0.00000001197')
    expect(formatPrice(1e-8)).toBe('0.00000001')
  })

  it('should handle large prices', () => {
    expect(formatPrice('99999.99000000000000')).toBe('99999.99')
    expect(formatPrice('100000.00000000000000')).toBe('100000')
    expect(formatPrice(98234.5678)).toBe('98234.5678')
  })

  it('should handle zero', () => {
    expect(formatPrice('0.0000000000000000')).toBe('0')
    expect(formatPrice(0)).toBe('0')
  })

  it('should format with locale', () => {
    expect(formatPrice('1234.56', 'de')).toBe('1234,56')
    expect(formatPrice(1234.56, 'de')).toBe('1234,56')
  })

  it('should return zero for NaN and Infinity', () => {
    expect(formatPrice(Number.NaN)).toBe('0')
    expect(formatPrice(Number.POSITIVE_INFINITY)).toBe('0')
    expect(formatPrice(Number.NEGATIVE_INFINITY)).toBe('0')
  })

  it('should handle negative prices', () => {
    expect(formatPrice(-123.45)).toBe('-123.45')
    expect(formatPrice('-0.005')).toBe('-0.005')
  })
})

const row = (date: string, price: string | null) => ({
  id: 1,
  tickerId: 1,
  date,
  price,
  available: true,
  fetchedAt: new Date(),
})

describe('findPricesInRange', () => {
  beforeEach(() => {
    mockDbRows = []
  })

  it('should return prices for each day with fallback for gaps', async () => {
    mockDbRows = [row('2024-01-01', '100.5'), row('2024-01-02', '101'), row('2024-01-04', '102')]
    const expected = [
      { date: '2024-01-01', price: 100.5 },
      { date: '2024-01-02', price: 101 },
      { date: '2024-01-03', price: 101 },
      { date: '2024-01-04', price: 102 },
      { date: '2024-01-05', price: 102 },
    ]

    expect(await findPricesInRange(1, '2024-01-01', '2024-01-05')).toEqual(expected)
  })

  it('should use buffer to resolve first day fallback', async () => {
    mockDbRows = [row('2023-12-29', '99')]
    const expected = [
      { date: '2024-01-01', price: 99 },
      { date: '2024-01-02', price: 99 },
    ]

    expect(await findPricesInRange(1, '2024-01-01', '2024-01-02')).toEqual(expected)
  })

  it('should omit dates before any available price', async () => {
    mockDbRows = [row('2024-01-03', '100')]
    const expected = [
      { date: '2024-01-03', price: 100 },
      { date: '2024-01-04', price: 100 },
      { date: '2024-01-05', price: 100 },
    ]

    expect(await findPricesInRange(1, '2024-01-01', '2024-01-05')).toEqual(expected)
  })

  it('should return empty array when no prices exist', async () => {
    mockDbRows = []

    expect(await findPricesInRange(1, '2024-01-01', '2024-01-05')).toEqual([])
  })

  it('should handle single-day range', async () => {
    mockDbRows = [row('2024-01-15', '200')]
    const expected = [{ date: '2024-01-15', price: 200 }]

    expect(await findPricesInRange(1, '2024-01-15', '2024-01-15')).toEqual(expected)
  })

  it('should skip rows with null price', async () => {
    mockDbRows = [row('2024-01-01', null), row('2024-01-02', '150')]
    const expected = [
      { date: '2024-01-02', price: 150 },
      { date: '2024-01-03', price: 150 },
    ]

    expect(await findPricesInRange(1, '2024-01-01', '2024-01-03')).toEqual(expected)
  })

  it('should use latest price when multiple exist before range start', async () => {
    mockDbRows = [row('2023-12-27', '90'), row('2023-12-28', '95'), row('2023-12-29', '98')]
    const expected = [
      { date: '2024-01-01', price: 98 },
      { date: '2024-01-02', price: 98 },
    ]

    expect(await findPricesInRange(1, '2024-01-01', '2024-01-02')).toEqual(expected)
  })
})
