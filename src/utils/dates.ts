export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/

  if (!regex.test(dateString)) {
    return false
  }

  const date = new Date(dateString)

  return !Number.isNaN(date.getTime())
}

export const formatDate = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

export const getToday = (): string => {
  return formatDate(new Date())
}

export const isFutureDate = (date: string): boolean => {
  return date > getToday()
}

export const isValidDateRange = (value: string): boolean => {
  const parts = value.split('..')

  if (parts.length !== 2) {
    return false
  }

  const [dateFrom, dateTo] = parts

  if (!isValidDate(dateFrom) || !isValidDate(dateTo)) {
    return false
  }

  return dateFrom <= dateTo
}

export const parseDateRange = (value: string): { dateFrom: string; dateTo: string } | undefined => {
  if (!isValidDateRange(value)) {
    return
  }

  const [dateFrom, dateTo] = value.split('..')

  return { dateFrom, dateTo }
}

export const generateDateRange = (dateFrom: string, dateTo: string): Array<string> => {
  const dates: Array<string> = []
  const current = new Date(`${dateFrom}T00:00:00Z`)
  const end = new Date(`${dateTo}T00:00:00Z`)

  while (current <= end) {
    dates.push(formatDate(current))
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return dates
}
