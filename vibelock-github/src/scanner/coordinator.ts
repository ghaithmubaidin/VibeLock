import type { ScannerResult } from '../fingerprint/types.js'
import { scanManifest } from './manifest.js'
import { scanConfig } from './config.js'
import { scanStructure } from './structure.js'
import { scanLockfile } from './lockfile.js'
import { logWarning } from '../utils/logger.js'

export async function runAllScanners(rootDir: string): Promise<ScannerResult[]> {
  const results = await Promise.allSettled([
    scanManifest(rootDir),
    scanConfig(rootDir),
    scanStructure(rootDir),
    scanLockfile(rootDir),
  ])

  const successful: ScannerResult[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      successful.push(result.value)
    } else {
      logWarning(
        `Scanner failed: ${
          result.reason instanceof Error ? result.reason.message : String(result.reason)
        }`,
      )
    }
  }

  return successful
}
