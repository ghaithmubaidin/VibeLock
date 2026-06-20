import { exists, safeRead } from '../utils/fs.js'
import type { ScannerResult } from '../fingerprint/types.js'
import { join } from 'node:path'

export async function scanLockfile(rootDir: string): Promise<ScannerResult> {
  const result: ScannerResult = {
    fingerprint: {},
    detectedFiles: [],
  }

  // pnpm-lock.yaml (first check — pnpm is common)
  const pnpmLockPath = join(rootDir, 'pnpm-lock.yaml')
  if (await exists(pnpmLockPath)) {
    result.fingerprint.packageManager = 'pnpm'
    result.detectedFiles.push('pnpm-lock.yaml')
    const content = await safeRead(pnpmLockPath)
    if (content) {
      const versionMatch = content.match(/lockfileVersion:\s*([\d.]+)/)
      if (versionMatch?.[1]) {
        result.fingerprint.packageManagerVersion = versionMatch[1]
      }
    }
    return result
  }

  // yarn.lock
  const yarnLockPath = join(rootDir, 'yarn.lock')
  if (await exists(yarnLockPath)) {
    result.fingerprint.packageManager = 'yarn'
    result.detectedFiles.push('yarn.lock')
    return result
  }

  // package-lock.json
  const npmLockPath = join(rootDir, 'package-lock.json')
  if (await exists(npmLockPath)) {
    result.fingerprint.packageManager = 'npm'
    result.detectedFiles.push('package-lock.json')
    const content = await safeRead(npmLockPath)
    if (content) {
      try {
        const parsed = JSON.parse(content) as Record<string, unknown>
        if (parsed.lockfileVersion !== undefined) {
          result.fingerprint.packageManagerVersion = String(parsed.lockfileVersion)
        }
      } catch {
        // Ignore parse errors
      }
    }
    return result
  }

  // bun.lock / bun.lockb
  if (await exists(join(rootDir, 'bun.lock')) || await exists(join(rootDir, 'bun.lockb'))) {
    result.fingerprint.packageManager = 'bun'
    if (await exists(join(rootDir, 'bun.lock'))) result.detectedFiles.push('bun.lock')
    else result.detectedFiles.push('bun.lockb')
    return result
  }

  return result
}
