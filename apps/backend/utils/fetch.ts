export const fetchUrl = async (
  url: string | URL,
  init?: RequestInit & { proxy?: string },
): Promise<Response> => {
  const response = await fetch(url, init)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return response
}
