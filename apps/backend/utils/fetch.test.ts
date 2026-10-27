import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { fetchUrl } from './fetch.ts'

describe('fetchUrl', () => {
  beforeEach(() => mock.restore())

  it('should return response when request succeeds', async () => {
    const value = new Response('ok', { status: 200 })
    spyOn(globalThis, 'fetch').mockResolvedValue(value)

    expect(await fetchUrl('https://example.com')).toBe(value)
  })

  it('should throw when response is not ok', () => {
    spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }))

    expect(fetchUrl('https://example.com')).rejects.toThrow('HTTP 404')
  })
})
