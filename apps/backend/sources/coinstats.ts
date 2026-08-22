import { apiKey, pageSize, proxy } from '../constants/coinstats.ts'
import type { HistoricalPriceData, PriceData } from '../types/sources.ts'
import { sleep } from '../utils/async.ts'
import { formatDate } from '../utils/dates.ts'
import { fetchUrl } from '../utils/fetch.ts'

export type Coin = {
  id: string
  symbol: string
  name: string
  rank?: number
  price?: number
}

type CoinsResponse = {
  result: Array<Coin>
}

type ChartsResponse = Array<[number, number]>

const headers = (): Record<string, string> => {
  if (!apiKey) {
    throw new Error('[CoinStats] COINSTATS_API_KEY is not set')
  }

  return { 'X-API-KEY': apiKey, accept: 'application/json' }
}

// The free plan allows 2 requests per second across every key on the account,
// so requests queue behind each other here rather than at each call site. The
// gap is process-local: a second instance would need a shared limiter.
const MIN_REQUEST_INTERVAL_MS = 600
const MAX_RETRIES = 3

let pending: Promise<unknown> = Promise.resolve()

const throttle = <T>(request: () => Promise<T>): Promise<T> => {
  const result = pending.then(request, request)

  pending = result.then(
    () => sleep(MIN_REQUEST_INTERVAL_MS),
    () => sleep(MIN_REQUEST_INTERVAL_MS),
  )

  return result
}

const request = async (url: string): Promise<Response> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await throttle(() => fetchUrl(url, { proxy, headers: headers() }))
    } catch (error) {
      const rateLimited = error instanceof Error && error.message === 'HTTP 429'

      if (!rateLimited || attempt >= MAX_RETRIES) {
        throw error
      }

      // Backing off inside the request keeps a rate-limited page from failing
      // the whole sweep, which would re-fetch every earlier page on retry.
      await sleep(MIN_REQUEST_INTERVAL_MS * 2 ** attempt)
    }
  }
}

// Non-ASCII names must survive normalisation. Stripping to [a-z0-9] collapses
// every CJK name to an empty string, which then matches all the others.
const NON_ALPHANUMERIC_REGEX = /[^\p{L}\p{N}]/gu

export const normalizeName = (name: string | null | undefined): string => {
  return (name ?? '').toLowerCase().replace(NON_ALPHANUMERIC_REGEX, '')
}

const byMarketCap = (coins: Array<Coin>): Coin | undefined => {
  // Ambiguous symbols and names resolve to the biggest coin, since rank ascends
  // with market cap. An arbitrary pick would silently track the wrong asset.
  return [...coins].sort(
    (a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER),
  )[0]
}

export const findCoin = (
  coins: Array<Coin>,
  symbol: string,
  name?: string | null,
): Coin | undefined => {
  const bySymbol = coins.filter((coin) => coin.symbol?.toUpperCase() === symbol.toUpperCase())

  if (bySymbol.length === 1) {
    return bySymbol[0]
  }

  // CryptoCompare suffixes symbols it cannot disambiguate (GSTSOL, BOBL2,
  // "TAP (1)"), so a name match finds coins a symbol match misses entirely.
  const normalized = normalizeName(name)

  if (normalized.length >= 2) {
    const byName = coins.filter((coin) => normalizeName(coin.name) === normalized)

    if (byName.length > 0) {
      return byMarketCap(byName)
    }
  }

  return bySymbol.length > 0 ? byMarketCap(bySymbol) : undefined
}

export const fetchCoinsPage = async (page: number): Promise<Array<Coin>> => {
  const url = `https://openapiv1.coinstats.app/coins?page=${page}&limit=${pageSize}`
  const response = await request(url)
  const data = (await response.json()) as CoinsResponse

  if (!Array.isArray(data.result)) {
    throw new Error(`[CoinStats] Unexpected response: ${JSON.stringify(data).slice(0, 500)}`)
  }

  return data.result
}

export const fetchCoinsBySymbol = async (symbol: string): Promise<Array<Coin>> => {
  const url = `https://openapiv1.coinstats.app/coins?symbol=${encodeURIComponent(symbol)}&limit=50`
  const response = await request(url)
  const data = (await response.json()) as CoinsResponse

  return Array.isArray(data.result) ? data.result : []
}

export const fetchHistorical = async (id: string): Promise<HistoricalPriceData | undefined> => {
  try {
    const url = `https://openapiv1.coinstats.app/coins/${encodeURIComponent(id)}/charts?period=all`
    const response = await request(url)
    const data = (await response.json()) as ChartsResponse

    if (!Array.isArray(data)) {
      return
    }

    const prices: Array<PriceData> = []

    for (const [timestamp, price] of data) {
      if (price > 0) {
        prices.push({ date: formatDate(timestamp * 1000), price })
      }
    }

    return { prices, currency: 'USD' }
  } catch (error) {
    console.error(`[CoinStats] Fetch error for ${id}:`, error)
  }
}
