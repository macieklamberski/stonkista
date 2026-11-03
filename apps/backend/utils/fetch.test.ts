import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { fetchUrl, HttpError } from './fetch.ts'

describe('fetchUrl', () => {
  beforeEach(() => mock.restore())

  it('should return response when request succeeds', async () => {
    const value = new Response('ok', { status: 200 })
    spyOn(globalThis, 'fetch').mockResolvedValue(value)

    expect(await fetchUrl('https://example.com')).toBe(value)
  })

  it('should throw when response is not ok', () => {
    spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }))
    const throwing = () => fetchUrl('https://example.com')

    expect(throwing()).rejects.toThrow('HTTP 404')
  })

  it('should throw HttpError carrying the response status', () => {
    spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 429 }))
    const throwing = () => fetchUrl('https://example.com')

    expect(throwing()).rejects.toThrow(HttpError)
    expect(throwing()).rejects.toMatchObject({ status: 429 })
  })
})
