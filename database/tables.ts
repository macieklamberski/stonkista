import {
  boolean,
  date,
  decimal,
  index,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

export const tickerType = pgEnum('ticker_types', ['stock', 'etf', 'crypto', 'commodity'])
export const sourceType = pgEnum('source_types', ['yahoo', 'coingecko'])

export const tickers = pgTable(
  'tickers',
  {
    id: serial('id').primaryKey(),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    name: varchar('name', { length: 255 }),
    type: tickerType('type').notNull(),
    currency: varchar('currency', { length: 10 }).notNull(),
    source: sourceType('source').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('tickers_symbol').on(table.symbol)],
)

export const prices = pgTable(
  'prices',
  {
    id: serial('id').primaryKey(),
    tickerId: serial('ticker_id')
      .notNull()
      .references(() => tickers.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    price: decimal('price', { precision: 20, scale: 8 }),
    available: boolean('available').notNull().default(true),
    fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('prices_ticker_date').on(table.tickerId, table.date),
    index('prices_date').on(table.date),
  ],
)

export const rates = pgTable(
  'rates',
  {
    id: serial('id').primaryKey(),
    date: date('date').notNull(),
    fromCurrency: varchar('from_currency', { length: 10 }).notNull(),
    toCurrency: varchar('to_currency', { length: 10 }).notNull(),
    rate: decimal('rate', { precision: 20, scale: 10 }).notNull(),
    fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('rates_unique').on(table.date, table.fromCurrency, table.toCurrency),
    index('rates_date').on(table.date),
  ],
)

export const tables = {
  tickers,
  prices,
  rates,
}

export const enums = {
  tickerType,
  sourceType,
}
