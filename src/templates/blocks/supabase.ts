import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function supabaseBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.baasVersion ? ` ${fp.baasVersion}` : ''
  return {
    id: 'supabase',
    source:
      fp.detectedFiles?.filter(
        (f) => f.includes('supabase') || f === 'package.json',
      ) ?? [],
    content: `## Supabase${version}
- Use the Supabase client from @supabase/supabase-js for database access
- Use Supabase Auth for authentication (signUp, signIn, session management)
- Use Row Level Security (RLS) policies for data access control
- Store Supabase URL and anon key in environment variables
- Use Supabase's real-time subscriptions for live data features`,
  }
}
