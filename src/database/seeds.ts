import { db } from '../instances/database.ts'
import type { NewCurrency, NewTicker } from '../types/schemas.ts'
import commoditiesData from './seeds/commodities.json' with { type: 'json' }
import cryptosData from './seeds/cryptos.json' with { type: 'json' }
import currenciesData from './seeds/currencies.json' with { type: 'json' }
import etfsData from './seeds/etfs.json' with { type: 'json' }
import stocksData from './seeds/stocks.json' with { type: 'json' }
import { tables } from './tables.ts'

const tickers = [
  ...(stocksData as Array<NewTicker>),
  ...(etfsData as Array<NewTicker>),
  ...(commoditiesData as Array<NewTicker>),
  ...(cryptosData as Array<NewTicker>),
]

const currencies = currenciesData as Array<NewCurrency>

const seed = async () => {
  for (const currency of currencies) {
    await db.insert(tables.currencies).values(currency).onConflictDoNothing()
  }

  console.log(`Seeded ${currencies.length} currencies`)

  for (const ticker of tickers) {
    await db.insert(tables.tickers).values(ticker).onConflictDoNothing()
  }

  console.log(`Seeded ${tickers.length} tickers`)
  process.exit(0)
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
