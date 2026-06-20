import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function viteBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.bundlerVersion ? ` ${fp.bundlerVersion}` : ''
  return {
    id: 'vite',
    source: fp.detectedFiles?.filter((f) => f.includes('vite.config')) ?? [],
    content: `## Vite${version}
- Use Vite's import.meta.env for environment variables
- Place static assets in /public folder
- Use Vite's built-in CSS and asset handling
- Configure aliases via resolve.alias in vite.config
- Use Vite's HMR-friendly plugin system for integrations`,
  }
}
