# Bootstrap Source Entrypoint

## Objective

Define the initial source entrypoint for `spec-it` by introducing `src/index.ts` and wiring the `build`, `type-check`, and `start` scripts to a real TypeScript-based source layout.

## Scope

- create the initial `src/index.ts` entrypoint for the project
- define the TypeScript setup required to type-check the source entrypoint
- define the build behavior required to emit runnable JavaScript output
- define the `start` and `start:dev` behavior for running the source or built output
- align the package scripts with the first real source-based workflow
- document any source-entry setup needed for contributors

## Design

The project should move from placeholder runtime scripts to a real source entrypoint centered on `src/index.ts`.

The initial source layout should stay intentionally small. It only needs enough structure to let the repository compile, type-check, and execute a minimal implementation entrypoint without introducing unnecessary architecture.

TypeScript should be introduced specifically to support the CLI and source implementation, not as a generic tooling layer detached from product code.

The `type-check` script should validate the TypeScript source tree against a project `tsconfig.json`.

The `build` script should compile the source into runnable JavaScript output suitable for future CLI packaging.

The `start` and `start:dev` scripts should be connected to the new source entrypoint in a way that makes local execution straightforward during early development.

The initial source bootstrap should also update the project documentation so contributors know how to type-check, build, and run the project once the source entrypoint exists.

## Examples

Example source layout that should become valid:

- `src/index.ts`

Example script areas that should become real:

- `build`
- `type-check`
- `start`
- `start:dev`

## Acceptance Criteria

- the repository includes `src/index.ts`
- the repository includes a TypeScript configuration suitable for the initial source entrypoint
- `type-check` validates the TypeScript source
- `build` compiles the source entrypoint into runnable output
- `start` and `start:dev` are connected to the real source workflow
- the documentation explains how to build, type-check, and run the project
