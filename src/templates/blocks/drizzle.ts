import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function drizzleBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.ormVersion ? ` ${fp.ormVersion}` : ''
  return {
    id: 'drizzle',
    source:
      fp.detectedFiles?.filter(
        (f) => f.includes('drizzle') || f === 'package.json',
      ) ?? [],
    globs: ['db/**/*', 'src/db/**/*', 'schema.ts', 'drizzle.config.ts', '**/schema.ts'],
    description: 'Drizzle ORM schema patterns and queries guidelines',
    content: `## Drizzle ORM${version}
- Define schema in /src/db/schema.ts (or /db/schema.ts)
- Use drizzle-kit for migrations: npx drizzle-kit push / generate / migrate
- Use prepared statements for repeated queries
- Use Drizzle's relational queries over raw SQL for readability
- Keep database configuration in drizzle.config.ts`,
  }
}
