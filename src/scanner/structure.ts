import { exists } from '../utils/fs.js'
import type { ScannerResult } from '../fingerprint/types.js'
import { join } from 'node:path'

export async function scanStructure(rootDir: string): Promise<ScannerResult> {
  const result: ScannerResult = {
    fingerprint: {},
    detectedFiles: [],
  }

  // Next.js router detection
  // Check src/app/ directory
  if (await exists(join(rootDir, 'src', 'app'))) {
    // Only set if we also detect it's a Next.js project — but structure doesn't know that
    // Result will be merged by the fingerprint engine
    result.fingerprint.router = 'app-router'
  }
  // Check app/ directory at root
  if (await exists(join(rootDir, 'app'))) {
    result.fingerprint.router = 'app-router'
  }
  // Check src/pages/ — only set if app-router wasn't found
  if (!result.fingerprint.router && (await exists(join(rootDir, 'src', 'pages')))) {
    result.fingerprint.router = 'pages-router'
  }
  // Check pages/ at root
  if (!result.fingerprint.router && (await exists(join(rootDir, 'pages')))) {
    result.fingerprint.router = 'pages-router'
  }

  // Prisma directory
  if (await exists(join(rootDir, 'prisma'))) {
    result.detectedFiles.push('prisma/')
  }

  // Supabase directory
  if (await exists(join(rootDir, 'supabase'))) {
    result.detectedFiles.push('supabase/')
  }

  // Deployment detection via config files
  if (await exists(join(rootDir, 'vercel.json'))) {
    result.fingerprint.deploy = 'vercel'
    result.detectedFiles.push('vercel.json')
  }
  if (await exists(join(rootDir, 'netlify.toml'))) {
    result.fingerprint.deploy = 'netlify'
    result.detectedFiles.push('netlify.toml')
  }
  if (await exists(join(rootDir, 'fly.toml'))) {
    result.fingerprint.deploy = 'fly'
    result.detectedFiles.push('fly.toml')
  }
  if (
    (await exists(join(rootDir, 'wrangler.toml'))) ||
    (await exists(join(rootDir, 'wrangler.jsonc')))
  ) {
    result.fingerprint.deploy = 'cloudflare'
    if (await exists(join(rootDir, 'wrangler.toml'))) result.detectedFiles.push('wrangler.toml')
    else result.detectedFiles.push('wrangler.jsonc')
  }

  // pnpm-workspaces monorepo detection
  if (await exists(join(rootDir, 'pnpm-workspace.yaml'))) {
    result.detectedFiles.push('pnpm-workspace.yaml')
    result.fingerprint.monorepo = 'pnpm-workspaces'
  }

  return result
}
