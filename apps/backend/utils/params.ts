import { isCurrencyCode } from './currency.ts'
import { getToday, isFutureDate, isValidDate, isValidDateRange, parseDateRange } from './dates.ts'

export type DateRange = { dateFrom: string; dateTo: string }

export type DateParam =
  | { date: string; dateRange?: undefined }
  | { dateRange: DateRange; date?: undefined }

export type ParsedCurrencyDateParams =
  | { currency: string | undefined; date: string; dateRange?: undefined }
  | { currency: string | undefined; dateRange: DateRange; date?: undefined }

export const parseDateParam = (value: string): DateParam | undefined => {
  if (isValidDate(value)) {
    if (isFutureDate(value)) {
      return
    }

    return { date: value }
  }

  if (isValidDateRange(value)) {
    const range = parseDateRange(value)

    if (!range || isFutureDate(range.dateFrom) || isFutureDate(range.dateTo)) {
      return
    }

    return { dateRange: range }
  }
}

export const parseCurrencyDateParams = (
  currencyOrDate?: string,
  date?: string,
): ParsedCurrencyDateParams | undefined => {
  if (currencyOrDate && date) {
    const parsed = parseDateParam(date)

    if (!parsed) {
      return
    }

    return { currency: currencyOrDate.toUpperCase(), ...parsed }
  }

  if (currencyOrDate) {
    const parsed = parseDateParam(currencyOrDate)

    if (parsed) {
      return { currency: undefined, ...parsed }
    }

    if (isCurrencyCode(currencyOrDate)) {
      return { currency: currencyOrDate.toUpperCase(), date: getToday() }
    }

    return
  }

  return { currency: undefined, date: getToday() }
}
