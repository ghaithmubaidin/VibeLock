import { describe, it, expect } from 'vitest'
import { getRuleBlocks } from '../../src/templates/registry.js'
import type { StackFingerprint } from '../../src/fingerprint/types.js'
import { join } from 'node:path'
import { writeFile, mkdir, rm } from 'node:fs/promises'

const tmpDir = join(import.meta.dirname, '..', 'fixtures', 'tmp-rules-project')

describe('getRuleBlocks with custom overrides', () => {
  it('returns default rule blocks when no overrides exist', async () => {
    const fingerprint: StackFingerprint = {
      lang: 'typescript',
      langVersion: 'ES2022',
      detectedFiles: ['package.json']
    }
    const blocks = await getRuleBlocks(fingerprint)
    const tsBlock = blocks.find(b => b.id === 'typescript')
    expect(tsBlock).toBeDefined()
    expect(tsBlock?.content).toContain('Use strict mode TypeScript')
  })

  it('overrides default rule block when custom rule file exists', async () => {
    const fingerprint: StackFingerprint = {
      lang: 'typescript',
      langVersion: 'ES2022',
      detectedFiles: ['package.json']
    }

    // Set up mock custom rule directory
    const rulesDir = join(tmpDir, '.vibelock', 'rules')
    await mkdir(rulesDir, { recursive: true })
    const customRulePath = join(rulesDir, 'typescript.md')
    await writeFile(customRulePath, '## Custom TS Rules\n- Custom rule 1\n- Custom rule 2', 'utf-8')

    try {
      const blocks = await getRuleBlocks(fingerprint, tmpDir)
      const tsBlock = blocks.find(b => b.id === 'typescript')
      expect(tsBlock).toBeDefined()
      expect(tsBlock?.content).toBe('## Custom TS Rules\n- Custom rule 1\n- Custom rule 2')
      expect(tsBlock?.source).toContain(join('.vibelock', 'rules', 'typescript.md'))
    } finally {
      // Clean up
      await rm(tmpDir, { recursive: true, force: true })
    }
  })
})
