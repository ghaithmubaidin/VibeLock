import type { StackFingerprint } from '../../fingerprint/types.js'
import type { RuleBlock } from '../types.js'

export function firebaseBlock(fp: StackFingerprint): RuleBlock {
  const version = fp.baasVersion ? ` ${fp.baasVersion}` : ''
  return {
    id: 'firebase',
    source: fp.detectedFiles?.filter((f) => f.includes('firebase') || f === 'package.json') ?? [],
    globs: [
      'firebase.json',
      'firestore.rules',
      'database.rules',
      'storage.rules',
      '**/*firebase*',
      'src/lib/firebase/**/*',
      'lib/firebase/**/*',
    ],
    description:
      'Firebase SDK initialization, Security Rules, App Check, and Cloud Functions guidelines',
    content: `## Firebase${version}
- **Environment Isolation:** Use separate Firebase projects and configurations for development, staging, and production environments.
- **Zero Trust Security:** Enforce strict Firebase Security Rules (Firestore, Storage, Realtime Database) with default-deny policies, relying on client-side requests only for basic reads/writes and moving sensitive mutation logic to Cloud Functions.
- **App Check:** Enable Firebase App Check with App Attest, Play Integrity, or DeviceCheck to secure APIs from abuse, replay attacks, and unauthorized bots.
- **Firestore Cost & Performance:** Avoid deep subcollection nesting, use paginated queries, monitor indexing with Query Explain, and limit active \`onSnapshot\` listeners to optimize costs and prevent read hotspots.
- **Initialization:** Initialize the Firebase SDK once via a shared singleton instance (e.g., \`getFirestore(app)\`) to avoid duplicate connections.`.trim(),
  }
}
