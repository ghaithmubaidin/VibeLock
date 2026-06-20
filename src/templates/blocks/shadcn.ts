import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function shadcnBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.componentLibVersion ? ` ${fp.componentLibVersion}` : ''
  return {
    id: 'shadcn',
    source:
      fp.detectedFiles?.filter((f) => f === 'components.json' || f === 'package.json') ??
      [],
    globs: ['components/ui/**/*', 'src/components/ui/**/*', 'components.json'],
    description: 'Shadcn UI component installation and customization guidelines',
    content: `## shadcn/ui${version}
- Components live in /src/components/ui (or /components/ui)
- Use the shadcn CLI to add new components: npx shadcn add <component>
- Customize components by editing the generated files directly
- Use cn() utility for conditional class merging
- Theme is controlled via CSS variables in globals.css — update there, not in components`,
  }
}
