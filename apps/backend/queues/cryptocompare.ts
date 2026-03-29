import { fetchCryptocompare } from '../jobs/fetchCryptocompare.ts'
import { createQueue } from '../utils/queues.ts'

export const cryptocompareQueue = createQueue(
  'cryptocompare',
  { fetchCryptocompare },
  {
    queue: {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    },
  },
)
