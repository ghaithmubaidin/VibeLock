import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function jestBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.testRunnerVersion ? ` ${fp.testRunnerVersion}` : ''
  return {
    id: 'jest',
    source: [],
    globs: [
      '**/*.test.ts',
      '**/*.test.js',
      'jest.config.js',
      'jest.config.ts',
      '**/__tests__/**/*',
    ],
    description: 'Jest testing framework rules and assertion styles',
    content: `## Jest${version}
- Place test files in __tests__/ directories or next to code (*.test.ts)
- Use describe/it blocks for test organization
- Use jest.mock() for module mocking, jest.fn() for function mocks
- Use jest.useFakeTimers() for time-dependent code
- Run tests with: npx jest`,
  }
}
