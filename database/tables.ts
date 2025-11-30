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
    symbol: varchar('symbol', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    type: tickerType('type').notNull(),
    currency: varchar('currency', { length: 10 }).notNull(),
    source: sourceType('source').notNull(),
    sourceId: varchar('source_id', { length: 100 }).notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('tickers_source_id').on(table.source, table.sourceId)],
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

export const currencies = pgTable('currencies', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const rates = pgTable(
  'rates',
  {
    id: serial('id').primaryKey(),
    date: date('date').notNull(),
    fromCurrency: varchar('from_currency', { length: 10 })
      .notNull()
      .references(() => currencies.code),
    toCurrency: varchar('to_currency', { length: 10 })
      .notNull()
      .references(() => currencies.code),
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
  currencies,
  rates,
}

export const enums = {
  tickerType,
  sourceType,
}
