import { Hono } from 'hono'
import { basicAuth } from 'hono/basic-auth'
import { serveStatic } from 'hono/bun'
import { trimTrailingSlash } from 'hono/trailing-slash'
import { basePath, password, username } from '../constants/bullboard.ts'
import { routeHandler as bullboardRoutes } from '../instances/bullboard.ts'
import { cryptoRoutes } from '../routes/crypto.ts'
import { equitiesRoutes } from '../routes/equities.ts'
import { forexRoutes } from '../routes/forex.ts'

export const hono = new Hono()

hono.use(trimTrailingSlash())
hono.use('/static/*', serveStatic({ root: './src/' }))

hono.get('/', (context) =>
  context.redirect('https://github.com/macieklamberski/stonkista/blob/main/README.md'),
)

hono.use(`${basePath}/*`, basicAuth({ username, password }))
hono.route(basePath, bullboardRoutes)

hono.route('/forex', forexRoutes)
hono.route('/crypto', cryptoRoutes)
hono.route('/', equitiesRoutes)
