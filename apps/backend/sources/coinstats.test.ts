import { describe, expect, it } from 'bun:test'
import { type Coin, findCoin, normalizeName } from './coinstats.ts'

const coin = (id: string, symbol: string, name: string, rank?: number): Coin => {
  return { id, symbol, name, rank }
}

const coins: Array<Coin> = [
  coin('bitcoin', 'BTC', 'Bitcoin', 1),
  coin('staked-trx', 'STRX', 'Staked TRX', 42),
  coin('strikecoin', 'STRX', 'Strike', 1116),
  coin('storex', 'STRX', 'Storex', 17149),
  coin('real-smurf-cat', 'SMURFCAT', 'Real Smurf Cat', 4249),
  coin('smurfcat-solana', 'SMURFCAT', 'Smurf Cat', 21201),
  coin('hajimi-token', 'HJM', '哈基米', 1522),
  coin('binance-life-token', 'BNL', '币安人生', 1600),
]

describe('normalizeName', () => {
  it('should lowercase and strip punctuation and spaces', () => {
    expect(normalizeName('Real Smurf Cat')).toBe('realsmurfcat')
    expect(normalizeName('Broccoli (firstbroccoli.com)')).toBe('broccolifirstbroccolicom')
  })

  it('should preserve non-latin characters', () => {
    expect(normalizeName('哈基米')).toBe('哈基米')
    expect(normalizeName('币安人生')).toBe('币安人生')
  })

  it('should not collapse distinct non-latin names to the same value', () => {
    expect(normalizeName('哈基米')).not.toBe(normalizeName('币安人生'))
  })

  it('should return empty string for nullish input', () => {
    expect(normalizeName(null)).toBe('')
    expect(normalizeName(undefined)).toBe('')
  })
})

describe('findCoin', () => {
  it('should return the only coin matching a unique symbol', () => {
    expect(findCoin(coins, 'BTC')?.id).toBe('bitcoin')
  })

  it('should match symbols case-insensitively', () => {
    expect(findCoin(coins, 'btc')?.id).toBe('bitcoin')
  })

  it('should resolve a colliding symbol by highest market cap', () => {
    expect(findCoin(coins, 'STRX')?.id).toBe('staked-trx')
  })

  it('should prefer a name match over market cap when the symbol collides', () => {
    expect(findCoin(coins, 'STRX', 'Storex')?.id).toBe('storex')
  })

  it('should find a coin by name when the symbol does not match', () => {
    expect(findCoin(coins, 'SMURFCATETH', 'Real Smurf Cat')?.id).toBe('real-smurf-cat')
  })

  it('should not cross-match distinct non-latin names', () => {
    expect(findCoin(coins, 'UNKNOWN', '哈基米')?.id).toBe('hajimi-token')
    expect(findCoin(coins, 'UNKNOWN', '币安人生')?.id).toBe('binance-life-token')
  })

  it('should ignore names too short to be meaningful', () => {
    expect(findCoin(coins, 'UNKNOWN', 'X')).toBeUndefined()
  })

  it('should return undefined when nothing matches', () => {
    expect(findCoin(coins, 'NOPE')).toBeUndefined()
    expect(findCoin([], 'BTC')).toBeUndefined()
  })

  it('should rank coins without a rank last', () => {
    const unranked = [coin('a', 'DUP', 'A'), coin('b', 'DUP', 'B', 500)]
    expect(findCoin(unranked, 'DUP')?.id).toBe('b')
  })
})
