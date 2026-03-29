import type {
  CurrencyHistoricalFetcher,
  CurrencyLatestFetcher,
  CurrencyRateData,
} from '../types/sources.ts'
import { fetchUrl } from '../utils/fetch.ts'

export type Currency = {
  code: string
  name: string
}

const fetchData = async (
  path: string,
  baseCurrency: string,
): Promise<CurrencyRateData | undefined> => {
  try {
    const endpoint = `https://api.frankfurter.dev/v1/${path}?base=${baseCurrency.toUpperCase()}`
    const response = await fetchUrl(endpoint)

    return await response.json()
  } catch (error) {
    console.error(`[Frankfurter] Fetch error for ${baseCurrency} (${path}):`, error)
  }
}

export const fetchCurrencies = async (): Promise<Array<Currency>> => {
  try {
    const endpoint = 'https://api.frankfurter.dev/v1/currencies'
    const response = await fetchUrl(endpoint)
    const data: Record<string, string> = await response.json()

    return Object.entries(data).map(([code, name]) => ({ code, name }))
  } catch (error) {
    console.error('[Frankfurter] Error fetching currencies:', error)
    return []
  }
}

export const fetchLatest: CurrencyLatestFetcher = (baseCurrency) => {
  return fetchData('latest', baseCurrency)
}

export const fetchHistorical: CurrencyHistoricalFetcher = (baseCurrency, date) => {
  return fetchData(date, baseCurrency)
}
