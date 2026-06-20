import { describe, it, expect } from 'vitest'
import { diffBlocks } from '../../src/patcher/differ.js'
import type { RuleBlock } from '../../src/templates/blocks/nextjs.js'

function makeBlock(id: string, content: string): RuleBlock {
  return { id, content, source: [] }
}

describe('diffBlocks', () => {
  const newBlocks: RuleBlock[] = [
    makeBlock('nextjs', '## Next.js\n- Use Server Components'),
    makeBlock('tailwind', '## Tailwind CSS\n- Use utility classes'),
  ]

  it('returns all blocks as added when no existing content', () => {
    const diff = diffBlocks(null, newBlocks)
    expect(diff.added).toHaveLength(2)
    expect(diff.changed).toHaveLength(0)
    expect(diff.removed).toHaveLength(0)
    expect(diff.unchanged).toHaveLength(0)
  })

  it('detects unchanged blocks', () => {
    const existingContent = `<!-- vibelock:nextjs -->
## Next.js
- Use Server Components
<!-- /vibelock:nextjs -->`
    const diff = diffBlocks(existingContent, newBlocks)
    expect(diff.unchanged).toContain('nextjs')
    expect(diff.changed).toHaveLength(0)
    expect(diff.added).toHaveLength(1) // tailwind is new
  })

  it('detects changed blocks', () => {
    const existingContent = `<!-- vibelock:nextjs -->
## Next.js
- Old content
<!-- /vibelock:nextjs -->`
    const diff = diffBlocks(existingContent, newBlocks)
    expect(diff.changed).toHaveLength(1)
    expect(diff.changed[0]!.id).toBe('nextjs')
    expect(diff.unchanged).toHaveLength(0)
  })

  it('detects removed blocks', () => {
    const existingContent = `<!-- vibelock:jest -->
## Jest
- Use jest.mock
<!-- /vibelock:jest -->

<!-- vibelock:nextjs -->
## Next.js
- Use Server Components
<!-- /vibelock:nextjs -->`
    const diff = diffBlocks(existingContent, newBlocks)
    expect(diff.removed).toContain('jest')
    expect(diff.unchanged).toContain('nextjs')
    expect(diff.added).toContain(newBlocks[1]) // tailwind
  })

  it('handles empty current content', () => {
    const diff = diffBlocks('', newBlocks)
    expect(diff.added).toHaveLength(2)
  })

  it('handles content with no fenced sections', () => {
    const diff = diffBlocks('# Just a heading\n\nSome text without fences', newBlocks)
    expect(diff.added).toHaveLength(2)
    expect(diff.removed).toHaveLength(0)
  })

  it('handles block IDs with hyphens correctly', () => {
    const hyphenBlocks = [makeBlock('python-fastapi', '## FastAPI\n- Use async endpoints')]
    const existingContent = `<!-- vibelock:python-fastapi -->
## FastAPI
- Old content
<!-- /vibelock:python-fastapi -->`
    const diff = diffBlocks(existingContent, hyphenBlocks)
    expect(diff.changed).toHaveLength(1)
    expect(diff.changed[0]!.id).toBe('python-fastapi')
    expect(diff.unchanged).toHaveLength(0)
    expect(diff.added).toHaveLength(0)
    expect(diff.removed).toHaveLength(0)
  })
})
