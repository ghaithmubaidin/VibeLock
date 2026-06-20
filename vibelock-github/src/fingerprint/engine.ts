import type { ScannerResult, StackFingerprint } from './types.js'
import { StackFingerprintSchema } from './types.js'
import { AppError } from '../utils/errors.js'

/**
 * Merge multiple scanner results into a single fingerprint.
 *
 * Merge rules:
 * - Config scanner overrides manifest scanner for the same key
 * - Structure scanner overrides config scanner for router detection
 * - All detectedFiles arrays are merged into a single unique set
 */
export function mergeFingerprints(results: ScannerResult[]): StackFingerprint {
  if (results.length === 0) {
    return {}
  }

  // Collect all detected files
  const allDetectedFiles = new Set<string>()
  for (const r of results) {
    for (const f of r.detectedFiles) {
      allDetectedFiles.add(f)
    }
  }

  // Merge fingerprints — process in order: manifest, config, structure, lockfile
  // Later values override earlier ones for same key (config overrides manifest,
  // structure overrides config for router)
  const merged: Partial<StackFingerprint> = {}
  const allUi = new Set<string>()

  for (const r of results) {
    const fp = r.fingerprint
    for (const [key, value] of Object.entries(fp)) {
      if (value === undefined || value === null) continue

      if (key === 'ui' && Array.isArray(value)) {
        for (const ui of value) {
          allUi.add(ui)
        }
        continue
      }

      // Structure scanner takes priority for router detection
      if (key === 'router') {
        ;(merged as Record<string, unknown>)[key] = value
        continue
      }

      ;(merged as Record<string, unknown>)[key] = value
    }
  }

  // Set merged UI array
  if (allUi.size > 0) {
    merged.ui = Array.from(allUi) as StackFingerprint['ui']
  }

  // Attach detected files
  if (allDetectedFiles.size > 0) {
    merged.detectedFiles = Array.from(allDetectedFiles).sort()
  }

  // Validate with zod
  const parsed = StackFingerprintSchema.safeParse(merged)

  if (!parsed.success) {
    throw new AppError(
      `Fingerprint validation failed: ${parsed.error.message}`,
      'FINGERPRINT_INVALID',
      true,
    )
  }

  return parsed.data
}

/**
 * Run all scanners and merge results into a single fingerprint.
 */
export async function buildFingerprint(
  runScanners: (rootDir: string) => Promise<ScannerResult[]>,
  rootDir: string,
): Promise<StackFingerprint> {
  const results = await runScanners(rootDir)
  return mergeFingerprints(results)
}
