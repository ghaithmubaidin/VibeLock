import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function typescriptBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.langVersion ? ` ${fp.langVersion}` : ''
  return {
    id: 'typescript',
    source:
      fp.detectedFiles?.filter((f) => f === 'tsconfig.json' || f === 'package.json') ??
      [],
    globs: ['**/*.ts', '**/*.tsx', 'tsconfig.json', 'tsconfig.eslint.json'],
    description: 'Strict TypeScript configuration and type definition guidelines',
    content: `## TypeScript${version}
- Use strict mode TypeScript — no implicit any
- Prefer interfaces over types for object shapes
- Use type inference where possible; add explicit annotations for function signatures
- Use discriminated unions for state machines
- Avoid enums — use const objects with as const instead`,
  }
}
