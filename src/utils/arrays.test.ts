import { describe, expect, it } from 'bun:test'
import { chunk } from './arrays.ts'

describe('chunk', () => {
  it('should split array into even chunks', () => {
    const value = [1, 2, 3, 4, 5, 6]
    const expected = [
      [1, 2],
      [3, 4],
      [5, 6],
    ]

    expect(chunk(value, 2)).toEqual(expected)
  })

  it('should handle uneven remainder', () => {
    const value = [1, 2, 3, 4, 5]
    const expected = [[1, 2], [3, 4], [5]]

    expect(chunk(value, 2)).toEqual(expected)
  })

  it('should return single chunk when size exceeds array length', () => {
    const value = [1, 2, 3]
    const expected = [[1, 2, 3]]

    expect(chunk(value, 10)).toEqual(expected)
  })

  it('should return individual elements when size is 1', () => {
    const value = [1, 2, 3]
    const expected = [[1], [2], [3]]

    expect(chunk(value, 1)).toEqual(expected)
  })

  it('should return empty array for empty input', () => {
    expect(chunk([], 3)).toEqual([])
  })
})
