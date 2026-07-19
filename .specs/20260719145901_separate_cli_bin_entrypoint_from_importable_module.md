# Separate CLI Bin Entrypoint From Importable Module

## Objective

Define how `specify-it` should separate its executable CLI entrypoint from its importable module surface so the published package behaves correctly when invoked through package-manager-managed binaries such as `node_modules/.bin/specify-it`, while exposing only an explicit CLI subpath for programmatic imports.

## Scope

- define the runtime structure for the executable CLI entrypoint
- define the importable CLI module entrypoint that should remain safe to import without side effects
- define the packaging changes needed for the npm `bin` field
- define the package `exports` shape for explicit CLI-only subpath imports
- define the minimum test coverage required for the new entrypoint structure
- exclude changes to the deterministic command behavior itself
- exclude additional library surfaces such as config helpers or a root package export

## Design

The package should stop relying on an `import.meta.url` versus `process.argv[1]` comparison inside the same module that exports reusable functions.

The package should instead adopt a split structure similar to tools such as `commitlint`:

- one module exposes the reusable CLI runner or programmatic CLI helpers
- one dedicated executable file exists only to invoke that function when run as a process

The importable CLI module should export the current reusable CLI API, such as the function that receives argv and returns an exit code. Importing this module should never execute the CLI automatically.

The executable bin file should:

- include the shebang
- import the reusable runner
- execute it immediately
- set `process.exitCode` when the returned exit code is non-zero

The `package.json` `bin` field should point to the dedicated executable file rather than to a mixed module that also serves as a library entrypoint.

The package should not expose a root import such as `specify-it` for now.

The package should instead expose an explicit CLI-only subpath:

- `specify-it/cli`

This keeps the public API narrow and intentional while the library surface is still small. Future subpaths such as `specify-it/config` may be added in separate specs when those APIs are intentionally designed.

This structure should ensure that all of these invocation paths behave consistently:

- direct execution with `node dist/bin.js`
- execution through the installed package binary in `node_modules/.bin/specify-it`
- execution through a package manager command such as `yarn specify-it:check`

The CLI-facing import path should remain available for import by tests or external consumers without triggering process execution.

The first implementation does not need to redesign the deterministic command API. It only needs to separate process bootstrapping from the reusable CLI runner and expose that runner through an explicit CLI subpath.

Tests should cover:

- importing the reusable CLI module does not execute the CLI
- invoking the executable entrypoint runs the CLI
- installed-binary-style execution behaves the same as direct node execution for a representative command
- importing from the CLI subpath resolves successfully without requiring a root package export

README documentation should be updated only where needed to reflect the new packaging layout if there is any user-visible change.

## Examples

Example target structure:

- `src/cli.ts` exports the reusable runner
- `src/bin.ts` executes the runner for process usage
- `package.json` points `bin.specify-it` to `dist/bin.js`
- `package.json` exposes `./cli` as the only supported import subpath in this slice

Example outcomes this change should enable:

- `./node_modules/.bin/specify-it check` runs the checker instead of exiting silently
- `import { runCli } from 'specify-it/cli'` works without executing command logic automatically
- `yarn specify-it:check` and `node dist/bin.js check` behave the same way

## Acceptance Criteria

- the package separates the executable bin entrypoint from the importable CLI module
- the reusable CLI module has no automatic process-side effects when imported
- the npm `bin` field points to the dedicated executable file
- the package exposes an explicit `specify-it/cli` import path
- the package does not rely on a root `specify-it` import path in this slice
- installed binary execution through `node_modules/.bin/specify-it` works correctly
- representative tests cover the split entrypoint behavior
- deterministic command behavior remains unchanged by this slice
