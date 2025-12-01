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
