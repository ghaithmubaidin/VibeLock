import type { RuleBlock } from './types.js'

export function renderFencedBlocks(blocks: RuleBlock[]): string[] {
  const parts: string[] = []
  for (const block of blocks) {
    parts.push(`<!-- vibelock:${block.id} -->`)
    parts.push(block.content)
    parts.push(`<!-- /vibelock:${block.id} -->`)
    parts.push('')
  }
  return parts
}
