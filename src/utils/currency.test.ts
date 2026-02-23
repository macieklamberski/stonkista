import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import type { Rate } from '../types/schemas.ts'
import * as currency from './currency.ts'
import { convertPrice, convertPrices, isCurrencyCode } from './currency.ts'

describe('isCurrencyCode', () => {
  it('should return true for valid 3-letter currency codes', () => {
    expect(isCurrencyCode('USD')).toBe(true)
    expect(isCurrencyCode('EUR')).toBe(true)
    expect(isCurrencyCode('PLN')).toBe(true)
    expect(isCurrencyCode('GBP')).toBe(true)
  })

  it('should return true for lowercase codes', () => {
    expect(isCurrencyCode('usd')).toBe(true)
    expect(isCurrencyCode('eur')).toBe(true)
  })

  it('should return true for mixed case codes', () => {
    expect(isCurrencyCode('Usd')).toBe(true)
    expect(isCurrencyCode('pLn')).toBe(true)
  })

  it('should return false for codes with wrong length', () => {
    expect(isCurrencyCode('US')).toBe(false)
    expect(isCurrencyCode('USDD')).toBe(false)
    expect(isCurrencyCode('')).toBe(false)
  })

  it('should return false for codes with numbers', () => {
    expect(isCurrencyCode('US1')).toBe(false)
    expect(isCurrencyCode('123')).toBe(false)
  })

  it('should return false for codes with special characters', () => {
    expect(isCurrencyCode('US$')).toBe(false)
    expect(isCurrencyCode('U-D')).toBe(false)
  })
})

describe('convertPrice', () => {
  const mockRates = (ratesMap: Record<string, string>) => {
    spyOn(currency, 'findRate').mockImplementation(async (from, to) => {
      const rate = ratesMap[`${from}-${to}`]
      return rate ? ({ rate } as Rate) : undefined
    })
  }

  beforeEach(() => mock.restore())

  it('should return same price when currencies are equal', async () => {
    const value = await convertPrice(100, 'USD', 'USD', '2024-01-15')

    expect(value).toBe(100)
  })

  it('should convert using direct rate', async () => {
    mockRates({ 'USD-PLN': '4.5' })

    const value = await convertPrice(100, 'USD', 'PLN', '2024-01-15')

    expect(value).toBe(450)
  })

  it('should convert using inverse rate when direct not found', async () => {
    mockRates({ 'PLN-USD': '0.25' })

    const value = await convertPrice(100, 'USD', 'PLN', '2024-01-15')

    expect(value).toBe(400)
  })

  it('should convert through EUR intermediate when no direct/inverse rate', async () => {
    mockRates({ 'EUR-USD': '1.1', 'EUR-PLN': '4.5' })

    const value = await convertPrice(100, 'USD', 'PLN', '2024-01-15')

    expect(value).toBeCloseTo(409.09, 1)
  })

  it('should return undefined when no conversion path found', async () => {
    mockRates({})

    const value = await convertPrice(100, 'USD', 'PLN', '2024-01-15')

    expect(value).toBeUndefined()
  })

  it('should handle case-insensitive currency codes', async () => {
    mockRates({ 'USD-PLN': '4.5' })

    const value = await convertPrice(100, 'usd', 'pln', '2024-01-15')

    expect(value).toBe(450)
  })

  it('should return zero when price is zero', async () => {
    mockRates({ 'USD-PLN': '4.5' })

    const value = await convertPrice(0, 'USD', 'PLN', '2024-01-15')

    expect(value).toBe(0)
  })

  it('should skip EUR intermediate when from currency is EUR', async () => {
    mockRates({ 'EUR-PLN': '4.5' })

    const value = await convertPrice(100, 'EUR', 'PLN', '2024-01-15')

    expect(value).toBe(450)
  })

  it('should skip EUR intermediate when to currency is EUR', async () => {
    mockRates({ 'USD-EUR': '0.9' })

    const value = await convertPrice(100, 'USD', 'EUR', '2024-01-15')

    expect(value).toBe(90)
  })
})

describe('convertPrices', () => {
  const mockRates = (ratesMap: Record<string, string>) => {
    spyOn(currency, 'findRate').mockImplementation(async (from, to) => {
      const rate = ratesMap[`${from}-${to}`]
      return rate ? ({ rate } as Rate) : undefined
    })
  }

  beforeEach(() => mock.restore())

  it('should convert all entries', async () => {
    mockRates({ 'USD-PLN': '4.5' })
    const entries = [
      { date: '2024-01-01', price: 100 },
      { date: '2024-01-02', price: 200 },
    ]
    const expected = [
      { date: '2024-01-01', price: 450 },
      { date: '2024-01-02', price: 900 },
    ]

    expect(await convertPrices(entries, 'USD', 'PLN')).toEqual(expected)
  })

  it('should omit entries where conversion fails', async () => {
    spyOn(currency, 'findRate').mockImplementation(async (from, to, date) => {
      if (date === '2024-01-02') {
        return undefined
      }
      const rate = ({ 'USD-PLN': '4.5' } as Record<string, string>)[`${from}-${to}`]
      return rate ? ({ rate } as Rate) : undefined
    })
    const entries = [
      { date: '2024-01-01', price: 100 },
      { date: '2024-01-02', price: 200 },
    ]
    const expected = [{ date: '2024-01-01', price: 450 }]

    expect(await convertPrices(entries, 'USD', 'PLN')).toEqual(expected)
  })

  it('should return same prices when currencies are equal', async () => {
    const entries = [
      { date: '2024-01-01', price: 100 },
      { date: '2024-01-02', price: 200 },
    ]

    expect(await convertPrices(entries, 'USD', 'USD')).toEqual(entries)
  })

  it('should return empty array for empty input', async () => {
    expect(await convertPrices([], 'USD', 'PLN')).toEqual([])
  })

  it('should convert single entry', async () => {
    mockRates({ 'USD-PLN': '4.5' })
    const entries = [{ date: '2024-01-01', price: 100 }]
    const expected = [{ date: '2024-01-01', price: 450 }]

    expect(await convertPrices(entries, 'USD', 'PLN')).toEqual(expected)
  })
})
