# Bootstrap Vitest

## Objective

Introduce Vitest as the initial automated test runner for `spec-it`, replacing placeholder test scripts with a real test workflow for unit and coverage execution.

## Scope

- add Vitest to the project dependencies
- configure the repository to run unit tests in TypeScript
- replace placeholder `test` and `test:cov` scripts with real Vitest commands
- define the initial test file conventions for the source tree
- add at least one initial automated test covering current project behavior
- document the new test workflow for contributors

## Design

The project should use Vitest as the primary unit test runner for early development.

The initial Vitest setup should remain small and focused. It only needs enough structure to let the repository run TypeScript-based tests against the current source modules and report coverage when requested.

The placeholder `test` and `test:cov` scripts in `package.json` should be replaced with real commands backed by Vitest.

The setup should support the current TypeScript source structure without introducing unnecessary framework-specific behavior or advanced mocking conventions before they are needed.

The initial test suite should include at least one real assertion covering an existing source behavior so that the project has a working baseline for future refactors and feature work.

The project documentation should explain how to run the tests and coverage commands once the setup is in place.

## Acceptance Criteria

- the repository includes working Vitest dependencies
- `test` runs the Vitest suite
- `test:cov` runs Vitest coverage
- the project includes at least one real automated test
- the documentation explains how to run the test workflow
