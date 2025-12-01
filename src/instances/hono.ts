import { Hono } from 'hono'
import { basicAuth } from 'hono/basic-auth'
import { trimTrailingSlash } from 'hono/trailing-slash'
import { basePath, password, username } from '../constants/bullboard.ts'
import { routeHandler as bullboardRoutes } from '../instances/bullboard.ts'
import { priceRoutes } from '../routes/price.ts'

export const hono = new Hono()

hono.use(trimTrailingSlash())

hono.get('/', (context) =>
  context.redirect('https://github.com/macieklamberski/stonkista/blob/main/README.md'),
)

hono.use(`${basePath}/*`, basicAuth({ username, password }))
hono.route(basePath, bullboardRoutes)

hono.route('/', priceRoutes)
