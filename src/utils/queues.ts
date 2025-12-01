import { type Processor, Queue, type QueueOptions, Worker, type WorkerOptions } from 'bullmq'
import { connection } from '../instances/queue.ts'

export const createQueue = <Data, Result, Name extends string>(
  name: string,
  actions: Record<Name, (data: Data) => Result>,
  options?: {
    queue?: Partial<QueueOptions>
    worker?: Partial<WorkerOptions>
  },
) => {
  const queue: Queue<Data, Result, Name> = new Queue(name, {
    ...options?.queue,
    connection,
  })

  const processor: Processor<Data, Result, Name> = async (job) => {
    try {
      return await actions[job.name](job.data)
    } catch (error) {
      console.error(`[Job Failed] ${name}.${job.name}:`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : error,
      })
      throw error
    }
  }

  const worker = new Worker<Data, Result, Name>(name, processor, {
    ...options?.worker,
    connection,
  })

  queue.on('error', (error) => {
    console.error(`[Queue Error] ${name}:`, error)
  })
  worker.on('error', (error) => {
    console.error(`[Worker Error] ${name}:`, error)
  })
  worker.on('failed', (job, error) => {
    console.error(`[Job Failed] ${name}.${job?.name}:`, {
      jobId: job?.id,
      error: error.message,
    })
  })

  return queue
}
