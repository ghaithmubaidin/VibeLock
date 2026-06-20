import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function reactBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.uiVersions?.react ?? ''
  const isV19OrHigher = !version || parseFloat(version) >= 19

  const compilationRules = isV19OrHigher
    ? `- Rely on the React Compiler for automatic memoization: remove manual useMemo and useCallback
- Avoid React.memo unless a specific bottleneck has been measured`
    : `- Use useCallback and useMemo only when you have measured a performance issue
- Use React.memo only for components with expensive renders`

  const stateRules = isV19OrHigher
    ? `- Use the use() hook to read Promises or Context dynamically inside components
- Use Actions (useActionState, useFormStatus, useOptimistic) for handling form submissions and mutations`
    : `- Keep state as local as possible; lift only when shared
- Prefer composable custom hooks over render-props or inheritance`

  return {
    id: 'react',
    source: fp.detectedFiles?.filter((f) => f === 'package.json') ?? [],
    globs: ['**/*.tsx', '**/*.jsx', 'src/components/**/*', 'components/**/*'],
    description: 'React development conventions, hooks, and React 19 compiler rules',
    content: `## React ${version}
- Use functional components with hooks — no class components
${compilationRules}
- Keep state as local as possible; lift only when shared
${stateRules}
- Never use the array index as a key prop
- Avoid anonymous functions and object/array literals directly in JSX props to prevent unnecessary re-renders`.trim(),
  }
}
