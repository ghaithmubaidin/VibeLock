import { readFile, writeFile, chmod } from 'node:fs/promises'
import { exists } from '../utils/fs.js'
import { AppError } from '../utils/errors.js'
import { join } from 'node:path'

export async function installHook(rootDir: string): Promise<void> {
  const hookPath = join(rootDir, '.git', 'hooks', 'pre-commit')
  
  const hookLine = `# vibelock pre-commit hook
./node_modules/.bin/vibelock scan --hook
`

  const hookExists = await exists(hookPath)

  if (!hookExists) {
    // No existing hook — create new one
    await writeFile(hookPath, '#!/bin/sh\n' + hookLine, { mode: 0o755 })
    return
  }

  // Hook exists — check if vibelock is already installed
  const existingContent = await readFile(hookPath, 'utf-8')

  if (existingContent.includes('vibelock')) {
    // vibelock already in the hook — no-op
    return
  }

  // Append vibelock to the existing hook
  const updatedContent = existingContent.trimEnd() + '\n\n' + hookLine
  await writeFile(hookPath, updatedContent, { mode: 0o755 })
}

export async function uninstallHook(rootDir: string): Promise<void> {
  const hookPath = join(rootDir, '.git', 'hooks', 'pre-commit')

  const hookExists = await exists(hookPath)
  if (!hookExists) return

  const content = await readFile(hookPath, 'utf-8')

  if (!content.includes('vibelock')) return

  // Remove vibelock lines
  const lines = content.split('\n')
  const filtered = lines.filter(
    (line) => !line.includes('vibelock') && line.trim() !== '',
  )

  if (filtered.length === 0 || (filtered.length === 1 && filtered[0] === '#!/bin/sh')) {
    // Nothing left but the shebang — remove the hook entirely
    try {
      const { unlink } = await import('node:fs/promises')
      await unlink(hookPath)
    } catch {
      throw new AppError('Failed to remove pre-commit hook', 'HOOK_REMOVE_FAILED')
    }
    return
  }

  await writeFile(hookPath, filtered.join('\n') + '\n', { mode: 0o755 })
}
