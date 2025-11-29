import type { CurrencyFetcher, CurrencyRateData } from '../types/sources.ts'
import { fetchUrl } from '../utils/fetch.ts'

const baseUrl = 'https://api.frankfurter.dev/v1'

const fetchData = async (
  path: string,
  baseCurrency: string,
): Promise<CurrencyRateData | undefined> => {
  try {
    const endpoint = `${baseUrl}/${path}?base=${baseCurrency.toUpperCase()}`
    const response = await fetchUrl(endpoint)
    const data = await response.json()

    return data
  } catch (error) {
    console.error(`[Frankfurter] Fetch error for ${baseCurrency} (${path}):`, error)
  }
}

export const frankfurter: CurrencyFetcher = {
  name: 'frankfurter',
  fetchLatest: (baseCurrency) => fetchData('latest', baseCurrency),
  fetchHistorical: (baseCurrency, date) => fetchData(date, baseCurrency),
}
