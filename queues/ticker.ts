import { scrapeTicker } from '../jobs/scrapeTicker.ts'
import { createQueue } from '../utils/queues.ts'

export const tickerQueue = createQueue('ticker', { scrapeTicker })
