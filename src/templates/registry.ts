import type { StackFingerprint } from '../fingerprint/types.js'
import type { RuleBlock } from './types.js'
import { nextjsBlock } from './blocks/nextjs.js'
import { reactBlock } from './blocks/react.js'
import { vueBlock } from './blocks/vue.js'
import { svelteBlock } from './blocks/svelte.js'
import { viteBlock } from './blocks/vite.js'
import { tailwindBlock } from './blocks/tailwind.js'
import { shadcnBlock } from './blocks/shadcn.js'
import { drizzleBlock } from './blocks/drizzle.js'
import { prismaBlock } from './blocks/prisma.js'
import { supabaseBlock } from './blocks/supabase.js'
import { firebaseBlock } from './blocks/firebase.js'
import { clerkBlock } from './blocks/clerk.js'
import { vitestBlock } from './blocks/vitest.js'
import { jestBlock } from './blocks/jest.js'
import { pythonFastapiBlock } from './blocks/python-fastapi.js'
import { pythonDjangoBlock } from './blocks/python-django.js'
import { typescriptBlock } from './blocks/typescript.js'
import { safeRead, exists } from '../utils/fs.js'
import { join } from 'node:path'

function getDefaultRuleBlocks(fingerprint: StackFingerprint): RuleBlock[] {
  const blocks: RuleBlock[] = []

  // Framework blocks
  if (fingerprint.framework === 'nextjs') {
    blocks.push(nextjsBlock(fingerprint))
  }

  // UI library blocks
  if (fingerprint.ui?.includes('react')) {
    blocks.push(reactBlock(fingerprint))
  }
  if (fingerprint.ui?.includes('vue')) {
    blocks.push(vueBlock(fingerprint))
  }
  if (fingerprint.ui?.includes('svelte')) {
    blocks.push(svelteBlock(fingerprint))
  }

  // Bundler blocks
  if (fingerprint.bundler === 'vite') {
    blocks.push(viteBlock(fingerprint))
  }

  // CSS framework blocks
  if (fingerprint.cssFramework === 'tailwind') {
    blocks.push(tailwindBlock(fingerprint))
  }

  // Component library blocks
  if (fingerprint.componentLib === 'shadcn') {
    blocks.push(shadcnBlock(fingerprint))
  }

  // ORM blocks
  if (fingerprint.orm === 'drizzle') {
    blocks.push(drizzleBlock(fingerprint))
  }
  if (fingerprint.orm === 'prisma') {
    blocks.push(prismaBlock(fingerprint))
  }

  // BaaS blocks
  if (fingerprint.baas === 'supabase') {
    blocks.push(supabaseBlock(fingerprint))
  }
  if (fingerprint.baas === 'firebase') {
    blocks.push(firebaseBlock(fingerprint))
  }

  // Auth blocks
  if (fingerprint.auth === 'clerk') {
    blocks.push(clerkBlock(fingerprint))
  }

  // Test runner blocks
  if (fingerprint.testRunner === 'vitest') {
    blocks.push(vitestBlock(fingerprint))
  }
  if (fingerprint.testRunner === 'jest') {
    blocks.push(jestBlock(fingerprint))
  }

  // Python framework blocks
  if (fingerprint.pythonFramework === 'fastapi') {
    blocks.push(pythonFastapiBlock(fingerprint))
  }
  if (fingerprint.pythonFramework === 'django') {
    blocks.push(pythonDjangoBlock(fingerprint))
  }

  // Language blocks
  if (fingerprint.lang === 'typescript') {
    blocks.push(typescriptBlock(fingerprint))
  }

  return blocks
}

export async function getRuleBlocks(
  fingerprint: StackFingerprint,
  cwd?: string,
): Promise<RuleBlock[]> {
  const blocks = getDefaultRuleBlocks(fingerprint)

  if (cwd) {
    for (const block of blocks) {
      const customPath = join(cwd, '.vibelock', 'rules', `${block.id}.md`)
      if (await exists(customPath)) {
        const customContent = await safeRead(customPath)
        if (customContent !== null) {
          block.content = customContent.trim()

          // Add custom rules file to the block sources
          const relPath = join('.vibelock', 'rules', `${block.id}.md`)
          if (!block.source.includes(relPath)) {
            block.source.push(relPath)
          }
        }
      }
    }
  }

  return blocks
}
