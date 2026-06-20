import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function nextjsBlock(fp: StackFingerprint): RuleBlock {
  const versionNum = fp.frameworkVersion ? parseFloat(fp.frameworkVersion) : 16
  const isV15OrHigher = versionNum >= 15
  const isV16OrHigher = versionNum >= 16
  
  let cachingRules = '- Use Next.js built-in fetch with caching and revalidation'
  if (isV16OrHigher) {
    cachingRules = `- Adopt "use cache" directive for explicit, composable caching of data or component outputs
- Next.js 16 does not cache fetch requests by default; explicitly opt-in to caching where needed`
  } else if (isV15OrHigher) {
    cachingRules = `- Next.js 15 does not cache fetches by default; explicitly use caching utilities (e.g., revalidatePath, unstable_cache) where needed`
  }

  const routerRules =
    fp.router === 'app-router'
      ? `- Use Server Components by default; add 'use client' only for interactivity and browser APIs
- Fetch data in Server Components and stream UI shells using React Suspense
${cachingRules}
- Use Server Actions as the primary pattern for mutations and form submissions`
      : `- Use Pages Router patterns: getStaticProps / getServerSideProps / getStaticPaths
- Keep API routes under /pages/api`

  const performanceRules = isV15OrHigher 
    ? `- Enable Partial Prerendering (PPR) for mixing static shells with streamed dynamic content
- Use Turbopack (default in Next.js 15/16) for development performance`
    : ''

  return {
    id: 'nextjs',
    source:
      fp.detectedFiles?.filter((f) => f.includes('next') || f === 'package.json') ?? [],
    content: `## Next.js ${fp.frameworkVersion ?? ''}
${routerRules}
- Keep all API routes under app/ or pages/ directory
- Never import server-only modules into Client Components
- Use next/link for client-side navigation
- Place metadata exports in layout.tsx or page.tsx for SEO
${performanceRules}`.trim(),
  }
}
