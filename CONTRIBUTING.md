# Contributing

## Getting started

```bash
git clone <repo>
cd vibelock
pnpm install
```

## Development

```bash
pnpm dev          # run with tsx (hot reload)
pnpm typecheck    # check types
pnpm test         # run tests
pnpm test:watch   # tests in watch mode
pnpm build        # build with tsup
```

## Project structure

```
src/
  index.ts                 # CLI entry point (commander)
  commands/                # init, scan, uninstall
  scanner/                 # manifest, config, structure, lockfile, coordinator
  fingerprint/             # types (zod schema), engine (merge logic)
  templates/               # registry + block files + output renderers
  patcher/                 # differ + writer
  git/                     # hook install/uninstall + stage helper
  utils/                   # fs helpers, logger, errors
tests/
  scanner/                 # scanner tests with real fixture files
  fingerprint/             # engine merge tests
  patcher/                 # differ tests
  fixtures/                # fake project trees (real files, not mocked)
```

## Adding a new template block

1. Create a block file in `src/templates/blocks/`
2. Export a function matching `(fp: StackFingerprint) => RuleBlock`
3. Register it in `src/templates/registry.ts` — only call the block function when the relevant fingerprint field is set
4. Add a test fixture if the block depends on scanner signals
5. Add a test for the block's scanner signal

## Principles

- Scanners never throw — they return partial results
- Templates only fire when the fingerprint field is present
- The patcher only touches content inside `<!-- vibelock:X -->` fences
- Real fixture files, not mocks
- Named exports only, no default exports
- .js extensions on all imports (NodeNext)
