# vibelock

Describe the vibelock project — architecture, conventions, development workflow, and extension guide.

## When to use

Use this skill when working on the vibelock codebase: building features, fixing bugs, adding scanner signals, creating new template blocks, writing tests, or understanding the project architecture.

---

## Project overview

vibelock is a TypeScript CLI tool that keeps AI agent rule files (AGENTS.md, CLAUDE.md, .cursor/rules/*.mdc) consistent with a project's actual dependencies. It runs as a git pre-commit hook.

**Core principle:** Never hardcode assumptions. Every rule block must trace back to a specific file the scanner read. When a dependency is removed, vibelock removes the corresponding rule block.

## Architecture

The data flow is a strict pipeline:

```
Scanner (4 parallel scanners)
  → Fingerprint Engine (merge with precedence)
    → Template Registry (generate rule blocks per fingerprint field)
      → Patcher (diff current vs generated, surgically update fences)
        → Git (stage patched files)
```

### Layer 1: Scanner (`src/scanner/`)

Four independent scanners run in parallel via `Promise.allSettled` in `coordinator.ts`. Each returns a `ScannerResult` with `fingerprint` (partial) and `detectedFiles` (string[]).

| Scanner | Input | Detection logic |
|---------|-------|----------------|
| `manifest.ts` | package.json + pyproject.toml | Dep name matching for framework, UI, ORM, auth, test runner, DB, CSS |
| `config.ts` | tsconfig, vite.config, tailwind.config, components.json, drizzle.config, prisma schema, turbo.json, nx.json | File existence + content parsing |
| `structure.ts` | Directory tree (depth ≤ 3) | Folder existence (app/, pages/, prisma/, supabase/) + deploy config files |
| `lockfile.ts` | pnpm-lock.yaml, yarn.lock, package-lock.json, bun.lock | First found wins |

**Scanner rules:**
- Never throw — return partial results when a file can't be read
- Use `safeRead` and `exists` from `src/utils/fs.ts` — never raw `fs` calls
- Return `null`/`undefined` for each field that has no evidence
- Log warnings via `logger.ts`, not `console.error` directly

### Layer 2: Fingerprint (`src/fingerprint/`)

- `types.ts` — `StackFingerprint` Zod schema with 25+ optional fields
- `engine.ts` — `mergeFingerprints()` combines scanner results:
  - Config scanner overrides manifest for same keys
  - Structure scanner overrides config for `router` detection
  - UI arrays are merged (deduplicated)
  - `detectedFiles` are merged into a unique sorted set
  - Validates output with `StackFingerprintSchema.parse()`

### Layer 3: Templates (`src/templates/`)

- `registry.ts` — maps fingerprint fields to block generators
  - Only calls a block function when the relevant field is set (e.g., `if (fp.framework === 'nextjs')`)
  - Never pushes a block for `undefined` fields
- `blocks/*.ts` — 16 block generators, each returns `{ id, content, source }`
- `outputs/*.ts` — renderers for AGENTS.md, CLAUDE.md, .cursor/rules, copilot-instructions.md

**To add a new block:**
1. Create `src/templates/blocks/<name>.ts` — export a function `(fp: StackFingerprint) => RuleBlock`
2. Register in `registry.ts` — add the `if` check and push
3. The `id` must match the fence identifier (e.g., `'nextjs'` → `<!-- vibelock:nextjs -->`)

### Layer 4: Patcher (`src/patcher/`)

- `differ.ts` — parses current file, finds fenced sections via regex, diffs against generated blocks
  - Returns `{ changed, added, removed, unchanged }`
- `writer.ts` — applies the diff:
  - Changed: replaces content between `<!-- vibelock:X -->` fences
  - Removed: deletes the entire fenced section including fences
  - Added: appends at end of file
  - Never touches content outside fences

### Layer 5: Git (`src/git/`)

- `hook.ts` — writes `.git/hooks/pre-commit` that calls `npx vibelock scan --hook`
  - Appends to existing hooks rather than overwriting
- `stage.ts` — `git add` on patched files via `simple-git`
  - Gracefully handles non-git directories (catches errors silently)

## Development workflow

```bash
# Install dependencies
pnpm install

# Run with hot reload
pnpm dev -- <args>

# Typecheck
pnpm typecheck

# Run tests
pnpm test
pnpm test:watch     # watch mode
pnpm test:coverage  # with coverage report

# Build for distribution
pnpm build          # outputs to dist/index.js

# Format + lint
pnpm format
pnpm lint
```

## Testing conventions

- **Framework:** Vitest v4 (node environment, no jsdom)
- **Fixtures:** Real files in `tests/fixtures/` — never mock the filesystem
- **Placement:** Test files next to the code they test (`tests/scanner/manifest.test.ts` for `src/scanner/manifest.ts`)
- **Pattern:** `describe`/`it` blocks, `expect` assertions
- **Coverage target:** 80% lines minimum

### Fixture projects

| Fixture | Stack | Purpose |
|---------|-------|---------|
| `nextjs-project/` | Next.js 15, React, Tailwind, Clerk, Drizzle, Supabase, Vite, shadcn | Full-featured JS/TS project |
| `python-project/` | FastAPI | Python stack detection |
| `monorepo/` | Next.js, Prisma (postgres), Turborepo, pnpm | Monorepo + ORM detection |

### What to test for new scanner signals

1. Create a fixture that has the signal (a config file, dependency, or directory)
2. Assert the scanner correctly populates the fingerprint field
3. Assert the field is absent when the fixture doesn't have the signal (no false positives)
4. Add a test for the template block firing only when the field is present

## Code conventions

- **ESM only:** `"type": "module"`, all imports use `.js` extensions
- **Built-in modules:** Prefixed with `node:` (e.g., `import { readFile } from 'node:fs/promises'`)
- **Named exports only:** No `export default` anywhere
- **Async functions:** Must have explicit return types
- **No `any`:** Use `unknown` and narrow with type guards or Zod
- **Error handling:** `throw new AppError(message, code, isFatal)` — never throw plain strings
- **File I/O:** `safeRead` / `exists` from `src/utils/fs.ts` — never raw `fs` calls

## StackFingerprint schema

Located in `src/fingerprint/types.ts`. Fields (all optional):

| Field | Type | Example |
|-------|------|---------|
| `lang` | enum | `'typescript'`, `'python'` |
| `framework` | enum | `'nextjs'`, `'express'` |
| `pythonFramework` | enum | `'fastapi'`, `'django'` |
| `ui` | array | `['react', 'vue']` |
| `cssFramework` | enum | `'tailwind'`, `'unocss'` |
| `componentLib` | enum | `'shadcn'`, `'radix'` |
| `router` | enum | `'app-router'`, `'pages-router'` |
| `bundler` | enum | `'vite'`, `'webpack'` |
| `orm` | enum | `'drizzle'`, `'prisma'` |
| `database` | enum | `'postgres'`, `'sqlite'` |
| `auth` | enum | `'clerk'`, `'next-auth'` |
| `baas` | enum | `'supabase'`, `'firebase'` |
| `testRunner` | enum | `'vitest'`, `'jest'` |
| `e2eRunner` | enum | `'playwright'`, `'cypress'` |
| `packageManager` | enum | `'pnpm'`, `'npm'` |
| `deploy` | enum | `'vercel'`, `'netlify'` |
| `monorepo` | enum | `'turborepo'`, `'nx'` |
| `detectedFiles` | string[] | `['package.json', 'tsconfig.json']` |

## CLI commands

| Command | Flags | Behavior |
|---------|-------|----------|
| `vibelock init` | — | Interactive setup: detect AI tools, install hook, run initial scan |
| `vibelock scan` | — | Interactive: show detected stack + diff, ask for confirmation |
| `vibelock scan --hook` | `--hook` | Silent mode for git hook: exit 0 always, never block commit |
| `vibelock scan --dry-run` | `--dry-run` | Show what would change, write nothing |
| `vibelock uninstall` | — | Remove vibelock from pre-commit hook, keep generated files |

## PR checklist

Before merging:
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes with no skipped tests
- [ ] New scanner signals have a corresponding fixture and test
- [ ] New template blocks only fire when the fingerprint field is present
- [ ] No hardcoded framework assumptions without a scanner basis
