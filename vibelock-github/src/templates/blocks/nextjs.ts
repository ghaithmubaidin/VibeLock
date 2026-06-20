import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function nextjsBlock(fp: StackFingerprint): RuleBlock {
  const routerRules =
    fp.router === 'app-router'
      ? `- Use Server Components by default; add 'use client' only for interactive components
- Fetch data in Server Components, not in useEffect
- Use Next.js built-in fetch with caching and revalidation`
      : `- Use Pages Router patterns: getStaticProps / getServerSideProps / getStaticPaths
- Do not mix App Router patterns into this project
- Keep API routes under /pages/api`

  return {
    id: 'nextjs',
    source:
      fp.detectedFiles?.filter((f) => f.includes('next') || f === 'package.json') ?? [],
    content: `## Next.js ${fp.frameworkVersion ?? ''}
${routerRules}
- Keep all API routes under app/ or pages/ directory
- Never import server-only modules into Client Components
- Use next/link for client-side navigation
- Place metadata exports in layout.tsx or page.tsx for SEO`,
  }
}
