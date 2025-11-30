import type { PriceData, PriceFetcher } from '../types/sources.ts'
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

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toISOString().split('T')[0]
}

const fetchData = async (
  symbol: string,
  range: string,
  interval: string,
): Promise<YahooResponse | undefined> => {
  try {
    const endpoint = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`
    const response = await fetchUrl(endpoint)
    const data: YahooResponse = await response.json()

    return data
  } catch (error) {
    console.error(`[Yahoo] Fetch error for ${symbol}:`, error)
  }
}

export const fetchLatest: PriceFetcher['fetchLatest'] = async (symbol) => {
  const data = await fetchData(symbol, '1d', '1d')

  if (!data?.chart?.result?.[0]) {
    return
  }

  const result = data.chart.result[0]
  const price = result.meta.regularMarketPrice

  if (price == null) {
    return
  }

  return {
    date: formatDate(Date.now() / 1000),
    price,
  }
}

export const fetchHistorical: PriceFetcher['fetchHistorical'] = async (symbol, fromDate) => {
  // Use 'max' range to get all available history, or calculate range based on fromDate
  const range = fromDate ? 'max' : '1y'
  const data = await fetchData(symbol, range, '1d')

  if (!data?.chart?.result?.[0]) {
    return
  }

  const result = data.chart.result[0]
  const timestamps = result.timestamp || []
  const closes = result.indicators.quote[0]?.close || []
  const currency = result.meta.currency

  const prices: Array<PriceData> = []
  const fromTimestamp = fromDate ? new Date(fromDate).getTime() / 1000 : 0

  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i]
    const close = closes[i]

    if (timestamp >= fromTimestamp && close != null) {
      prices.push({
        date: formatDate(timestamp),
        price: close,
      })
    }
  }

  return {
    prices,
    currency,
  }
}

export const yahoo: PriceFetcher = {
  fetchLatest,
  fetchHistorical,
}
