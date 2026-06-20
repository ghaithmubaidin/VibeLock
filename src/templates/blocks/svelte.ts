import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function svelteBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.uiVersions?.svelte ? ` ${fp.uiVersions.svelte}` : ''
  return {
    id: 'svelte',
    source: [],
    content: `## Svelte${version}
- Use runes mode ($state, $derived, $effect) for Svelte 5 projects
- Keep reactive declarations minimal — derive from $state
- Use {#each} with keys for list rendering
- Scope styles with <style scoped> (default in Svelte)
- Extract shared logic into *.svelte.ts files`,
  }
}
