export const chunk = <T>(array: Array<T>, size: number): Array<Array<T>> => {
  if (size <= 0) {
    return []
  }

  const chunks: Array<Array<T>> = []

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }

  return chunks
}
