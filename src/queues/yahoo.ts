import { fetchYahoo } from '../jobs/fetchYahoo.ts'
import { createQueue } from '../utils/queues.ts'

export const yahooQueue = createQueue(
  'yahoo',
  { fetchYahoo },
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
