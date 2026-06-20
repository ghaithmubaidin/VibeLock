import { describe, it, expect } from 'vitest'
import { scanConfig } from '../../src/scanner/config.js'
import { join } from 'node:path'

const nextjsFixture = join(import.meta.dirname, '..', 'fixtures', 'nextjs-project')
const monorepoFixture = join(import.meta.dirname, '..', 'fixtures', 'monorepo')

describe('scanConfig', () => {
  it('detects TypeScript from tsconfig.json', async () => {
    const result = await scanConfig(nextjsFixture)
    expect(result.fingerprint.lang).toBe('typescript')
    expect(result.detectedFiles).toContain('tsconfig.json')
  })

  it('detects Vite from vite.config.ts', async () => {
    const result = await scanConfig(nextjsFixture)
    expect(result.fingerprint.bundler).toBe('vite')
    expect(result.detectedFiles).toContain('vite.config.ts')
  })

  it('detects Tailwind from tailwind.config.ts', async () => {
    const result = await scanConfig(nextjsFixture)
    expect(result.fingerprint.cssFramework).toBe('tailwind')
    expect(result.detectedFiles).toContain('tailwind.config.ts')
  })

  it('detects shadcn from components.json', async () => {
    const result = await scanConfig(nextjsFixture)
    expect(result.fingerprint.componentLib).toBe('shadcn')
    expect(result.detectedFiles).toContain('components.json')
  })

  it('detects Drizzle from drizzle.config.ts', async () => {
    const result = await scanConfig(nextjsFixture)
    expect(result.fingerprint.orm).toBe('drizzle')
    expect(result.detectedFiles).toContain('drizzle.config.ts')
  })

  it('detects Prisma ORM and database from schema.prisma', async () => {
    const result = await scanConfig(monorepoFixture)
    expect(result.fingerprint.orm).toBe('prisma')
    expect(result.fingerprint.database).toBe('postgres')
    expect(result.detectedFiles).toContain('prisma/schema.prisma')
  })

  it('detects Turborepo from turbo.json', async () => {
    const result = await scanConfig(monorepoFixture)
    expect(result.fingerprint.monorepo).toBe('turborepo')
    expect(result.detectedFiles).toContain('turbo.json')
  })

  it('returns empty result for empty directory', async () => {
    const result = await scanConfig(join(import.meta.dirname, '..', 'fixtures'))
    expect(result.fingerprint).toBeDefined()
    // Should not find anything in the fixtures root
    expect(result.fingerprint.lang).toBeUndefined()
    expect(result.fingerprint.bundler).toBeUndefined()
    expect(result.fingerprint.cssFramework).toBeUndefined()
  })
})
