export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/

  if (!regex.test(dateString)) {
    return false
  }

  const date = new Date(dateString)
  return !Number.isNaN(date.getTime())
}

export const getToday = (): string => {
  return new Date().toISOString().split('T')[0]
}
