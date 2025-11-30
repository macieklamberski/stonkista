import { fetchFrankfurter } from '../jobs/fetchFrankfurter.ts'
import { createQueue } from '../utils/queues.ts'

export const frankfurterQueue = createQueue(
  'frankfurter',
  { fetchFrankfurter },
  {
    queue: {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // Frankfurter has generous rate limits.
        },
      },
    },
  },
)
