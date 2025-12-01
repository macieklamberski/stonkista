import { describe, expect, it } from 'bun:test'
import { formatDate, getToday, isValidDate } from './dates.ts'

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
