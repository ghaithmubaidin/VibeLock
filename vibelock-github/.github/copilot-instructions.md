
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
