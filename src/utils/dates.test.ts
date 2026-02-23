import { describe, expect, it } from 'bun:test'
import {
  formatDate,
  generateDateRange,
  getToday,
  isValidDate,
  isValidDateRange,
  parseDateRange,
} from './dates.ts'

describe('isValidDate', () => {
  it('should return true for valid YYYY-MM-DD format', () => {
    expect(isValidDate('2024-01-15')).toBe(true)
    expect(isValidDate('2024-12-31')).toBe(true)
    expect(isValidDate('2000-06-01')).toBe(true)
  })

  it('should return false for invalid format', () => {
    expect(isValidDate('01-15-2024')).toBe(false)
    expect(isValidDate('2024/01/15')).toBe(false)
    expect(isValidDate('2024.01.15')).toBe(false)
    expect(isValidDate('20240115')).toBe(false)
  })

  it('should return false for partial dates', () => {
    expect(isValidDate('2024-01')).toBe(false)
    expect(isValidDate('2024')).toBe(false)
  })

  it('should return false for invalid date values', () => {
    expect(isValidDate('2024-13-01')).toBe(false)
    expect(isValidDate('2024-00-01')).toBe(false)
    expect(isValidDate('2024-01-32')).toBe(false)
  })

  it('should return false for empty or non-date strings', () => {
    expect(isValidDate('')).toBe(false)
    expect(isValidDate('not-a-date')).toBe(false)
    expect(isValidDate('abcd-ef-gh')).toBe(false)
  })
})

describe('formatDate', () => {
  it('should format timestamp to YYYY-MM-DD', () => {
    const value = formatDate(1705320000000)

    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('should format Date object to YYYY-MM-DD', () => {
    const value = formatDate(new Date('2024-01-15T12:00:00Z'))

    expect(value).toBe('2024-01-15')
  })
})

describe('getToday', () => {
  it('should return date in YYYY-MM-DD format', () => {
    const value = getToday()

    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('isValidDateRange', () => {
  it('should return true for valid date range', () => {
    expect(isValidDateRange('2024-01-01..2024-01-31')).toBe(true)
    expect(isValidDateRange('2024-06-01..2024-06-01')).toBe(true)
  })

  it('should return false when dateFrom is after dateTo', () => {
    expect(isValidDateRange('2024-01-31..2024-01-01')).toBe(false)
  })

  it('should return false for invalid date values', () => {
    expect(isValidDateRange('2024-13-01..2024-01-31')).toBe(false)
    expect(isValidDateRange('2024-01-01..2024-13-31')).toBe(false)
  })

  it('should return false for wrong format', () => {
    expect(isValidDateRange('2024-01-01')).toBe(false)
    expect(isValidDateRange('2024-01-01...2024-01-31')).toBe(false)
    expect(isValidDateRange('2024-01-01.2024-01-31')).toBe(false)
    expect(isValidDateRange('')).toBe(false)
  })
})

describe('parseDateRange', () => {
  it('should parse valid date range', () => {
    const expected = { dateFrom: '2024-01-01', dateTo: '2024-01-31' }

    expect(parseDateRange('2024-01-01..2024-01-31')).toEqual(expected)
  })

  it('should parse same-day range', () => {
    const expected = { dateFrom: '2024-06-15', dateTo: '2024-06-15' }

    expect(parseDateRange('2024-06-15..2024-06-15')).toEqual(expected)
  })

  it('should return undefined for invalid range', () => {
    expect(parseDateRange('2024-01-31..2024-01-01')).toBeUndefined()
    expect(parseDateRange('not-a-range')).toBeUndefined()
    expect(parseDateRange('')).toBeUndefined()
  })
})

describe('generateDateRange', () => {
  it('should generate all dates in range', () => {
    const expected = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05']

    expect(generateDateRange('2024-01-01', '2024-01-05')).toEqual(expected)
  })

  it('should return single date for same-day range', () => {
    const expected = ['2024-06-15']

    expect(generateDateRange('2024-06-15', '2024-06-15')).toEqual(expected)
  })

  it('should handle month boundary', () => {
    const expected = ['2024-01-30', '2024-01-31', '2024-02-01', '2024-02-02']

    expect(generateDateRange('2024-01-30', '2024-02-02')).toEqual(expected)
  })

  it('should handle year boundary', () => {
    const expected = ['2023-12-30', '2023-12-31', '2024-01-01', '2024-01-02']

    expect(generateDateRange('2023-12-30', '2024-01-02')).toEqual(expected)
  })
})
