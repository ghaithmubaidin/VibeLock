import { z } from 'zod'

export const StackFingerprintSchema = z.object({
  // Language
  lang: z.enum(['typescript', 'javascript', 'python', 'rust', 'go']).optional(),
  langVersion: z.string().optional(),

  // JS/TS framework
  framework: z
    .enum(['nextjs', 'remix', 'nuxt', 'sveltekit', 'astro', 'express', 'fastify', 'hono'])
    .optional(),
  frameworkVersion: z.string().optional(),

  // Python framework
  pythonFramework: z.enum(['fastapi', 'django', 'flask', 'litestar']).optional(),
  pythonFrameworkVersion: z.string().optional(),

  // Frontend
  ui: z.array(z.enum(['react', 'vue', 'svelte', 'solid', 'preact'])).optional(),
  uiVersions: z.record(z.string(), z.string()).optional(),
  cssFramework: z.enum(['tailwind', 'unocss', 'css-modules', 'styled-components']).optional(),
  cssFrameworkVersion: z.string().optional(),
  componentLib: z.enum(['shadcn', 'radix', 'daisyui', 'mantine', 'chakra']).optional(),
  componentLibVersion: z.string().optional(),

  // Routing (Next.js specific)
  router: z.enum(['app-router', 'pages-router']).optional(),

  // Bundler
  bundler: z
    .enum(['vite', 'webpack', 'turbopack', 'esbuild', 'rollup', 'rspack'])
    .optional(),
  bundlerVersion: z.string().optional(),

  // ORM / DB
  orm: z
    .enum(['drizzle', 'prisma', 'typeorm', 'sequelize', 'mikro-orm', 'kysely'])
    .optional(),
  ormVersion: z.string().optional(),
  database: z.enum(['postgres', 'mysql', 'sqlite', 'mongodb', 'turso']).optional(),
  databaseVersion: z.string().optional(),

  // Auth
  auth: z
    .enum(['clerk', 'next-auth', 'better-auth', 'lucia', 'supabase-auth'])
    .optional(),
  authVersion: z.string().optional(),

  // Backend-as-a-service
  baas: z.enum(['supabase', 'firebase', 'convex', 'appwrite']).optional(),
  baasVersion: z.string().optional(),

  // Testing
  testRunner: z.enum(['vitest', 'jest', 'mocha', 'ava', 'bun-test']).optional(),
  testRunnerVersion: z.string().optional(),
  e2eRunner: z.enum(['playwright', 'cypress', 'puppeteer']).optional(),
  e2eRunnerVersion: z.string().optional(),

  // Package manager
  packageManager: z.enum(['pnpm', 'npm', 'yarn', 'bun']).optional(),
  packageManagerVersion: z.string().optional(),

  // Deployment
  deploy: z
    .enum(['vercel', 'netlify', 'cloudflare', 'railway', 'fly', 'aws', 'gcp'])
    .optional(),
  deployVersion: z.string().optional(),

  // Monorepo
  monorepo: z
    .enum(['turborepo', 'nx', 'moon', 'pnpm-workspaces'])
    .optional(),
  monorepoVersion: z.string().optional(),

  // Detected config files (raw list, for traceability)
  detectedFiles: z.array(z.string()).optional(),
})

export type StackFingerprint = z.infer<typeof StackFingerprintSchema>

export interface ScannerResult {
  fingerprint: Partial<StackFingerprint>
  detectedFiles: string[]
}
