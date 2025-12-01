import type { PriceData, PriceHistoricalFetcher, PriceLatestFetcher } from '../types/sources.ts'
import { formatDate } from '../utils/dates.ts'
import { fetchUrl } from '../utils/fetch.ts'

type YahooResponse = {
  chart: {
    result: Array<{
      meta: {
        currency: string
        symbol: string
        regularMarketPrice: number
      }
      timestamp: Array<number>
      indicators: {
        quote: Array<{
          close: Array<number | null>
        }>
      }
    }> | null
    error: { code: string; description: string } | null
  }
}

const fetchData = async (
  symbol: string,
  params: {
    range: string
    interval: string
    fromDate?: number
    toDate?: number
  },
): Promise<YahooResponse | undefined> => {
  try {
    const searchParams = new URLSearchParams({ interval: params.interval })

    if (params.fromDate !== undefined && params.toDate !== undefined) {
      searchParams.set('period1', params.fromDate.toString())
      searchParams.set('period2', params.toDate.toString())
    } else {
      searchParams.set('range', params.range)
    }

    const endpoint = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${searchParams}`
    const response = await fetchUrl(endpoint)

    return await response.json()
  } catch (error) {
    console.error(`[Yahoo] Fetch error for ${symbol}:`, error)
  }
}

export const fetchLatest: PriceLatestFetcher = async (symbol) => {
  const data = await fetchData(symbol, { range: '1d', interval: '1d' })
  const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice

  if (typeof price !== 'number') {
    return
  }

  return {
    date: formatDate(Date.now()),
    price,
  }
}

export const fetchHistorical: PriceHistoricalFetcher = async (symbol, from) => {
  const fromDate = from ? Math.floor(new Date(from).getTime() / 1000) : 0
  const toDate = Math.floor(Date.now() / 1000)
  const data = await fetchData(symbol, { range: '1y', interval: '1d', fromDate, toDate })
  const result = data?.chart?.result?.[0]

  if (!result) {
    return
  }

  const timestamps = result.timestamp ?? []
  const closes = result.indicators?.quote?.[0]?.close ?? []
  const currency = result.meta?.currency ?? 'USD'

  const prices: Array<PriceData> = []

  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i]
    const close = closes[i]

    if (close != null) {
      prices.push({
        date: formatDate(timestamp * 1000),
        price: close,
      })
    }
  }

  return {
    prices,
    currency,
  }
}
