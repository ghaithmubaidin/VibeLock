import { exists, safeRead } from '../utils/fs.js'
import type { ScannerResult } from '../fingerprint/types.js'
import { join } from 'node:path'
import { logWarning } from '../utils/logger.js'

async function findFirst(rootDir: string, filenames: string[]): Promise<string | null> {
  for (const filename of filenames) {
    const fullPath = join(rootDir, filename)
    if (await exists(fullPath)) {
      return filename
    }
  }
  return null
}

export async function scanConfig(rootDir: string): Promise<ScannerResult> {
  const result: ScannerResult = {
    fingerprint: {},
    detectedFiles: [],
  }

  // tsconfig.json — language detection
  const tsconfigPath = join(rootDir, 'tsconfig.json')
  if (await exists(tsconfigPath)) {
    result.detectedFiles.push('tsconfig.json')
    result.fingerprint.lang = 'typescript'
    const content = await safeRead(tsconfigPath)
    if (content) {
      try {
        const parsed = JSON.parse(content) as Record<string, unknown>
        const compilerOptions = parsed.compilerOptions as Record<string, unknown> | undefined
        if (compilerOptions?.target) {
          result.fingerprint.langVersion = String(compilerOptions.target)
        }
      } catch (error) {
        logWarning(
          `Failed to parse ${tsconfigPath}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }
  }

  // jsconfig.json
  const jsconfigPath = join(rootDir, 'jsconfig.json')
  if (await exists(jsconfigPath)) {
    if (!result.fingerprint.lang) {
      result.fingerprint.lang = 'javascript'
    }
    result.detectedFiles.push('jsconfig.json')
  }

  // vite.config — bundler detection
  const viteConfig = await findFirst(rootDir, ['vite.config.ts', 'vite.config.js'])
  if (viteConfig) {
    result.fingerprint.bundler = 'vite'
    result.detectedFiles.push(viteConfig)
  }

  // next.config — framework detection
  const nextConfig = await findFirst(rootDir, [
    'next.config.ts',
    'next.config.js',
    'next.config.mjs',
  ])
  if (nextConfig) {
    result.detectedFiles.push(nextConfig)
    if (!result.fingerprint.framework) {
      result.fingerprint.framework = 'nextjs'
    }
  }

  // tailwind.config — CSS framework detection
  const tailwindConfig = await findFirst(rootDir, ['tailwind.config.ts', 'tailwind.config.js'])
  if (tailwindConfig) {
    result.fingerprint.cssFramework = 'tailwind'
    result.detectedFiles.push(tailwindConfig)
  }

  // shadcn/components.json
  const componentsJson = await findFirst(rootDir, ['components.json'])
  if (componentsJson) {
    result.detectedFiles.push(componentsJson)
    result.fingerprint.componentLib = 'shadcn'
  }

  // drizzle.config — ORM detection
  const drizzleConfig = await findFirst(rootDir, ['drizzle.config.ts', 'drizzle.config.js'])
  if (drizzleConfig) {
    result.detectedFiles.push(drizzleConfig)
    if (!result.fingerprint.orm) {
      result.fingerprint.orm = 'drizzle'
    }
  }

  // Prisma schema
  const prismaSchemaPath = join(rootDir, 'prisma', 'schema.prisma')
  if (await exists(prismaSchemaPath)) {
    result.detectedFiles.push('prisma/schema.prisma')
    result.fingerprint.orm = 'prisma'
    const content = await safeRead(prismaSchemaPath)
    if (content) {
      const providerMatch = content.match(/datasource\s+\w+\s*\{[^}]*provider\s*=\s*"(\w+)"/)
      if (providerMatch?.[1]) {
        const provider = providerMatch[1]
        switch (provider) {
          case 'postgresql':
            result.fingerprint.database = 'postgres'
            break
          case 'mysql':
            result.fingerprint.database = 'mysql'
            break
          case 'sqlite':
            result.fingerprint.database = 'sqlite'
            break
          case 'mongodb':
            result.fingerprint.database = 'mongodb'
            break
          case 'turso':
          case 'libsql':
            result.fingerprint.database = 'turso'
            break
        }
      }
    }
  }

  // Supabase config
  if (await exists(join(rootDir, 'supabase', 'config.toml'))) {
    result.detectedFiles.push('supabase/config.toml')
    result.fingerprint.baas = 'supabase'
  }

  // Turborepo
  if (await exists(join(rootDir, 'turbo.json'))) {
    result.detectedFiles.push('turbo.json')
    result.fingerprint.monorepo = 'turborepo'
  }

  // Nx
  if (await exists(join(rootDir, 'nx.json'))) {
    result.detectedFiles.push('nx.json')
    result.fingerprint.monorepo = 'nx'
  }

  return result
}
