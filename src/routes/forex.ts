import { Hono } from 'hono'
import { convertPrice, isCurrencyCode } from '../utils/currency.ts'
import { getToday, isValidDate } from '../utils/dates.ts'
import { formatPrice } from '../utils/prices.ts'

export const forexRoutes = new Hono()

const parseParams = (to: string, date?: string) => {
  if (!isCurrencyCode(to)) {
    return
  }

  if (date && !isValidDate(date)) {
    return
  }

  return { currency: to.toUpperCase(), date: date ?? getToday() }
}

// GET /forex/:from/:to
// GET /forex/:from/:to/:date
forexRoutes.get('/:from/:to/:date?', async (context) => {
  const { from, to, date } = context.req.param()
  const locale = context.req.query('locale')
  const params = parseParams(to, date)

  if (!isCurrencyCode(from) || !params) {
    return context.notFound()
  }

  const rate = await convertPrice(1, from.toUpperCase(), params.currency, params.date)

  if (rate === undefined) {
    return context.notFound()
  }

  if (params.date !== getToday()) {
    context.header('Cache-Control', 'public, max-age=31536000')
  }

  return context.text(formatPrice(rate, locale))
})
