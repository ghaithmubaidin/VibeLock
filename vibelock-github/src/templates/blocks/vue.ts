import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function vueBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.uiVersions?.vue ? ` ${fp.uiVersions.vue}` : ''
  return {
    id: 'vue',
    source: [],
    content: `## Vue${version}
- Use the Composition API with <script setup> syntax
- Keep component logic in composables under /composables
- Use v-for with :key binding on every iteration
- Prefer defineProps / defineEmits over options API
- Use <script setup> for single-file components`,
  }
}
