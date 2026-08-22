import { apiKey, pageSize, proxy } from '../constants/coinstats.ts'
import type { HistoricalPriceData, PriceData } from '../types/sources.ts'
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
  const response = await fetchUrl(url, { proxy, headers: headers() })
  const data = (await response.json()) as CoinsResponse

  if (!Array.isArray(data.result)) {
    throw new Error(`[CoinStats] Unexpected response: ${JSON.stringify(data).slice(0, 500)}`)
  }

  return data.result
}

export const fetchCoinsBySymbol = async (symbol: string): Promise<Array<Coin>> => {
  const url = `https://openapiv1.coinstats.app/coins?symbol=${encodeURIComponent(symbol)}&limit=50`
  const response = await fetchUrl(url, { proxy, headers: headers() })
  const data = (await response.json()) as CoinsResponse

  return Array.isArray(data.result) ? data.result : []
}

export const fetchHistorical = async (id: string): Promise<HistoricalPriceData | undefined> => {
  try {
    const url = `https://openapiv1.coinstats.app/coins/${encodeURIComponent(id)}/charts?period=all`
    const response = await fetchUrl(url, { proxy, headers: headers() })
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
