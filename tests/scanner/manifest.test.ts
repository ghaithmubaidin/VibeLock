import { describe, it, expect } from 'vitest'
import { scanManifest } from '../../src/scanner/manifest.js'
import { join } from 'node:path'

const nextjsFixture = join(import.meta.dirname, '..', 'fixtures', 'nextjs-project')
const pythonFixture = join(import.meta.dirname, '..', 'fixtures', 'python-project')
const monorepoFixture = join(import.meta.dirname, '..', 'fixtures', 'monorepo')

describe('scanManifest', () => {
  it('detects Next.js framework from package.json', async () => {
    const result = await scanManifest(nextjsFixture)
    expect(result.fingerprint.framework).toBe('nextjs')
    expect(result.fingerprint.frameworkVersion).toBe('15.0.0')
  })

  it('detects React UI library', async () => {
    const result = await scanManifest(nextjsFixture)
    expect(result.fingerprint.ui).toContain('react')
  })

  it('detects TypeScript language', async () => {
    const result = await scanManifest(nextjsFixture)
    expect(result.fingerprint.lang).toBe('typescript')
    expect(result.fingerprint.langVersion).toBe('5.9.0')
  })

  it('detects Drizzle ORM', async () => {
    const result = await scanManifest(nextjsFixture)
    expect(result.fingerprint.orm).toBe('drizzle')
  })

  it('detects Clerk auth', async () => {
    const result = await scanManifest(nextjsFixture)
    expect(result.fingerprint.auth).toBe('clerk')
  })

  it('detects Vitest test runner', async () => {
    const result = await scanManifest(nextjsFixture)
    expect(result.fingerprint.testRunner).toBe('vitest')
  })

  it('detects Tailwind CSS', async () => {
    const result = await scanManifest(nextjsFixture)
    expect(result.fingerprint.cssFramework).toBe('tailwind')
  })

  it('detects Supabase BaaS', async () => {
    const result = await scanManifest(nextjsFixture)
    expect(result.fingerprint.baas).toBe('supabase')
  })

  it('detects Python FastAPI from pyproject.toml', async () => {
    const result = await scanManifest(pythonFixture)
    expect(result.fingerprint.lang).toBe('python')
    expect(result.fingerprint.pythonFramework).toBe('fastapi')
  })

  it('returns empty result for missing package.json', async () => {
    const result = await scanManifest(join(import.meta.dirname, '..', 'fixtures'))
    expect(result.fingerprint).toBeDefined()
    expect(result.fingerprint.framework).toBeUndefined()
  })

  it('detects detectedFiles array', async () => {
    const result = await scanManifest(nextjsFixture)
    expect(result.detectedFiles).toContain('package.json')
  })

  it('does not set fields absent from package.json', async () => {
    const result = await scanManifest(monorepoFixture)
    // monorepo fixture doesn't have Clerk, Supabase, Drizzle, etc.
    expect(result.fingerprint.auth).toBeUndefined()
    expect(result.fingerprint.baas).toBeUndefined()
    expect(result.fingerprint.orm).toBeUndefined()
    expect(result.fingerprint.e2eRunner).toBeUndefined()
    expect(result.fingerprint.pythonFramework).toBeUndefined()
  })

  it('does not guess Jest or Playwright when not present', async () => {
    const result = await scanManifest(nextjsFixture)
    expect(result.fingerprint.testRunner).not.toBe('jest')
    expect(result.fingerprint.e2eRunner).toBeUndefined()
  })
})
