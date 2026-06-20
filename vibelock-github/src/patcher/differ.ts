import type { RuleBlock } from '../templates/types.js'
import { parseFencedSections, getExistingBlockIds } from '../templates/outputs/agents-md.js'

export interface DiffResult {
  changed: RuleBlock[]
  added: RuleBlock[]
  removed: string[]
  unchanged: string[]
}

/**
 * Diff the current AGENTS.md content against the newly generated rule blocks.
 * Returns what changed, what was added, and what was removed.
 */
export function diffBlocks(
  currentContent: string | null,
  newBlocks: RuleBlock[],
): DiffResult {
  const result: DiffResult = {
    changed: [],
    added: [],
    removed: [],
    unchanged: [],
  }

  // No existing content — everything is new
  if (!currentContent) {
    result.added = [...newBlocks]
    return result
  }

  const existingSections = parseFencedSections(currentContent)
  const existingIds = getExistingBlockIds(currentContent)
  const newBlockMap = new Map<string, RuleBlock>()

  for (const block of newBlocks) {
    newBlockMap.set(block.id, block)
  }

  // Check for changed and unchanged blocks
  for (const [id, existingContent] of existingSections) {
    const newBlock = newBlockMap.get(id)
    if (!newBlock) {
      // Block no longer in fingerprint — mark as removed
      result.removed.push(id)
    } else if (newBlock.content.trim() === existingContent.trim()) {
      result.unchanged.push(id)
    } else {
      result.changed.push(newBlock)
    }
  }

  // Check for entirely new blocks
  for (const block of newBlocks) {
    if (!existingIds.includes(block.id)) {
      result.added.push(block)
    }
  }

  return result
}
