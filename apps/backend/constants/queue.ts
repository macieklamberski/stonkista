export const host = process.env.QUEUE_HOST ?? 'localhost'
export const port = process.env.QUEUE_PORT ? Number(process.env.QUEUE_PORT) : 6379
