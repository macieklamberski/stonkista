import type { enums, tables } from '../database/tables.ts'

export type TickerType = (typeof enums.tickerType.enumValues)[number]
export type SourceType = (typeof enums.sourceType.enumValues)[number]

export type Ticker = typeof tables.tickers.$inferSelect
export type NewTicker = typeof tables.tickers.$inferInsert

export type Price = typeof tables.prices.$inferSelect
export type NewPrice = typeof tables.prices.$inferInsert

export type Rate = typeof tables.rates.$inferSelect
export type NewRate = typeof tables.rates.$inferInsert

export type Currency = typeof tables.currencies.$inferSelect
export type NewCurrency = typeof tables.currencies.$inferInsert
