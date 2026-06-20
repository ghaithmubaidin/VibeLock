import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function tailwindBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.cssFrameworkVersion ?? ''
  const isV4OrHigher = !version || parseFloat(version) >= 4

  const configRules = isV4OrHigher
    ? `- Configure your design tokens (colors, theme, spacing) directly in CSS files using the @theme block
- Do not use a tailwind.config.js file for configuration (Tailwind v4 is CSS-first)
- Use native CSS cascade layers (@layer theme, base, components, utilities) to manage custom styles and overrides`
    : `- Keep color palette and custom design configurations in tailwind.config.js under theme.extend
- Use base, components, and utilities directives to organize custom styles`

  const importRules = isV4OrHigher
    ? `- Use a single @import "tailwindcss" import in your main CSS entry point`
    : `- Use separate @tailwind base, @tailwind components, and @tailwind utilities directives`

  return {
    id: 'tailwind',
    source:
      fp.detectedFiles?.filter(
        (f) => f.includes('tailwind') || f === 'package.json',
      ) ?? [],
    content: `## Tailwind CSS ${version}
- Use Tailwind utility classes directly in markup instead of extracting custom classes
- Organize classes logically: Layout → Sizing → Typography → Colors → Interactive States
${configRules}
${importRules}
- Use built-in accessibility helpers (e.g., sr-only, focus-visible:outline-none) rather than removing outlines globally`.trim(),
  }
}
