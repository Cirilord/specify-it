# Harden TypeScript Lint And Format Rules

## Objective

Define the repository tooling changes that strengthen TypeScript-aware linting and tighten formatting defaults for the `spec-it` codebase.

## Scope

- adopt `typescript-eslint` in the repository ESLint configuration
- migrate the ESLint config structure to `defineConfig`
- enable stricter TypeScript-oriented lint rules for the source tree
- register any new tooling dependency required by the updated ESLint setup
- adjust the shared Prettier formatting width to the new default
- exclude repository JavaScript config entrypoints from the lint target when they would require separate typed-lint handling
- allow small source-level signature cleanups when they are required to satisfy the stricter lint rules without changing user-facing CLI behavior

## Design

The repository already uses ESLint and Prettier, but the current setup should be strengthened to better support a TypeScript-first codebase.

The ESLint configuration should move to a more explicit configuration model by using `defineConfig` and by integrating the `typescript-eslint` package as the source of TypeScript-aware recommended rules.

The new linting layer should keep the existing formatting integration, while adding stricter expectations for maintainability and consistency in TypeScript modules.

The type-aware linting rules should be applied only to TypeScript source files. Repository JavaScript configuration entrypoints that would otherwise require separate typed-lint handling may be excluded from the lint target during this hardening step so the repository can adopt stricter TypeScript linting without adding a second config path in the same change.

The stricter rules should emphasize:

- explicit member accessibility in classes
- explicit function return types
- consistent type import style
- member ordering
- readonly preference where reasonable
- avoiding `any`

The configuration should continue to support the existing import ordering rules and commonjs override behavior.

The TypeScript-aware lint block should explicitly configure parser options required for typed linting, including project service support and the repository tsconfig root directory.

The repository should add the required `typescript-eslint` dependency to support the updated ESLint configuration.

The shared Prettier configuration should also be updated to reflect the new preferred line width. The formatting change should be treated as part of the same tooling hardening effort so the lint and format defaults stay aligned.

Because the stricter lint rules also validate async usage more aggressively, small source-level cleanups may be included when they remove incorrect async signatures from the CLI entrypoint without changing observable behavior. In this change, synchronous CLI parsing should remain synchronous in both implementation and tests.

Documentation updates are optional for this change unless the user-facing development workflow meaningfully changes.

## Examples

Example outcomes that should be covered by the tooling update:

- TypeScript files are checked with recommended type-aware lint rules
- repository JavaScript configuration entrypoints are not forced through TypeScript project-service resolution
- class members require explicit accessibility
- type imports are normalized consistently
- formatting wraps earlier because of the narrower print width
- CLI entrypoints do not keep async signatures when the underlying parser flow is synchronous

Example files expected to change:

- `eslint.config.mjs`
- `prettier.config.mjs`
- `package.json`
- lockfile metadata for the new lint dependency
- optionally the ESLint ignore list for repository JavaScript configuration entrypoints
- optionally CLI entrypoint files and tests when their async signatures are cleaned up to satisfy the stricter lint expectations

## Acceptance Criteria

- ESLint uses `defineConfig`
- `typescript-eslint` is integrated into the ESLint configuration
- typed linting is scoped to TypeScript files
- parser options required for typed linting are configured explicitly
- repository JavaScript configuration entrypoints that are outside the typed lint path are intentionally excluded from the lint target
- stricter TypeScript-specific rules are defined in the repository lint setup
- the new lint dependency is registered in the project manifest
- the Prettier `printWidth` default is updated to the new value
- any source-level cleanup included in the change is limited to removing incorrect async signatures without changing CLI behavior
