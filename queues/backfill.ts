import { backfillTicker } from '../jobs/backfillTicker.ts'
import { createQueue } from '../utils/queues.ts'

export const backfillQueue = createQueue(
  'backfill',
  { backfillTicker },
  {
    queue: {
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 1000,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
      },
    },
    worker: {
      concurrency: 1,
      lockDuration: 300000, // 5 minutes for potentially long backfill operations.
    },
  },
)
