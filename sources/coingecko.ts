import type { PriceData, PriceFetcher } from '../types/sources.ts'
import { fetchUrl } from '../utils/fetch.ts'

type CoinGeckoSimplePrice = {
  [coinId: string]: { usd: number }
}

type CoinGeckoMarketChart = {
  prices: Array<[number, number]> // [timestamp, price]
}

type CoinGeckoMarketCoin = {
  id: string
  symbol: string
  name: string
  market_cap_rank: number | null
}

export type TopCoin = {
  id: string
  symbol: string
  name: string
  rank: number
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toISOString().split('T')[0]
}

const fetchCoinGeckoEndpoint = async <T>(endpoint: string): Promise<T> => {
  const url = `https://api.coingecko.com/api/v3/${endpoint}`
  const apiKey = process.env.COINGECKO_API_KEY
  const response = await fetchUrl(url, {
    proxy: process.env.COINGECKO_PROXY,
    headers: apiKey ? { 'x-cg-demo-api-key': apiKey } : {},
  })

  return (await response.json()) as T
}

export const fetchLatest: PriceFetcher['fetchLatest'] = async (sourceId) => {
  try {
    const endpoint = `simple/price?ids=${sourceId}&vs_currencies=usd`
    const response = await fetchCoinGeckoEndpoint<CoinGeckoSimplePrice>(endpoint)
    const price = response[sourceId]?.usd

    if (typeof price !== 'number') {
      return
    }

    return {
      date: formatDate(Date.now()),
      price,
    }
  } catch (error) {
    console.error(`[CoinGecko] Fetch error for ${sourceId}:`, error)
  }
}

export const fetchLatestBatch = async (
  sourceIds: Array<string>,
): Promise<Map<string, PriceData> | undefined> => {
  if (sourceIds.length === 0) {
    return
  }

  try {
    const ids = sourceIds.join(',')
    const endpoint = `simple/price?ids=${ids}&vs_currencies=usd`
    const response = await fetchCoinGeckoEndpoint<CoinGeckoSimplePrice>(endpoint)
    const date = formatDate(Date.now())

    const result = new Map<string, PriceData>()

    for (const sourceId of sourceIds) {
      const price = response[sourceId]?.usd

      if (typeof price === 'number') {
        result.set(sourceId, { date, price })
      }
    }

    return result
  } catch (error) {
    console.error('[CoinGecko] Batch fetch error:', error)
    throw error
  }
}

export const fetchHistorical: PriceFetcher['fetchHistorical'] = async (sourceId, fromDate) => {
  try {
    // CoinGecko free API: max 365 days, use 'max' for full history with API key.
    const days = fromDate ? 'max' : '365'
    const endpoint = `coins/${sourceId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
    const response = await fetchCoinGeckoEndpoint<CoinGeckoMarketChart>(endpoint)
    const fromTimestamp = fromDate ? new Date(fromDate).getTime() : 0

    const prices: Array<PriceData> = []

    for (const [timestamp, price] of response.prices) {
      if (timestamp >= fromTimestamp && typeof price === 'number') {
        prices.push({ date: formatDate(timestamp), price })
      }
    }

    return { prices, currency: 'USD' }
  } catch (error) {
    console.error(`[CoinGecko] Fetch error for ${sourceId} historical:`, error)
  }
}

export const fetchTopCoins = async (limit: number = 5000): Promise<Array<TopCoin>> => {
  const perPage = 250 // CoinGecko max per page.
  const totalPages = Math.ceil(limit / perPage)
  const coins: Array<TopCoin> = []

  for (let page = 1; page <= totalPages; page++) {
    try {
      const endpoint = `coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}`
      const response = await fetchCoinGeckoEndpoint<Array<CoinGeckoMarketCoin>>(endpoint)

      for (const coin of response) {
        if (coin.market_cap_rank != null && coins.length < limit) {
          coins.push({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            rank: coin.market_cap_rank,
          })
        }
      }

      console.log(`[CoinGecko] Fetched page ${page}/${totalPages} (${coins.length} coins)`)

      // Rate limit: wait between pages.
      if (page < totalPages) {
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }
    } catch (error) {
      console.error(`[CoinGecko] Error fetching page ${page}:`, error)
      throw error
    }
  }

  return coins
}

export const coingecko: PriceFetcher = {
  fetchLatest,
  fetchHistorical,
}
