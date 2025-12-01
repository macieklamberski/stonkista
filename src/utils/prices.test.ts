import { describe, expect, it } from 'bun:test'
import { formatPrice } from './prices.ts'

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
})
