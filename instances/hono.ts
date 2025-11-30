import { Hono } from 'hono'
import { basePath } from '../constants/bullboard.ts'
import { routeHandler as bullboardRoutes } from '../instances/bullboard.ts'
import { priceRoutes } from '../routes/price.ts'

export const hono = new Hono()

hono.get('/health', (context) => context.text('ok'))
hono.route(basePath, bullboardRoutes)
hono.route('/', priceRoutes)
