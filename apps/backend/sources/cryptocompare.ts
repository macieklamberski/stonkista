import { apiKey, proxy } from '../constants/cryptocompare.ts'
import type { HistoricalPriceData, PriceData } from '../types/sources.ts'
import { formatDate } from '../utils/dates.ts'
import { fetchUrl } from '../utils/fetch.ts'

type TopCoinsResponse = {
  Response: string
  Message?: string
  Data: Array<{
    CoinInfo: {
      Name: string
      FullName: string
    }
  }>
}

type HistodayResponse = {
  Response: string
  Data: {
    Data: Array<{
      time: number
      close: number
    }>
  }
}

type PriceMultiResponse =
  | { [symbol: string]: { USD?: number } }
  | { Response: 'Error'; Message: string }

const headers = (): Record<string, string> => {
  if (apiKey) {
    return { authorization: `Apikey ${apiKey}` }
  }

  return {}
}

export const fetchLatestBatch = async (
  symbols: Array<string>,
): Promise<Map<string, PriceData> | undefined> => {
  if (symbols.length === 0) {
    return
  }

  try {
    const fsyms = symbols.join(',')
    const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${fsyms}&tsyms=USD`
    const response = await fetchUrl(url, { proxy, headers: headers() })
    const data = (await response.json()) as PriceMultiResponse

    if ('Response' in data && data.Response === 'Error') {
      throw new Error(`[CryptoCompare] API error: ${data.Message}`)
    }

    const date = formatDate(Date.now())

    const result = new Map<string, PriceData>()

    for (const symbol of symbols) {
      const price = (data as Record<string, { USD?: number }>)[symbol]?.USD

      if (typeof price === 'number') {
        result.set(symbol, { date, price })
      }
    }

    return result
  } catch (error) {
    console.error('[CryptoCompare] Batch fetch error:', error)
    throw error
  }
}

export const fetchHistorical = async (symbol: string): Promise<HistoricalPriceData | undefined> => {
  try {
    const url = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${symbol}&tsym=USD&allData=true`
    const response = await fetchUrl(url, { proxy, headers: headers() })
    const data = (await response.json()) as HistodayResponse

    if (data.Response !== 'Success') {
      return
    }

    const prices: Array<PriceData> = []

    for (const entry of data.Data.Data) {
      if (entry.close > 0) {
        prices.push({
          date: formatDate(entry.time * 1000),
          price: entry.close,
        })
      }
    }

    return { prices, currency: 'USD' }
  } catch (error) {
    console.error(`[CryptoCompare] Fetch error for ${symbol}:`, error)
  }
}

export const fetchTopCoins = async (
  page: number,
  limit: number,
): Promise<Array<{ symbol: string; name: string }>> => {
  const url = `https://min-api.cryptocompare.com/data/top/mktcapfull?limit=${limit}&page=${page}&tsym=USD`
  const response = await fetchUrl(url, { proxy, headers: headers() })
  const data = (await response.json()) as TopCoinsResponse

  if (!Array.isArray(data.Data)) {
    throw new Error(`[CryptoCompare] Unexpected response: ${JSON.stringify(data).slice(0, 500)}`)
  }

  return data.Data.map((coin) => ({
    symbol: coin.CoinInfo.Name,
    name: coin.CoinInfo.FullName,
  }))
}
