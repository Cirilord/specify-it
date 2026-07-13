# Bootstrap Project Tooling

## Objective

Define the initial tooling foundation for `spec-it` by introducing a `package.json` and configuring ESLint, Prettier, commitlint, and lefthook in a way that supports the project's spec-first workflow.

## Scope

- create the first `package.json` for the repository
- define the initial project scripts needed for formatting, linting, and commit message validation
- configure ESLint for the repository source and configuration files
- configure Prettier for consistent formatting
- configure commitlint to enforce the documented commit message convention
- configure lefthook to run the selected checks in the local Git workflow
- document any setup or usage details required by contributors

## Design

The repository should gain a root `package.json` that establishes the project as a Node-based package and provides the script entry points for the initial tooling workflow.

The initial package manager should be `yarn`.

The initial tooling setup should stay intentionally small and dependable. It should prefer widely adopted defaults over premature customization and should avoid adding tools that are not yet necessary for the current project phase.

ESLint should be configured to validate the repository files that are expected to become part of the package implementation and supporting configuration. The lint setup should be strict enough to catch common mistakes, but not so opinionated that it fights the formatting layer or slows down the first implementation slices.

Prettier should be responsible for formatting. ESLint and Prettier should be configured to complement each other rather than duplicate responsibilities.

ESLint, Prettier, and commitlint configuration should use repository-native JavaScript module files where appropriate.

commitlint should enforce the commit style already documented in `AGENTS.md`, using the `type(scope): message` format as the expected baseline for local development.

lefthook should connect the local Git workflow to the deterministic checks that are appropriate before a commit is finalized. The initial hooks should focus on fast feedback and should avoid workflows that are likely to feel heavy during early development.

The initial hook flow should cover formatting checks, lint checks, commit message validation, and a placeholder type-check command kept for future expansion.

The bootstrap should also update the project documentation so contributors know which scripts to run, which hooks exist, and how the local conventions map to the documented workflow.

## Acceptance Criteria

- a root `package.json` is defined for the project
- the repository includes working configuration for ESLint
- the repository includes working configuration for Prettier
- the repository includes working configuration for commitlint
- the repository includes working configuration for lefthook
- the tooling is wired around `yarn` scripts
- the initial scripts for linting, formatting, and commit message validation are documented
- the documentation explains how the tooling supports the local development workflow
