export class HttpError extends Error {
  status: number

  constructor(status: number) {
    super(`HTTP ${status}`)
    this.name = 'HttpError'
    this.status = status
  }
}

export const fetchUrl = async (
  url: string | URL,
  init?: RequestInit & { proxy?: string },
): Promise<Response> => {
  const response = await fetch(url, init)

  if (!response.ok) {
    throw new HttpError(response.status)
  }

  return response
}
