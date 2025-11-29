import { scrapeTickers } from '../jobs/scrapeTickers.ts'
import { createQueue } from '../utils/queues.ts'

export const tickersQueue = createQueue('tickers', { scrapeTickers })

tickersQueue.add('scrapeTickers', undefined, { repeat: { pattern: '5 0 * * *' } })
