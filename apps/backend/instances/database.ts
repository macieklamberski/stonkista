import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as databaseConstants from '../constants/database.ts'

export const client = postgres({
  host: databaseConstants.host,
  port: databaseConstants.port,
  database: databaseConstants.database,
  username: databaseConstants.user,
  password: databaseConstants.password,
})

export const db = drizzle({ client })
