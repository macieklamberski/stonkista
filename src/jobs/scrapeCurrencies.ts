import { frankfurterQueue } from '../queues/frankfurter.ts'

export const scrapeCurrencies = async () => {
  await frankfurterQueue.add('fetchFrankfurter', { baseCurrency: 'EUR' })
  console.log('[scrapeCurrencies] Scheduled Frankfurter job for EUR')
}
