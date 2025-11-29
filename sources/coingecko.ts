import type { PriceData, PriceFetcher } from '../types/sources.ts'
import { fetchUrl } from '../utils/fetch.ts'

const apiKey = process.env.COINGECKO_API_KEY
const baseUrl = 'https://api.coingecko.com/api/v3'
const symbolsCache = new Map<string, string>()

type CoinGeckoSimplePrice = {
  [coinId: string]: { usd: number }
}

type CoinGeckoMarketChart = {
  prices: Array<[number, number]> // [timestamp, price]
}

type CoinGeckoCoinList = Array<{
  id: string
  symbol: string
  name: string
}>

const getHeaders = (): HeadersInit => {
  return apiKey ? { 'x-cg-demo-api-key': apiKey } : {}
}

const fetchCoinId = async (symbol: string): Promise<string | undefined> => {
  const normalizedSymbol = symbol.toLowerCase()
  const cached = symbolsCache.get(normalizedSymbol)

  if (cached) {
    return cached
  }

  try {
    const endpoint = `${baseUrl}/coins/list`
    const response = await fetchUrl(endpoint, { headers: getHeaders() })
    const coins: CoinGeckoCoinList = await response.json()

    for (const coin of coins) {
      symbolsCache.set(coin.symbol.toLowerCase(), coin.id)
    }

    return symbolsCache.get(normalizedSymbol)
  } catch (error) {
    console.error('[CoinGecko] Error fetching coin list:', error)
  }
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toISOString().split('T')[0]
}

export const fetchLatest: PriceFetcher['fetchLatest'] = async (symbol) => {
  const coinId = await fetchCoinId(symbol)

  if (!coinId) {
    console.error(`[CoinGecko] Unknown symbol: ${symbol}`)
    return
  }

  try {
    const endpoint = `${baseUrl}/simple/price?ids=${coinId}&vs_currencies=usd`
    const response = await fetchUrl(endpoint, { headers: getHeaders() })
    const data: CoinGeckoSimplePrice = await response.json()
    const price = data[coinId]?.usd

    if (price == null) {
      return
    }

    return {
      date: formatDate(Date.now()),
      price,
    }
  } catch (error) {
    console.error(`[CoinGecko] Fetch error for ${symbol}:`, error)
  }
}

export const fetchHistorical: PriceFetcher['fetchHistorical'] = async (symbol, fromDate) => {
  const coinId = await fetchCoinId(symbol)

  if (!coinId) {
    console.error(`[CoinGecko] Unknown symbol: ${symbol}`)
    return
  }

  try {
    // CoinGecko free API: max 365 days, use 'max' for full history with API key.
    const days = fromDate ? 'max' : '365'
    const endpoint = `${baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
    const response = await fetchUrl(endpoint, { headers: getHeaders() })
    const data: CoinGeckoMarketChart = await response.json()
    const fromTimestamp = fromDate ? new Date(fromDate).getTime() : 0

    const prices: Array<PriceData> = []

    for (const [timestamp, price] of data.prices) {
      if (timestamp >= fromTimestamp && price != null) {
        prices.push({ date: formatDate(timestamp), price })
      }
    }

    return { prices, currency: 'USD' }
  } catch (error) {
    console.error(`[CoinGecko] Fetch error for ${symbol} historical:`, error)
  }
}

export const coingecko: PriceFetcher = {
  name: 'coingecko',
  fetchLatest,
  fetchHistorical,
}
