import { scrapeTickers } from '../jobs/scrapeTickers.ts'
import { createQueue } from '../utils/queues.ts'

export const tickersQueue = createQueue('tickers', { scrapeTickers })

// Sync daily at 00:05.
tickersQueue.add('scrapeTickers', undefined, { repeat: { pattern: '5 0 * * *' } })
