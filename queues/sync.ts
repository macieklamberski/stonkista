import { syncCoingecko } from '../jobs/syncCoingecko.ts'
import { syncFrankfurter } from '../jobs/syncFrankfurter.ts'
import { createQueue } from '../utils/queues.ts'

export const syncQueue = createQueue(
  'sync',
  { syncCoingecko, syncFrankfurter },
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
      concurrency: 1,
      lockDuration: 1200000, // 20 min for sync job.
    },
  },
)

// Sync weekly at 00:00.
syncQueue.add('syncCoingecko', undefined, { repeat: { pattern: '0 0 * * 0' } })
syncQueue.add('syncFrankfurter', undefined, { repeat: { pattern: '0 0 * * 0' } })
