export type PriceData = {
  date: string // YYYY-MM-DD
  price: number
}

export type HistoricalPriceData = {
  prices: Array<PriceData>
  currency: string
}

export type PriceFetcher = {
  name: string
  fetchLatest: (symbol: string) => Promise<PriceData | undefined>
  fetchHistorical: (symbol: string, fromDate?: string) => Promise<HistoricalPriceData | undefined>
}

export type CurrencyRateData = {
  date: string
  rates: Record<string, number>
}

export type CurrencyFetcher = {
  name: string
  fetchLatest: (baseCurrency: string) => Promise<CurrencyRateData | undefined>
  fetchHistorical: (baseCurrency: string, date: string) => Promise<CurrencyRateData | undefined>
}
