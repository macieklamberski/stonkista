import { migrate } from 'drizzle-orm/postgres-js/migrator'
import * as databaseConstants from './constants/database.ts'
import * as serverConstants from './constants/server.ts'
import { db } from './instances/database.ts'
import { hono } from './instances/hono.ts'

import './queues/backfill.ts'
import './queues/currencies.ts'
import './queues/currency.ts'
import './queues/ticker.ts'
import './queues/tickers.ts'

await migrate(db, databaseConstants)

Bun.serve({
  fetch: hono.fetch,
  hostname: serverConstants.host,
  port: serverConstants.port,
})
