import { fetchCoinstats } from '../jobs/fetchCoinstats.ts'
import { createQueue } from '../utils/queues.ts'

export const coinstatsQueue = createQueue(
  'coinstats',
  { fetchCoinstats },
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
