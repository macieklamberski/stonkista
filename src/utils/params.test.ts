import { describe, expect, it } from 'bun:test'
import type { DateParam, ParsedCurrencyDateParams } from './params.ts'
import { parseCurrencyDateParams, parseDateParam } from './params.ts'

describe('parseDateParam', () => {
  it('should return date for valid YYYY-MM-DD string', () => {
    const expected: DateParam = { date: '2024-01-15' }

    expect(parseDateParam('2024-01-15')).toEqual(expected)
  })

  it('should return dateRange for valid date range string', () => {
    const expected: DateParam = {
      dateRange: { dateFrom: '2024-01-01', dateTo: '2024-01-31' },
    }

    expect(parseDateParam('2024-01-01..2024-01-31')).toEqual(expected)
  })

  it('should return undefined for invalid string', () => {
    expect(parseDateParam('not-a-date')).toBeUndefined()
    expect(parseDateParam('')).toBeUndefined()
    expect(parseDateParam('2024-13-01')).toBeUndefined()
  })

  it('should return undefined for reversed date range', () => {
    expect(parseDateParam('2024-01-31..2024-01-01')).toBeUndefined()
  })

  it('should return undefined for future single date', () => {
    expect(parseDateParam('2099-01-01')).toBeUndefined()
  })

  it('should return undefined for range with future dateTo', () => {
    expect(parseDateParam('2020-01-01..2099-12-31')).toBeUndefined()
  })

  it('should return undefined for entirely future range', () => {
    expect(parseDateParam('2099-01-01..2099-12-31')).toBeUndefined()
  })

  it('should return date for today', () => {
    const today = new Date().toISOString().split('T')[0]
    const expected: DateParam = { date: today }

    expect(parseDateParam(today)).toEqual(expected)
  })
})

describe('parseCurrencyDateParams', () => {
  it('should return today with no currency when no args provided', () => {
    const value = parseCurrencyDateParams()

    expect(value).toEqual({
      currency: undefined,
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    })
  })

  it('should return date with no currency for date-only arg', () => {
    const expected: ParsedCurrencyDateParams = {
      currency: undefined,
      date: '2024-06-15',
    }

    expect(parseCurrencyDateParams('2024-06-15')).toEqual(expected)
  })

  it('should return dateRange with no currency for date-range-only arg', () => {
    const expected: ParsedCurrencyDateParams = {
      currency: undefined,
      dateRange: { dateFrom: '2024-01-01', dateTo: '2024-01-31' },
    }

    expect(parseCurrencyDateParams('2024-01-01..2024-01-31')).toEqual(expected)
  })

  it('should return today with uppercased currency for currency-only arg', () => {
    const value = parseCurrencyDateParams('pln')

    expect(value).toEqual({
      currency: 'PLN',
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    })
  })

  it('should return date with currency when both provided', () => {
    const expected: ParsedCurrencyDateParams = {
      currency: 'PLN',
      date: '2024-06-15',
    }

    expect(parseCurrencyDateParams('pln', '2024-06-15')).toEqual(expected)
  })

  it('should return dateRange with currency when both provided', () => {
    const expected: ParsedCurrencyDateParams = {
      currency: 'USD',
      dateRange: { dateFrom: '2024-01-01', dateTo: '2024-01-31' },
    }

    expect(parseCurrencyDateParams('usd', '2024-01-01..2024-01-31')).toEqual(expected)
  })

  it('should return undefined when date arg is invalid', () => {
    expect(parseCurrencyDateParams('pln', 'not-a-date')).toBeUndefined()
  })

  it('should return undefined when single arg is neither date nor currency', () => {
    expect(parseCurrencyDateParams('invalid')).toBeUndefined()
    expect(parseCurrencyDateParams('1234')).toBeUndefined()
  })
})
