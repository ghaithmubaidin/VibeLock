import { describe, it, expect } from 'vitest'
import { initCommand } from '../../src/commands/init.js'
import { scanCommand } from '../../src/commands/scan.js'
import { join } from 'node:path'
import { writeFile, mkdir, rm, readFile } from 'node:fs/promises'
import { exists } from '../../src/utils/fs.js'

const tmpDir = join(import.meta.dirname, '..', 'fixtures', 'tmp-command-project')

describe('init and scan commands', () => {
  it('initializes non-interactively and generates granular rules', async () => {
    await rm(tmpDir, { recursive: true, force: true })
    await mkdir(join(tmpDir, '.git', 'hooks'), { recursive: true })

    // Create a mock project stack (typescript and vitest)
    const pkgJson = {
      dependencies: {
        typescript: '^5.0.0',
        vitest: '^1.0.0',
      }
    }
    await writeFile(join(tmpDir, 'package.json'), JSON.stringify(pkgJson, null, 2), 'utf-8')

    // 1. Run init Command non-interactively
    await initCommand({ cwd: tmpDir, yes: true })

    // Verify AGENTS.md and CLAUDE.md are created
    expect(await exists(join(tmpDir, 'AGENTS.md'))).toBe(true)
    expect(await exists(join(tmpDir, 'CLAUDE.md'))).toBe(true)

    // 2. Run scanCommand targeting .cursor/rules
    await scanCommand({ cwd: tmpDir, targets: ['.cursor/rules'] })

    // Verify .cursor/rules contains typescript.mdc and vitest.mdc
    const cursorRulesDir = join(tmpDir, '.cursor', 'rules')
    expect(await exists(join(cursorRulesDir, 'typescript.mdc'))).toBe(true)
    expect(await exists(join(cursorRulesDir, 'vitest.mdc'))).toBe(true)

    const tsMdc = await readFile(join(cursorRulesDir, 'typescript.mdc'), 'utf-8')
    expect(tsMdc).toContain('title: vibelock — typescript')
    expect(tsMdc).toContain('globs: ["**/*.ts", "**/*.tsx", "tsconfig.json", "tsconfig.eslint.json"]')

    // 3. Remove vitest from stack (re-write package.json with only typescript)
    const updatedPkgJson = {
      dependencies: {
        typescript: '^5.0.0'
      }
    }
    await writeFile(join(tmpDir, 'package.json'), JSON.stringify(updatedPkgJson, null, 2), 'utf-8')

    // Run scanCommand again
    await scanCommand({ cwd: tmpDir, targets: ['.cursor/rules'] })

    // Verify vitest.mdc is deleted because it is stale, while typescript.mdc remains
    expect(await exists(join(cursorRulesDir, 'typescript.mdc'))).toBe(true)
    expect(await exists(join(cursorRulesDir, 'vitest.mdc'))).toBe(false)

    // Clean up
    await rm(tmpDir, { recursive: true, force: true })
  })
})
