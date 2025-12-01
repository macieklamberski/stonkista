import type { TickerType } from './schemas.ts'

export type PriceData = {
  date: string // YYYY-MM-DD
  price: number
}

export type HistoricalPriceData = {
  prices: Array<PriceData>
  currency: string
  name?: string
  type?: TickerType
}

export type PriceLatestFetcher = (symbol: string) => Promise<PriceData | undefined>

export type PriceHistoricalFetcher = (
  symbol: string,
  fromDate?: string,
) => Promise<HistoricalPriceData | undefined>

export type CurrencyRateData = {
  date: string
  rates: Record<string, number>
}

export type CurrencyLatestFetcher = (baseCurrency: string) => Promise<CurrencyRateData | undefined>

export type CurrencyHistoricalFetcher = (
  baseCurrency: string,
  date: string,
) => Promise<CurrencyRateData | undefined>
