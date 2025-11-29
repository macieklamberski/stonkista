import { db } from '../instances/database.ts'
import type { NewTicker } from '../types/schemas.ts'
import { tables } from './tables.ts'

const tickers: Array<NewTicker> = [
  { symbol: 'AAPL', name: 'Apple', type: 'stock', currency: 'USD', source: 'yahoo' },
  { symbol: 'MSFT', name: 'Microsoft', type: 'stock', currency: 'USD', source: 'yahoo' },
  { symbol: 'GOOGL', name: 'Alphabet', type: 'stock', currency: 'USD', source: 'yahoo' },
  { symbol: 'TSLA', name: 'Tesla', type: 'stock', currency: 'USD', source: 'yahoo' },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'stock', currency: 'USD', source: 'yahoo' },
  { symbol: 'CCO.TO', name: 'Cameco', type: 'stock', currency: 'CAD', source: 'yahoo' },
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', currency: 'USD', source: 'coingecko' },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto', currency: 'USD', source: 'coingecko' },
  { symbol: 'SOL', name: 'Solana', type: 'crypto', currency: 'USD', source: 'coingecko' },
  { symbol: 'SPY', name: 'S&P 500 ETF', type: 'etf', currency: 'USD', source: 'yahoo' },
  { symbol: 'QQQ', name: 'QQQ Trust', type: 'etf', currency: 'USD', source: 'yahoo' },
]

const prices: Record<string, number> = {
  AAPL: 175,
  MSFT: 430,
  GOOGL: 175,
  TSLA: 250,
  NVDA: 140,
  'CCO.TO': 75,
  BTC: 100000,
  ETH: 3500,
  SOL: 250,
  SPY: 600,
  QQQ: 520,
}

const rates = {
  USD: { EUR: 0.92, GBP: 0.79, JPY: 150, CAD: 1.36, CHF: 0.88, AUD: 1.53, PLN: 4.05 },
  CAD: { USD: 0.74, EUR: 0.68, GBP: 0.58, JPY: 110, CHF: 0.65, AUD: 1.13, PLN: 2.98 },
}

const days = 30
const dates = Array.from({ length: days + 1 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (days - i))
  return d.toISOString().split('T')[0]
})

const randomize = (base: number, volatility: number) =>
  base * (1 + (Math.random() * 2 - 1) * volatility)

const seed = async () => {
  for (const ticker of tickers) {
    await db
      .insert(tables.tickers)
      .values({
        symbol: ticker.symbol,
        name: ticker.name,
        type: ticker.type,
        currency: ticker.currency ?? 'USD',
        source: ticker.source ?? 'yahoo',
      })
      .onConflictDoNothing()
  }

  console.log(`Seeded ${tickers.length} tickers`)

  const allTickers = await db.query.tickers.findMany()

  for (const ticker of allTickers) {
    const base = prices[ticker.symbol] ?? 100
    let price = base

    for (const date of dates) {
      price = randomize(price, 0.05)

      await db
        .insert(tables.prices)
        .values({ tickerId: ticker.id, date, price: price.toFixed(8) })
        .onConflictDoNothing()
    }
  }

  console.log(`Seeded ${allTickers.length * dates.length} prices`)

  for (const [from, toRates] of Object.entries(rates)) {
    for (const [to, base] of Object.entries(toRates)) {
      let rate = base

      for (const date of dates) {
        rate = randomize(rate, 0.005)

        await db
          .insert(tables.rates)
          .values({ date, fromCurrency: from, toCurrency: to, rate: rate.toFixed(10) })
          .onConflictDoNothing()
      }
    }
  }

  console.log(`Seeded ${Object.values(rates).flatMap(Object.keys).length * dates.length} rates`)
  process.exit(0)
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
