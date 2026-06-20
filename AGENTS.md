# vibelock — agent rules

## project overview
vibelock is a TypeScript CLI tool. It runs as a git pre-commit hook and patches AI coding agent rule files when a project's stack changes.

## where to start
For a deep reference covering architecture, scanner rules, template blocks, patcher internals, CLI commands, and the full StackFingerprint schema, use the `/vibelock` skill:

```
.commandcode/skills/vibelock/SKILL.md
```

Read that file before making structural changes. This AGENTS.md covers the essentials for day-to-day work.

## stack
- Node.js 20.12+ with ESM modules
- TypeScript 5.9 strict mode
- commander 15 for CLI argument parsing
- @clack/prompts 1.5 for interactive terminal UI
- chalk 5.6 for terminal color
- simple-git 3.36 for git operations
- zod 4.4 for runtime schema validation
- vitest 4.1 for testing

## project structure
```
src/
  index.ts                 # commander CLI entry point
  commands/                # init, scan, uninstall
  scanner/                 # manifest, config, structure, lockfile, coordinator
  fingerprint/             # zod schema types + merge engine
  templates/               # registry → 16 block files → 4 output renderers
  patcher/                 # differ + writer (fenced section surgery)
  git/                     # hook install/uninstall + git stage
  utils/                   # fs helpers, logger, AppError
tests/
  scanner/                 # tests with real fixture files
  fingerprint/             # engine merge tests
  patcher/                 # differ tests
  fixtures/                # nextjs-project, python-project, monorepo
```

## conventions
- All imports must use .js extensions (NodeNext module resolution requires this)
- Use `node:` prefix for all built-in modules (e.g. `import { readFile } from 'node:fs/promises'`)
- No default exports anywhere — named exports only
- All async functions must have explicit return types
- Never use `any`. Use `unknown` and narrow with type guards or zod
- Error handling: throw AppError instances from src/utils/errors.ts, never plain strings
- File I/O: always use safeRead/exists from src/utils/fs.ts, never raw fs calls

## pipeline architecture
```
Scanner (4 parallel) → Fingerprint (merge) → Templates (block gen) → Patcher (diff + write) → Git (stage)
```

### scanner principle
Scanners return partial results when they cannot read a file. They never throw. The fingerprint engine handles missing fields with optional chaining.

### patcher principle
The patcher only modifies content inside `<!-- vibelock:X -->` fences. Anything outside those fences is untouched.

## adding a new scanner signal
1. Add the fingerprint field to `StackFingerprintSchema` in `src/fingerprint/types.ts`
2. Add detection logic to the relevant scanner file (manifest.ts, config.ts, etc.)
3. Create a fixture file in `tests/fixtures/` that triggers the signal
4. Write a test that asserts the signal is detected
5. Write a test that asserts the signal is absent when the fixture doesn't have it

## adding a new template block
1. Create `src/templates/blocks/<name>.ts` exporting a `(fp: StackFingerprint) => RuleBlock` function
2. The `id` in the returned RuleBlock must match the fence identifier used in the output
3. Register it in `src/templates/registry.ts` — only call the block when the relevant fingerprint field is set
4. Add a test fixture if the block depends on new scanner signals

## pr checklist
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes with no skipped tests
- [ ] New scanner signals have a corresponding fixture and test
- [ ] New template blocks only fire when the fingerprint field is present
- [ ] No hardcoded framework assumptions without a scanner basis

<!-- vibelock:vitest -->
## Vitest
- Place test files next to the code they test (*.test.ts)
- Use describe/it blocks for test organization
- Use vi.mock for module mocking, vi.fn for function mocks
- Use vi.useFakeTimers for time-dependent code
- Run tests with: npx vitest run
<!-- /vibelock:vitest -->

<!-- vibelock:typescript -->
## TypeScript
- Use strict mode TypeScript — no implicit any
- Prefer interfaces over types for object shapes
- Use type inference where possible; add explicit annotations for function signatures
- Use discriminated unions for state machines
- Avoid enums — use const objects with as const instead
<!-- /vibelock:typescript -->
