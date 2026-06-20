import type { DiffResult } from './differ.js'

/**
 * Apply a diff result to the current file content.
 * - For changed blocks: replace content between fences
 * - For removed blocks: delete entire fenced section including fences
 * - For added blocks: append at end of file
 * Never touches content outside <!-- vibelock:X --> fences.
 */
export function applyPatch(
  currentContent: string | null,
  diff: DiffResult,
): string {
  let content = currentContent ?? ''

  // Handle removed blocks
  for (const id of diff.removed) {
    const regex = new RegExp(
      `<!--\\s*vibelock:${id}\\s*-->[\\s\\S]*?<!--\\s*\\/vibelock:${id}\\s*-->\\n?`,
      'g',
    )
    content = content.replace(regex, '')
  }

  // Handle changed blocks — replace content between fences
  for (const block of diff.changed) {
    const regex = new RegExp(
      `(<!--\\s*vibelock:${block.id}\\s*-->)[\\s\\S]*?(<!--\\s*\\/vibelock:${block.id}\\s*-->)`,
    )
    content = content.replace(regex, `$1\n${block.content}\n$2`)
  }

  // Handle added blocks — append at end
  if (diff.added.length > 0) {
    const additions: string[] = []

    if (content.length > 0 && !content.endsWith('\n')) {
      content += '\n'
    }

    for (const block of diff.added) {
      additions.push('')
      additions.push(`<!-- vibelock:${block.id} -->`)
      additions.push(block.content)
      additions.push(`<!-- /vibelock:${block.id} -->`)
    }

    content += additions.join('\n') + '\n'
  }

  return content
}
