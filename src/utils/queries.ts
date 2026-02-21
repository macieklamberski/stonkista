export const findOrSkip = async <T>(query: PromiseLike<Array<T>>): Promise<T | undefined> => {
  const [result] = await query
  return result
}
