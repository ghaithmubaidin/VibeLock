import { describe, it, expect } from 'vitest'
import { scanLockfile } from '../../src/scanner/lockfile.js'
import { join } from 'node:path'

const nextjsFixture = join(import.meta.dirname, '..', 'fixtures', 'nextjs-project')
const monorepoFixture = join(import.meta.dirname, '..', 'fixtures', 'monorepo')

describe('scanLockfile', () => {
  it('detects pnpm from pnpm-lock.yaml', async () => {
    const result = await scanLockfile(monorepoFixture)
    expect(result.fingerprint.packageManager).toBe('pnpm')
    expect(result.detectedFiles).toContain('pnpm-lock.yaml')
  })

  it('returns empty result for no lockfile', async () => {
    const result = await scanLockfile(nextjsFixture)
    expect(result.fingerprint.packageManager).toBeUndefined()
    expect(result.detectedFiles).toEqual([])
  })

  it('first-found priority works', async () => {
    // monorepo has pnpm-lock.yaml only
    const result = await scanLockfile(monorepoFixture)
    expect(result.fingerprint.packageManager).toBe('pnpm')
  })
})
