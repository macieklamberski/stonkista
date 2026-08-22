import { describe, expect, it } from 'bun:test'
import { isAssetPath } from './equities.ts'

describe('isAssetPath', () => {
  it('should reject the paths crawlers actually request', () => {
    expect(isAssetPath('favicon.ico')).toBe(true)
    expect(isAssetPath('sitemap.xml')).toBe(true)
    expect(isAssetPath('robots.txt')).toBe(true)
    expect(isAssetPath('.env')).toBe(true)
  })

  it('should reject asset extensions case-insensitively', () => {
    expect(isAssetPath('LOGO.PNG')).toBe(true)
    expect(isAssetPath('Sitemap.Xml')).toBe(true)
  })

  it('should accept plain ticker symbols', () => {
    expect(isAssetPath('AAPL')).toBe(false)
    expect(isAssetPath('MSFT')).toBe(false)
  })

  it('should accept symbols that contain dots', () => {
    expect(isAssetPath('BRK.B')).toBe(false)
    expect(isAssetPath('0700.HK')).toBe(false)
    expect(isAssetPath('RDS.A')).toBe(false)
  })

  it('should only match the extension at the end', () => {
    expect(isAssetPath('css')).toBe(false)
    expect(isAssetPath('json')).toBe(false)
    expect(isAssetPath('XML.TO')).toBe(false)
  })
})
