import { Hono } from 'hono'
import { basePath } from '../constants/bullboard.ts'
import { routeHandler as bullboardRoutes } from '../instances/bullboard.ts'
import { priceRoutes } from '../routes/price.ts'

export const hono = new Hono()

hono.get('/', (context) =>
  context.redirect('https://github.com/macieklamberski/stonkista/blob/main/README.md'),
)
hono.route(basePath, bullboardRoutes)
hono.route('/', priceRoutes)
