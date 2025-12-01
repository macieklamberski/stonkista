import { scrapeCurrencies } from '../jobs/scrapeCurrencies.ts'
import { createQueue } from '../utils/queues.ts'

export const currenciesQueue = createQueue('currencies', { scrapeCurrencies })

currenciesQueue.add('scrapeCurrencies', undefined, { repeat: { pattern: '5 0 * * *' } })
