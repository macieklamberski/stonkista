import { describe, expect, it } from 'bun:test'
import { mapInstrumentType } from './yahoo.ts'

describe('mapInstrumentType', () => {
  it('should return etf for etf type', () => {
    expect(mapInstrumentType('etf')).toBe('etf')
  })

  it('should return etf case-insensitively', () => {
    expect(mapInstrumentType('ETF')).toBe('etf')
    expect(mapInstrumentType('Etf')).toBe('etf')
  })

  it('should return commodity for future type', () => {
    expect(mapInstrumentType('future')).toBe('commodity')
    expect(mapInstrumentType('FUTURE')).toBe('commodity')
  })

  it('should return undefined for cryptocurrency type', () => {
    expect(mapInstrumentType('cryptocurrency')).toBeUndefined()
    expect(mapInstrumentType('CRYPTOCURRENCY')).toBeUndefined()
  })

  it('should return stock for equity and unknown types', () => {
    expect(mapInstrumentType('equity')).toBe('stock')
    expect(mapInstrumentType('unknown')).toBe('stock')
    expect(mapInstrumentType('bond')).toBe('stock')
  })

  it('should return stock when undefined', () => {
    expect(mapInstrumentType(undefined)).toBe('stock')
    expect(mapInstrumentType()).toBe('stock')
  })
})
