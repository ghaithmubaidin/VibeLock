import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function vitestBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.testRunnerVersion ? ` ${fp.testRunnerVersion}` : ''
  return {
    id: 'vitest',
    source: fp.detectedFiles?.filter((f) => f === 'package.json') ?? [],
    content: `## Vitest${version}
- Place test files next to the code they test (*.test.ts)
- Use describe/it blocks for test organization
- Use vi.mock for module mocking, vi.fn for function mocks
- Use vi.useFakeTimers for time-dependent code
- Run tests with: npx vitest run`,
  }
}
