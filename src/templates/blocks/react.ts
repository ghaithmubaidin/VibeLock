import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function reactBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.uiVersions?.react ? ` ${fp.uiVersions.react}` : ''
  return {
    id: 'react',
    source: fp.detectedFiles?.filter((f) => f === 'package.json') ?? [],
    content: `## React${version}
- Use functional components with hooks — no class components
- Use React.memo only for components with expensive renders
- Keep state as local as possible; lift only when shared
- Use useCallback and useMemo only when you have measured a performance issue
- Prefer composable custom hooks over render-props or inheritance`,
  }
}
