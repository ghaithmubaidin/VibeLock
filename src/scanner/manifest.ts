import { exists, safeRead } from '../utils/fs.js'
import type { ScannerResult } from '../fingerprint/types.js'
import toml from 'toml'
import { join } from 'node:path'
import { logWarning } from '../utils/logger.js'

export interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

interface DetectionRule {
  packages: string[]
  value: string
  versionKey?: string
}

const FRAMEWORK_RULES: DetectionRule[] = [
  { packages: ['next'], value: 'nextjs', versionKey: 'next' },
  { packages: ['remix', '@remix-run/react'], value: 'remix', versionKey: 'remix' },
  { packages: ['nuxt'], value: 'nuxt', versionKey: 'nuxt' },
  { packages: ['@sveltejs/kit'], value: 'sveltekit', versionKey: '@sveltejs/kit' },
  { packages: ['astro'], value: 'astro', versionKey: 'astro' },
  { packages: ['express'], value: 'express', versionKey: 'express' },
  { packages: ['fastify'], value: 'fastify', versionKey: 'fastify' },
  { packages: ['hono'], value: 'hono', versionKey: 'hono' },
]

const UI_RULES: DetectionRule[] = [
  { packages: ['react', 'react-dom'], value: 'react', versionKey: 'react' },
  { packages: ['vue'], value: 'vue', versionKey: 'vue' },
  { packages: ['svelte'], value: 'svelte', versionKey: 'svelte' },
  { packages: ['solid-js'], value: 'solid', versionKey: 'solid-js' },
  { packages: ['preact'], value: 'preact', versionKey: 'preact' },
]

const ORM_RULES: DetectionRule[] = [
  { packages: ['drizzle-orm'], value: 'drizzle', versionKey: 'drizzle-orm' },
  { packages: ['@prisma/client'], value: 'prisma', versionKey: '@prisma/client' },
  { packages: ['typeorm'], value: 'typeorm', versionKey: 'typeorm' },
  { packages: ['sequelize'], value: 'sequelize', versionKey: 'sequelize' },
  { packages: ['mikro-orm'], value: 'mikro-orm', versionKey: 'mikro-orm' },
  { packages: ['kysely'], value: 'kysely', versionKey: 'kysely' },
]

const AUTH_RULES: DetectionRule[] = [
  { packages: ['@clerk/nextjs', '@clerk/react', 'clerk'], value: 'clerk', versionKey: '@clerk/nextjs' },
  { packages: ['next-auth'], value: 'next-auth', versionKey: 'next-auth' },
  { packages: ['better-auth'], value: 'better-auth', versionKey: 'better-auth' },
  { packages: ['lucia'], value: 'lucia', versionKey: 'lucia' },
]

const BAAS_RULES: DetectionRule[] = [
  { packages: ['@supabase/supabase-js', 'supabase'], value: 'supabase', versionKey: '@supabase/supabase-js' },
  { packages: ['firebase'], value: 'firebase', versionKey: 'firebase' },
  { packages: ['convex'], value: 'convex', versionKey: 'convex' },
  { packages: ['appwrite'], value: 'appwrite', versionKey: 'appwrite' },
]

const TEST_RUNNER_RULES: DetectionRule[] = [
  { packages: ['vitest'], value: 'vitest', versionKey: 'vitest' },
  { packages: ['jest'], value: 'jest', versionKey: 'jest' },
  { packages: ['mocha'], value: 'mocha', versionKey: 'mocha' },
  { packages: ['ava'], value: 'ava', versionKey: 'ava' },
]

const E2E_RUNNER_RULES: DetectionRule[] = [
  { packages: ['playwright', '@playwright/test'], value: 'playwright', versionKey: 'playwright' },
  { packages: ['cypress'], value: 'cypress', versionKey: 'cypress' },
  { packages: ['puppeteer'], value: 'puppeteer', versionKey: 'puppeteer' },
]

const CSS_FRAMEWORK_RULES: DetectionRule[] = [
  { packages: ['tailwindcss'], value: 'tailwind', versionKey: 'tailwindcss' },
  { packages: ['unocss'], value: 'unocss', versionKey: 'unocss' },
]

const COMPONENT_LIB_RULES: DetectionRule[] = [
  { packages: ['@radix-ui/react-core'], value: 'radix', versionKey: '@radix-ui/react-core' },
  { packages: ['daisyui'], value: 'daisyui', versionKey: 'daisyui' },
  { packages: ['@mantine/core'], value: 'mantine', versionKey: '@mantine/core' },
  { packages: ['@chakra-ui/react'], value: 'chakra', versionKey: '@chakra-ui/react' },
]

const DATABASE_RULES: DetectionRule[] = [
  { packages: ['pg', 'postgres'], value: 'postgres', versionKey: 'pg' },
  { packages: ['mysql', 'mysql2'], value: 'mysql', versionKey: 'mysql' },
  { packages: ['sqlite3', 'better-sqlite3', 'libsql'], value: 'sqlite', versionKey: 'sqlite3' },
  { packages: ['mongodb', 'mongoose'], value: 'mongodb', versionKey: 'mongodb' },
]

export async function scanManifest(rootDir: string): Promise<ScannerResult> {
  const result: ScannerResult = {
    fingerprint: {},
    detectedFiles: [],
  }

  await scanPackageJson(rootDir, result)
  await scanPyprojectToml(rootDir, result)

  return result
}

function detectFirstMatch(
  rules: DetectionRule[],
  depNames: string[],
  allDeps: Record<string, string>
): { value: string; version: string | undefined } | null {
  for (const rule of rules) {
    const match = rule.packages.find(pkg => depNames.includes(pkg))
    if (match) {
      const version = rule.versionKey ? allDeps[rule.versionKey] : undefined
      return { value: rule.value, version }
    }
  }
  return null
}

async function scanPackageJson(rootDir: string, result: ScannerResult): Promise<void> {
  const pkgPath = join(rootDir, 'package.json')
  const content = await safeRead(pkgPath)
  if (!content) return

  result.detectedFiles.push('package.json')

  let pkg: PackageJson
  try {
    pkg = JSON.parse(content) as PackageJson
  } catch (error) {
    logWarning(`Failed to parse ${pkgPath}: ${error instanceof Error ? error.message : String(error)}`)
    return
  }

  const allDeps: Record<string, string> = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  }

  const depNames = Object.keys(allDeps)

  // Detect framework
  const framework = detectFirstMatch(FRAMEWORK_RULES, depNames, allDeps)
  if (framework) {
    result.fingerprint.framework = framework.value as ScannerResult['fingerprint']['framework']
    result.fingerprint.frameworkVersion = framework.version
  }

  // Detect UI libraries and their versions
  const uiLibs: string[] = []
  const uiVersions: Record<string, string> = {}
  for (const rule of UI_RULES) {
    const match = rule.packages.find(pkg => depNames.includes(pkg))
    if (match) {
      uiLibs.push(rule.value)
      const version = rule.versionKey ? allDeps[rule.versionKey] : undefined
      if (version) {
        uiVersions[rule.value] = version
      }
    }
  }
  if (uiLibs.length > 0) {
    result.fingerprint.ui = uiLibs as ScannerResult['fingerprint']['ui']
    if (Object.keys(uiVersions).length > 0) {
      result.fingerprint.uiVersions = uiVersions
    }
  }

  // Language detection
  if (depNames.includes('typescript')) {
    result.fingerprint.lang = 'typescript'
    result.fingerprint.langVersion = allDeps['typescript']
  } else if (depNames.includes('ts-node') || depNames.includes('tsx')) {
    result.fingerprint.lang = 'typescript'
  }

  // ORM detection
  const orm = detectFirstMatch(ORM_RULES, depNames, allDeps)
  if (orm) {
    result.fingerprint.orm = orm.value as ScannerResult['fingerprint']['orm']
    if (orm.version) {
      result.fingerprint.ormVersion = orm.version
    }
  }

  // Auth detection
  const auth = detectFirstMatch(AUTH_RULES, depNames, allDeps)
  if (auth) {
    result.fingerprint.auth = auth.value as ScannerResult['fingerprint']['auth']
    if (auth.version) {
      result.fingerprint.authVersion = auth.version
    }
  }

  // BaaS detection
  const baas = detectFirstMatch(BAAS_RULES, depNames, allDeps)
  if (baas) {
    result.fingerprint.baas = baas.value as ScannerResult['fingerprint']['baas']
    if (baas.version) {
      result.fingerprint.baasVersion = baas.version
    }
  }

  // Test runner detection
  const testRunner = detectFirstMatch(TEST_RUNNER_RULES, depNames, allDeps)
  if (testRunner) {
    result.fingerprint.testRunner = testRunner.value as ScannerResult['fingerprint']['testRunner']
    if (testRunner.version) {
      result.fingerprint.testRunnerVersion = testRunner.version
    }
  }

  // E2E runner detection
  const e2eRunner = detectFirstMatch(E2E_RUNNER_RULES, depNames, allDeps)
  if (e2eRunner) {
    result.fingerprint.e2eRunner = e2eRunner.value as ScannerResult['fingerprint']['e2eRunner']
    if (e2eRunner.version) {
      result.fingerprint.e2eRunnerVersion = e2eRunner.version
    }
  }

  // CSS framework detection
  const cssFramework = detectFirstMatch(CSS_FRAMEWORK_RULES, depNames, allDeps)
  if (cssFramework) {
    result.fingerprint.cssFramework = cssFramework.value as ScannerResult['fingerprint']['cssFramework']
    if (cssFramework.version) {
      result.fingerprint.cssFrameworkVersion = cssFramework.version
    }
  }

  // Component lib detection
  const componentLib = detectFirstMatch(COMPONENT_LIB_RULES, depNames, allDeps)
  if (componentLib) {
    result.fingerprint.componentLib = componentLib.value as ScannerResult['fingerprint']['componentLib']
    if (componentLib.version) {
      result.fingerprint.componentLibVersion = componentLib.version
    }
  }

  // Database detection
  const database = detectFirstMatch(DATABASE_RULES, depNames, allDeps)
  if (database) {
    result.fingerprint.database = database.value as ScannerResult['fingerprint']['database']
    if (database.version) {
      result.fingerprint.databaseVersion = database.version
    }
  }

  // Shadcn detection (components.json trigger, but also detect via dep)
  if (depNames.includes('@radix-ui') && depNames.includes('tailwindcss') && depNames.includes('class-variance-authority')) {
    result.fingerprint.componentLib = 'shadcn'
  }
}

async function scanPyprojectToml(rootDir: string, result: ScannerResult): Promise<void> {
  const pyprojectPath = join(rootDir, 'pyproject.toml')
  const content = await safeRead(pyprojectPath)
  if (!content) return

  result.detectedFiles.push('pyproject.toml')
  result.fingerprint.lang = 'python'

  try {
    const parsed = toml.parse(content) as Record<string, unknown>

    // Check project dependencies
    const project = parsed.project as Record<string, unknown> | undefined
    if (project?.dependencies && Array.isArray(project.dependencies)) {
      const deps = project.dependencies as string[]
      const depNames = deps.map((d: string) => d.split(/[<>=!~^]/)[0]?.trim() ?? d)

      // Helper to extract version from dependency string
      const extractVersion = (depString: string): string | undefined => {
        const match = depString.match(/[<>=!~^]+\s*([\d.]+)/)
        return match ? match[1] : undefined
      }

      if (depNames.some((d: string) => d === 'fastapi' || d.startsWith('fastapi'))) {
        result.fingerprint.pythonFramework = 'fastapi'
        const depString = deps.find(d => d.startsWith('fastapi'))
        if (depString) {
          const version = extractVersion(depString)
          if (version) result.fingerprint.pythonFrameworkVersion = version
        }
      } else if (depNames.some((d: string) => d === 'django' || d.startsWith('django'))) {
        result.fingerprint.pythonFramework = 'django'
        const depString = deps.find(d => d.startsWith('django') || d.startsWith('Django'))
        if (depString) {
          const version = extractVersion(depString)
          if (version) result.fingerprint.pythonFrameworkVersion = version
        }
      } else if (depNames.some((d: string) => d === 'flask' || d.startsWith('flask'))) {
        result.fingerprint.pythonFramework = 'flask'
        const depString = deps.find(d => d.startsWith('flask') || d.startsWith('Flask'))
        if (depString) {
          const version = extractVersion(depString)
          if (version) result.fingerprint.pythonFrameworkVersion = version
        }
      } else if (depNames.some((d: string) => d === 'litestar' || d.startsWith('litestar'))) {
        result.fingerprint.pythonFramework = 'litestar'
        const depString = deps.find(d => d.startsWith('litestar'))
        if (depString) {
          const version = extractVersion(depString)
          if (version) result.fingerprint.pythonFrameworkVersion = version
        }
      }
    }

    // Check tool.poetry.dependencies (poetry format)
    const tool = parsed.tool as Record<string, unknown> | undefined
    const poetry = tool?.poetry as Record<string, unknown> | undefined
    if (poetry?.dependencies && typeof poetry.dependencies === 'object') {
      const poetryDeps = poetry.dependencies as Record<string, unknown>
      const depNames = Object.keys(poetryDeps)
      
      // Helper to extract version from poetry dependency
      const extractPoetryVersion = (dep: unknown): string | undefined => {
        if (typeof dep === 'string') {
          const match = dep.match(/[<>=!~^]+\s*([\d.]+)/)
          return match ? match[1] : dep.match(/[\d.]+/)?.[0]
        }
        if (typeof dep === 'object' && dep !== null && 'version' in dep) {
          const version = (dep as Record<string, unknown>).version
          if (typeof version === 'string') {
            const match = version.match(/[<>=!~^]+\s*([\d.]+)/)
            return match ? match[1] : version.match(/[\d.]+/)?.[0]
          }
        }
        return undefined
      }

      if (depNames.includes('fastapi')) {
        result.fingerprint.pythonFramework = 'fastapi'
        const version = extractPoetryVersion(poetryDeps['fastapi'])
        if (version) result.fingerprint.pythonFrameworkVersion = version
      } else if (depNames.includes('django') || depNames.includes('Django')) {
        result.fingerprint.pythonFramework = 'django'
        const version = extractPoetryVersion(poetryDeps['django'] ?? poetryDeps['Django'])
        if (version) result.fingerprint.pythonFrameworkVersion = version
      } else if (depNames.includes('flask') || depNames.includes('Flask')) {
        result.fingerprint.pythonFramework = 'flask'
        const version = extractPoetryVersion(poetryDeps['flask'] ?? poetryDeps['Flask'])
        if (version) result.fingerprint.pythonFrameworkVersion = version
      }
    }
  } catch (error) {
    logWarning(`Failed to parse pyproject.toml: ${error instanceof Error ? error.message : String(error)}`)
  }
}
