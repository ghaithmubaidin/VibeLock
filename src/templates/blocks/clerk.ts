import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function clerkBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.authVersion ? ` ${fp.authVersion}` : ''
  return {
    id: 'clerk',
    source: [],
    globs: ['middleware.ts', 'src/middleware.ts', '**/*.tsx', '**/*.ts'],
    description: 'Clerk authentication flow and route protection rules',
    content: `## Clerk Auth${version}
- Wrap the app root with <ClerkProvider>
- Use useAuth / useUser hooks for client-side auth state
- Use Clerk middleware for route protection in Next.js
- Use <SignedIn>/<SignedOut> components for conditional rendering
- Store Clerk publishable key and secret key in environment variables`,
  }
}
