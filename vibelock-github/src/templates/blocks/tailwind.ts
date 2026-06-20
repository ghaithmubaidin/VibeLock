import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function tailwindBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.cssFrameworkVersion ? ` ${fp.cssFrameworkVersion}` : ''
  return {
    id: 'tailwind',
    source:
      fp.detectedFiles?.filter(
        (f) => f.includes('tailwind') || f === 'package.json',
      ) ?? [],
    content: `## Tailwind CSS${version}
- Use Tailwind utility classes directly in JSX — avoid custom CSS when utilities suffice
- Extract repeated utility patterns into components, not custom CSS classes
- Use @apply only for shared design system tokens, never as a CSS replacement
- Keep color palette in tailwind.config under theme.extend
- Use dark mode via the dark: variant, not separate CSS files`,
  }
}
