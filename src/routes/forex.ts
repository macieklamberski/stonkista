import { Hono } from 'hono'
import { convertPrice, isCurrencyCode } from '../utils/currency.ts'
import { generateDateRange, getToday } from '../utils/dates.ts'
import { type DateParam, parseDateParam } from '../utils/params.ts'
import { formatPrice } from '../utils/prices.ts'

export const forexRoutes = new Hono()

type ParsedParams = { currency: string } & DateParam

const parseParams = (to: string, date?: string): ParsedParams | undefined => {
  if (!isCurrencyCode(to)) {
    return
  }

  if (date) {
    const parsed = parseDateParam(date)

    if (!parsed) {
      return
    }

    return { currency: to.toUpperCase(), ...parsed }
  }

  return { currency: to.toUpperCase(), date: getToday() }
}

// GET /forex/:from/:to
// GET /forex/:from/:to/:date
// GET /forex/:from/:to/:dateFrom..:dateTo
forexRoutes.get('/:from/:to/:date?', async (context) => {
  const { from, to, date } = context.req.param()
  const locale = context.req.query('locale')
  const params = parseParams(to, date)

  if (!isCurrencyCode(from) || !params) {
    return context.notFound()
  }

  // Date range request.
  if (params.dateRange) {
    const { dateFrom, dateTo } = params.dateRange
    const dates = generateDateRange(dateFrom, dateTo)
    const entries: Array<{ date: string; price: number }> = []

    for (const d of dates) {
      const rate = await convertPrice(1, from.toUpperCase(), params.currency, d)

      if (rate !== undefined) {
        entries.push({ date: d, price: rate })
      }
    }

    if (entries.length === 0) {
      return context.notFound()
    }

    context.header('Cache-Control', 'public, max-age=31536000')

    const csv = entries
      .map((entry) => `${entry.date},${formatPrice(entry.price, locale)}`)
      .join('\n')
    return context.text(csv)
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
