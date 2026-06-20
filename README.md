# vibelock

> Your AI coding agent's rules, always in sync with your actual stack.

## What is this?

AI coding agents — Claude Code, Cursor, GitHub Copilot — rely on rule files like `AGENTS.md`, `CLAUDE.md`, and `.cursor/rules/*.mdc` to understand your project. These files tell the agent "this project uses Next.js with Tailwind and Drizzle" so it generates appropriate code.

The problem? **Those files go stale.** You add a new dependency, swap your ORM, or switch your test runner — and your agent doesn't know. It keeps suggesting the old stack.

**vibelock** is a git pre-commit hook that scans your project's real files, detects what you're actually using, and surgically patches only the auto-generated sections of your rule files. Your custom rules and notes stay untouched.

## Quick start

```bash
# Clone and build
git clone <repo-url>
cd vibelock
pnpm install
pnpm build

# Run against any project
node dist/index.js scan --dry-run
```

Or link it globally for use as a CLI:

```bash
npm link
vibelock init          # interactive setup in any project
vibelock scan          # scan and patch rule files
vibelock scan --dry-run  # preview changes without writing
```

## How it works

```
You commit code
    │
    ▼
Git triggers pre-commit hook
    │
    ▼
vibelock scans your project (package.json, configs, directory structure, lockfiles)
    │
    ▼
Builds a fingerprint of your stack
    │
    ▼
Generates rule blocks only for what was detected
    │
    ▼
Diffs against existing rule files
    │
    ▼
Patches only content inside <!-- vibelock:X --> fences
    │
    ▼
Stages the updated files with your commit
```

### What does a patched file look like?

vibelock reads your `package.json`, `pyproject.toml`, and config files to extract actual versions. The generated rules always reflect what's in your project right now:

```markdown
# My Project Rules

These are my custom rules that vibelock will never touch:
- Always use named exports
- Prefer functional patterns

<!-- vibelock:nextjs -->
## Next.js 15.0.0
- Use Server Components by default; add 'use client' only for interactive components
- Fetch data in Server Components, not in useEffect
- Use next/link for client-side navigation
<!-- /vibelock:nextjs -->

<!-- vibelock:react -->
## React 19.0.0
- Use functional components with hooks
- Use React.memo only for components with expensive renders
- Keep state as local as possible; lift only when shared
<!-- /vibelock:react -->

<!-- vibelock:tailwind -->
## Tailwind CSS 3.4.0
- Use Tailwind utility classes directly in JSX
- Extract repeated utility patterns into components, not custom CSS classes
<!-- /vibelock:tailwind -->

<!-- vibelock:typescript -->
## TypeScript 5.9.2
- Use strict mode TypeScript — no implicit any
- Prefer interfaces over types for object shapes
<!-- /vibelock:typescript -->
```

**Versions are dynamic.** When you upgrade Next.js from 15.0.0 to 15.1.0, vibelock automatically updates the rule block on your next commit. Everything between `<!-- vibelock:X -->` fences is managed by vibelock. Everything outside is yours.

## Architecture

| Layer | Responsibility |
|-------|---------------|
| **Scanner** | Four parallel scanners read package.json, config files, directory structure, and lockfiles |
| **Fingerprint** | Merges scanner results with precedence rules (config > manifest, structure > config) |
| **Templates** | Generates rule blocks only for detected tools — never hardcodes assumptions |
| **Patcher** | Diffs current file vs generated blocks, surgically updates fenced sections |
| **Git** | Stages patched files so they're included in your commit |

### Scanner details

| Scanner | What it reads |
|---------|--------------|
| **manifest** | `package.json` dependencies, `pyproject.toml` |
| **config** | `tsconfig.json`, `vite.config`, `next.config`, `tailwind.config`, `components.json`, `drizzle.config`, `prisma/schema.prisma`, `turbo.json` |
| **structure** | `src/app/` vs `src/pages/`, `vercel.json`, `netlify.toml`, `fly.toml` |
| **lockfile** | `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `bun.lock` |

## Customizing Rules (Override Defaults)

If the default rule templates are too generic for your project, you can override them. This allows you, or your AI coding agents, to define custom rules for any tool in your stack.

To customize a rule block:
1. Create a directory named `.vibelock/rules/` in your project root.
2. Create a markdown file named after the block's identifier (e.g., `typescript.md`, `vitest.md`, `nextjs.md`).
3. Write your custom rules in that file.

When `vibelock` runs:
- It checks `.vibelock/rules/` for matching files.
- If found, it uses the content of your custom markdown file inside the corresponding `<!-- vibelock:X -->` fences instead of the default template.
- It also registers the custom markdown file as a source dependency in Git.

This is highly recommended for keeping specialized development patterns, conventions, or "things to avoid" synced across your team and AI coding agents.

## Commands

| Command | What it does |
|---------|-------------|
| `vibelock init` | Interactive setup — detects AI tools, installs pre-commit hook, runs initial scan |
| `vibelock scan` | Scans your project, shows diff, asks for confirmation before writing |
| `vibelock scan --hook` | Silent mode for git hooks — exits 0 always, never blocks a commit |
| `vibelock scan --dry-run` | Shows what would change without writing anything |
| `vibelock uninstall` | Removes the pre-commit hook, keeps generated files |

## Supported stack detection

| Category | Tools detected |
|----------|---------------|
| Language | TypeScript, JavaScript, Python |
| Framework | Next.js, Remix, Nuxt, SvelteKit, Astro, Express, Fastify, Hono |
| Python framework | FastAPI, Django, Flask, Litestar |
| UI | React, Vue, Svelte, Solid, Preact |
| CSS | Tailwind, UnoCSS, CSS Modules, Styled Components |
| Component library | shadcn/ui, Radix, daisyUI, Mantine, Chakra |
| Bundler | Vite, Webpack, Turbopack, esbuild, Rollup, Rspack |
| ORM | Drizzle, Prisma, TypeORM, Sequelize, Mikro-ORM, Kysely |
| Database | PostgreSQL, MySQL, SQLite, MongoDB, Turso |
| Auth | Clerk, NextAuth, Better Auth, Lucia, Supabase Auth |
| BaaS | Supabase, Firebase, Convex, Appwrite |
| Test runner | Vitest, Jest, Mocha, Ava |
| E2E runner | Playwright, Cypress, Puppeteer |
| Package manager | pnpm, npm, yarn, bun |
| Deployment | Vercel, Netlify, Cloudflare, Railway, Fly |
| Monorepo | Turborepo, Nx, pnpm workspaces |

## Output files

| File | For |
|------|-----|
| `AGENTS.md` | General AI agent rules (Claude Code, Cursor, etc.) |
| `CLAUDE.md` | Claude Code-specific rules |
| `.cursor/rules/vibelock.mdc` | Cursor IDE rules |
| `.github/copilot-instructions.md` | GitHub Copilot instructions |

## Design principles

- **Scanner-driven.** Every rule block traces back to a specific file the scanner read. No hardcoded assumptions.
- **Non-destructive.** Only content inside `<!-- vibelock:X -->` fences is modified. Everything else is preserved.
- **Silent in hooks.** When running as a pre-commit hook, vibelock always exits 0 — it never blocks your commit.
- **Honest about uncertainty.** If a scanner can't determine something, the fingerprint field stays empty and no block is generated.

## Development

```bash
pnpm install        # install dependencies
pnpm dev -- scan    # run with hot reload (tsx)
pnpm typecheck      # check types (tsc --noEmit)
pnpm test           # run tests (vitest)
pnpm test:watch     # tests in watch mode
pnpm build          # build for distribution (tsup → dist/)
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

**MIT License** — free for personal and commercial use.

In plain English:

- **You can** use, copy, modify, merge, publish, distribute, sublicense, and sell copies of this software
- **You can** use it in proprietary/commercial projects
- **You must** include the original copyright notice and license text in any copy or substantial portion
- **You cannot** hold the authors liable — the software is provided "as is" with no warranty

See the full license text in [LICENSE](./LICENSE).
