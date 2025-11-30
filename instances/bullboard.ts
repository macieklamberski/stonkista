import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { HonoAdapter } from '@bull-board/hono'
import { serveStatic } from 'hono/bun'
import { basePath } from '../constants/bullboard.ts'
import { coingeckoQueue } from '../queues/coingecko.ts'
import { currenciesQueue } from '../queues/currencies.ts'
import { frankfurterQueue } from '../queues/frankfurter.ts'
import { syncQueue } from '../queues/sync.ts'
import { tickersQueue } from '../queues/tickers.ts'
import { yahooQueue } from '../queues/yahoo.ts'

export const serverAdapter = new HonoAdapter(serveStatic).setBasePath(basePath)

export const bullboard = createBullBoard({
  queues: [
    new BullMQAdapter(tickersQueue),
    new BullMQAdapter(yahooQueue),
    new BullMQAdapter(coingeckoQueue),
    new BullMQAdapter(currenciesQueue),
    new BullMQAdapter(frankfurterQueue),
    new BullMQAdapter(syncQueue),
  ],
  serverAdapter,
})

export const routeHandler = serverAdapter.registerPlugin()
