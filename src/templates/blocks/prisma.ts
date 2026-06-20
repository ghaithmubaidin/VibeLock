import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function prismaBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.ormVersion ? ` ${fp.ormVersion}` : ''
  const dbNote = fp.database
    ? `\n- Database: ${fp.database} (detected from Prisma schema)`
    : ''

  return {
    id: 'prisma',
    source:
      fp.detectedFiles?.filter(
        (f) => f.includes('prisma') || f === 'package.json',
      ) ?? [],
    globs: ['prisma/**/*', 'schema.prisma', '**/schema.prisma'],
    description: 'Prisma ORM schema definition and client configuration guidelines',
    content: `## Prisma ORM${version}
- Define models in /prisma/schema.prisma${dbNote}
- Use prisma generate after schema changes
- Use prisma migrate dev for development migrations
- Access Prisma client via a singleton to avoid connection exhaustion
- Use Prisma Studio for data exploration: npx prisma studio`,
  }
}
