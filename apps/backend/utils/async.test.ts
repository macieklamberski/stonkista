import { describe, expect, it } from 'bun:test'
import { sleep } from './async.ts'

describe('sleep', () => {
  it('should resolve after the specified delay', async () => {
    const start = performance.now()
    await sleep(50)
    const elapsed = performance.now() - start

    expect(elapsed).toBeGreaterThanOrEqual(40)
  })

  it('should resolve with undefined', async () => {
    expect(await sleep(0)).toBeUndefined()
  })
})
