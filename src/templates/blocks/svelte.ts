import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function svelteBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.uiVersions?.svelte ?? ''
  const isV5OrHigher = !version || parseFloat(version) >= 5

  const reactivityRules = isV5OrHigher
    ? `- Use Runes explicitly ($state, $derived, $effect) for reactivity — avoid Svelte 4 store syntax where runes fit
- Prefer $derived over $effect for computing derived values
- Use $props() for component inputs and define clear TypeScript interfaces for them`
    : `- Use reactive declarations ($:) to compute values
- Use Svelte stores (writable, readable, derived) for global state management`

  const logicRules = isV5OrHigher
    ? `- Extract shared reactive state logic into Svelte-compatible files (*.svelte.ts or *.svelte.js)
- Use Svelte 5 snippet syntax for reusable markup blocks`
    : `- Extract shared logic into custom stores or helper files (*.ts / *.js)`

  return {
    id: 'svelte',
    source: fp.detectedFiles?.filter((f) => f === 'package.json') ?? [],
    globs: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js', 'svelte.config.js'],
    description: 'Svelte 5 runes, snippets, reactivity, and style scoping rules',
    content: `## Svelte ${version}
${reactivityRules}
- Use {#each} with unique keys for rendering lists of items
- Scope styles inside Svelte components by default
${logicRules}
- Use event handlers directly (e.g. onclick={handler}) instead of deprecated event modifiers`.trim(),
  }
}
