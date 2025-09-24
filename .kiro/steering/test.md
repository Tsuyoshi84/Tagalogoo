---
fileMatchPattern: **/*.spec.ts
inclusion: fileMatch
---
# Rules for tests

## Basic

- Use Vitest for unit testing.
- Write comprehensive unit tests for all business logic.
- Test public behavior, not private implementation details.
- Prefer specific assertions (toBe, toEqual, toHaveTextContent, toHaveAttribute) over snapshots.

## Writing Testing with Vitest

- Write descriptive test names that explain the expected behavior.
- Write test names and descriptions in English within `describe` and `it` blocks
- Explicitly import Vitest APIs (e.g., `import { describe, it } from 'vitest'`).
- Prefer `it` over `test` for naming test cases.

## Run Tests

- Run `pnpm test path/to/xxx.spec.ts --run` to run tests without watch mode.

## Testing Expectations

- Each exported function: tests for typical case, edge cases (empty, min/max), invalid input, and (if applicable) failure branch of `Result`.
- Round‑trip tests for parse/format pairs.
- Property-based / fuzz tests when invariants are simple (e.g., idempotence, reversibility).
- No snapshot tests; assert semantic values.
- Inject time/random providers in tests to ensure determinism.
