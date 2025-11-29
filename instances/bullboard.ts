import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { HonoAdapter } from '@bull-board/hono'
import { serveStatic } from 'hono/bun'
import { backfillQueue } from '../queues/backfill.ts'
import { currenciesQueue } from '../queues/currencies.ts'
import { currencyQueue } from '../queues/currency.ts'
import { tickerQueue } from '../queues/ticker.ts'
import { tickersQueue } from '../queues/tickers.ts'

export const serverAdapter = new HonoAdapter(serveStatic).setBasePath('/bullboard')

export const bullboard = createBullBoard({
  queues: [
    new BullMQAdapter(tickersQueue),
    new BullMQAdapter(tickerQueue),
    new BullMQAdapter(currenciesQueue),
    new BullMQAdapter(currencyQueue),
    new BullMQAdapter(backfillQueue),
  ],
  serverAdapter,
})

export const routeHandler = serverAdapter.registerPlugin()
