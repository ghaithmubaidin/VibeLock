import { describe, it, expect } from 'vitest'
import { mergeFingerprints } from '../../src/fingerprint/engine.js'
import type { ScannerResult } from '../../src/fingerprint/types.js'

describe('mergeFingerprints', () => {
  it('merges non-overlapping fingerprints', () => {
    const results: ScannerResult[] = [
      {
        fingerprint: { framework: 'nextjs', lang: 'typescript' },
        detectedFiles: ['package.json'],
      },
      {
        fingerprint: { bundler: 'vite' },
        detectedFiles: ['vite.config.ts'],
      },
    ]
    const merged = mergeFingerprints(results)
    expect(merged.framework).toBe('nextjs')
    expect(merged.lang).toBe('typescript')
    expect(merged.bundler).toBe('vite')
  })

  it('config scanner overrides manifest for framework', () => {
    const results: ScannerResult[] = [
      {
        fingerprint: { framework: 'express', frameworkVersion: '5.0.0' },
        detectedFiles: ['package.json'],
      },
      {
        fingerprint: { framework: 'nextjs' },
        detectedFiles: ['next.config.ts'],
      },
    ]
    const merged = mergeFingerprints(results)
    // config scanner (index 1) overrides manifest (index 0)
    expect(merged.framework).toBe('nextjs')
  })

  it('structure scanner overrides config for router', () => {
    const results: ScannerResult[] = [
      {
        fingerprint: { framework: 'nextjs', router: 'pages-router' },
        detectedFiles: ['next.config.ts'],
      },
      {
        fingerprint: { router: 'app-router' },
        detectedFiles: [],
      },
    ]
    const merged = mergeFingerprints(results)
    expect(merged.router).toBe('app-router')
  })

  it('merges UI arrays', () => {
    const results: ScannerResult[] = [
      {
        fingerprint: { ui: ['react'] },
        detectedFiles: ['package.json'],
      },
      {
        fingerprint: { ui: ['react'] },
        detectedFiles: [],
      },
    ]
    const merged = mergeFingerprints(results)
    expect(merged.ui).toEqual(['react'])
  })

  it('handles empty results', () => {
    const merged = mergeFingerprints([])
    expect(merged).toEqual({})
  })

  it('collects all detected files', () => {
    const results: ScannerResult[] = [
      {
        fingerprint: { framework: 'nextjs' },
        detectedFiles: ['package.json', 'next.config.ts'],
      },
      {
        fingerprint: { bundler: 'vite' },
        detectedFiles: ['vite.config.ts'],
      },
    ]
    const merged = mergeFingerprints(results)
    expect(merged.detectedFiles).toContain('package.json')
    expect(merged.detectedFiles).toContain('next.config.ts')
    expect(merged.detectedFiles).toContain('vite.config.ts')
  })

  it('deduplicates detected files', () => {
    const results: ScannerResult[] = [
      {
        fingerprint: {},
        detectedFiles: ['package.json', 'package.json'],
      },
    ]
    const merged = mergeFingerprints(results)
    expect(merged.detectedFiles).toEqual(['package.json'])
  })

  it('throws AppError for invalid fingerprint', () => {
    const results: ScannerResult[] = [
      {
        fingerprint: { lang: 'invalid-lang' as never },
        detectedFiles: [],
      },
    ]
    expect(() => mergeFingerprints(results)).toThrow()
  })
})
