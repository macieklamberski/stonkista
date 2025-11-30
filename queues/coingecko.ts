import { fetchCoingecko } from '../jobs/fetchCoingecko.ts'
import { createQueue } from '../utils/queues.ts'

export const coingeckoQueue = createQueue(
  'coingecko',
  { fetchCoingecko },
  {
    queue: {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30000, // Longer delay for CoinGecko rate limits.
        },
      },
    },
    worker: {
      concurrency: 1, // Sequential to avoid rate limits.
    },
  },
)
