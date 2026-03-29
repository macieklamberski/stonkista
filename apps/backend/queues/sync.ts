import { syncFrankfurter } from '../jobs/syncFrankfurter.ts'
import { createQueue } from '../utils/queues.ts'

export const syncQueue = createQueue(
  'sync',
  { syncFrankfurter },
  {
    queue: {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 min delay for sync retries.
        },
      },
    },
    worker: {
      lockDuration: 1200000, // 20 min for sync job.
    },
  },
)

// Sync weekly at 00:00.
syncQueue.add('syncFrankfurter', undefined, { repeat: { pattern: '0 0 * * 0' } })
