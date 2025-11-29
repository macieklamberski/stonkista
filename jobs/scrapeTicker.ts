import { eq } from 'drizzle-orm'
import { prices, tickers } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import { coingecko } from '../sources/coingecko.ts'
import { yahoo } from '../sources/yahoo.ts'

export type ScrapeTickerData = {
  tickerId: number
  date: string // YYYY-MM-DD
}

export const scrapeTicker = async (data: ScrapeTickerData) => {
  const ticker = await db.query.tickers.findFirst({
    where: eq(tickers.id, data.tickerId),
  })

  if (!ticker) {
    console.error(`[scrapeTicker] Ticker not found: ${data.tickerId}`)
    return
  }

  const source = ticker.source === 'yahoo' ? yahoo : coingecko
  const priceData = await source.fetchLatest(ticker.symbol)

  if (!priceData) {
    // Mark as unavailable
    await db
      .insert(prices)
      .values({
        tickerId: ticker.id,
        date: data.date,
        price: null,
        available: false,
        fetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [prices.tickerId, prices.date],
        set: {
          price: null,
          available: false,
          fetchedAt: new Date(),
        },
      })

    console.log(`[scrapeTicker] Price unavailable for ${ticker.symbol} on ${data.date}`)
    return
  }

  await db
    .insert(prices)
    .values({
      tickerId: ticker.id,
      date: data.date,
      price: priceData.price.toString(),
      available: true,
      fetchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [prices.tickerId, prices.date],
      set: {
        price: priceData.price.toString(),
        available: true,
        fetchedAt: new Date(),
      },
    })

  console.log(`[scrapeTicker] Scraped ${ticker.symbol}: ${priceData.price} on ${data.date}`)
}
