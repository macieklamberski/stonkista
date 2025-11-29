import { scrapeCurrency } from '../jobs/scrapeCurrency.ts'
import { createQueue } from '../utils/queues.ts'

export const currencyQueue = createQueue('currency', { scrapeCurrency })
