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
      lockDuration: 600000, // 10 min for sync job.
    },
  },
)

// Sync CoinGecko coins daily at 00:00.
syncQueue.add('syncCoingecko', {}, { repeat: { pattern: '0 0 * * *' } })

// Sync currencies weekly on Sunday at 00:00.
syncQueue.add('syncFrankfurter', {}, { repeat: { pattern: '0 0 * * 0' } })
