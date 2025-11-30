import { describe, expect, it } from 'bun:test'
import { formatPrice } from './prices.ts'

describe('formatPrice', () => {
  describe('with string input (DB precision preserved)', () => {
    it('should strip trailing zeros', () => {
      expect(formatPrice('123.45000000000000')).toBe('123.45')
      expect(formatPrice('10.50000000000000')).toBe('10.5')
      expect(formatPrice('100.00000000000000')).toBe('100')
      expect(formatPrice('1.00000000000000')).toBe('1')
    })

    it('should preserve full precision for small crypto prices', () => {
      expect(formatPrice('0.0000000119700000')).toBe('0.00000001197')
      expect(formatPrice('0.0000000366510000')).toBe('0.000000036651')
      expect(formatPrice('0.0000000100000000')).toBe('0.00000001')
    })

    it('should handle large prices', () => {
      expect(formatPrice('99999.99000000000000')).toBe('99999.99')
      expect(formatPrice('100000.00000000000000')).toBe('100000')
    })

    it('should handle zero', () => {
      expect(formatPrice('0.0000000000000000')).toBe('0')
    })
  })

  describe('with number input (currency conversion)', () => {
    it('should format regular prices', () => {
      expect(formatPrice(123.45)).toBe('123.45')
      expect(formatPrice(100)).toBe('100')
      expect(formatPrice(10.5)).toBe('10.5')
    })

    it('should handle very small crypto prices', () => {
      expect(formatPrice(0.00000001197)).toBe('0.00000001197')
      expect(formatPrice(1e-8)).toBe('0.00000001')
    })

    it('should handle zero', () => {
      expect(formatPrice(0)).toBe('0')
    })
  })
})
