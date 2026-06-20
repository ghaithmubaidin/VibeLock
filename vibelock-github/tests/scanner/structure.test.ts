import { describe, it, expect } from 'vitest'
import { scanStructure } from '../../src/scanner/structure.js'
import { join } from 'node:path'

const nextjsFixture = join(import.meta.dirname, '..', 'fixtures', 'nextjs-project')

describe('scanStructure', () => {
  it('detects app-router from src/app directory', async () => {
    const result = await scanStructure(nextjsFixture)
    expect(result.fingerprint.router).toBe('app-router')
  })

  it('detects Vercel deployment from vercel.json', async () => {
    const result = await scanStructure(nextjsFixture)
    expect(result.fingerprint.deploy).toBe('vercel')
    expect(result.detectedFiles).toContain('vercel.json')
  })

  it('returns empty result for empty directory', async () => {
    const result = await scanStructure(join(import.meta.dirname, '..', 'fixtures'))
    expect(result.fingerprint).toBeDefined()
    expect(result.fingerprint.router).toBeUndefined()
    expect(result.fingerprint.deploy).toBeUndefined()
  })
})
