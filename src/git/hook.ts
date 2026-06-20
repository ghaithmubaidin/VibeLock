import { readFile, writeFile } from 'node:fs/promises'
import { exists } from '../utils/fs.js'
import { AppError } from '../utils/errors.js'
import { join } from 'node:path'

export async function installHook(rootDir: string): Promise<void> {
  const hookPath = join(rootDir, '.git', 'hooks', 'pre-commit')

  const hookStart = '# vibelock-start'
  const hookEnd = '# vibelock-end'
  const hookLine = `${hookStart}
if [ -x "./node_modules/.bin/vibelock" ]; then
  ./node_modules/.bin/vibelock scan --hook
elif command -v vibelock >/dev/null 2>&1; then
  vibelock scan --hook
fi
${hookEnd}
`

  const hookExists = await exists(hookPath)

  if (!hookExists) {
    // No existing hook — create new one
    await writeFile(hookPath, '#!/bin/sh\n\n' + hookLine, { mode: 0o755 })
    return
  }

  // Hook exists — check if vibelock is already installed
  const existingContent = await readFile(hookPath, 'utf-8')

  const startIdx = existingContent.indexOf(hookStart)
  const endIdx = existingContent.indexOf(hookEnd)

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    // Fenced block already exists - replace it to update it
    const before = existingContent.substring(0, startIdx)
    const after = existingContent.substring(endIdx + hookEnd.length)
    const updatedContent = before.trimEnd() + '\n\n' + hookLine.trim() + '\n' + after.trimStart()
    await writeFile(hookPath, updatedContent, { mode: 0o755 })
    return
  }

  if (existingContent.includes('vibelock')) {
    // Backward compatibility: replace old unfenced vibelock lines with new fenced block
    const lines = existingContent.split('\n')
    const filtered = lines.filter((line) => !line.includes('vibelock'))
    const cleanedContent = filtered.join('\n').trimEnd()
    const updatedContent = cleanedContent + '\n\n' + hookLine
    await writeFile(hookPath, updatedContent, { mode: 0o755 })
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

  const hookStart = '# vibelock-start'
  const hookEnd = '# vibelock-end'

  if (!content.includes('vibelock') && !content.includes(hookStart)) return

  let newContent: string

  const startIdx = content.indexOf(hookStart)
  const endIdx = content.indexOf(hookEnd)

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = content.substring(0, startIdx)
    const after = content.substring(endIdx + hookEnd.length)
    newContent = before + after
  } else {
    // Fallback to old behavior: remove lines containing 'vibelock'
    // but do NOT filter out empty lines
    const lines = content.split('\n')
    const filtered = lines.filter((line) => !line.includes('vibelock'))
    newContent = filtered.join('\n')
  }

  const trimmed = newContent.trim()

  if (trimmed === '' || trimmed === '#!/bin/sh') {
    // Nothing left but the shebang — remove the hook entirely
    try {
      const { unlink } = await import('node:fs/promises')
      await unlink(hookPath)
    } catch {
      throw new AppError('Failed to remove pre-commit hook', 'HOOK_REMOVE_FAILED')
    }
    return
  }

  await writeFile(hookPath, trimmed + '\n', { mode: 0o755 })
}
