import { scrapeTickers } from '../jobs/scrapeTickers.ts'
import { createQueue } from '../utils/queues.ts'

export const tickersQueue = createQueue('tickers', { scrapeTickers })

// Sync every hour.
tickersQueue.upsertJobScheduler('scrapeTickers', { pattern: '0 * * * *' })
