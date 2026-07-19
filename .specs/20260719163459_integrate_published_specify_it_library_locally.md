# Integrate Published Specify-It Library Locally

## Objective

Define how this repository should consume the published `specify-it` package in its own development workflow so the deterministic spec checks are exercised through the installed library, not only through the in-repo source implementation.

## Scope

- define how the published `specify-it` package should be installed in this repository
- define the repository config that should be committed for local deterministic validation
- define how `lefthook` should invoke the installed library during local Git hooks
- define the minimum documentation updates needed for contributors
- exclude changes to the library implementation itself

## Design

This slice should treat the published `specify-it` package as an external consumer dependency of the repository.

The repository should add `specify-it` as a dependency or devDependency using the currently published version that includes the recent deterministic command set (`init`, `new`, `check`, and `list`).

This repository should commit a real `specify-it.config.json` file at the repository root so local validation can run without bootstrapping a temporary config.

The committed config should describe the repository's own spec contract using the currently adopted deterministic rules:

- specs live under `.specs`
- spec format is `md`
- naming matches the repository's chosen strategy
- the required and optional sections reflect the current Markdown spec contract
- deterministic checks are enabled for specs directory existence, known extensions, and ordered sections

The first integration should add `specify-it check` to the local `pre-commit` hook in `lefthook.yml` through a package script such as `yarn specify-it:check`.

The hook order should remain practical for contributors. The first version may continue to run formatting, linting, and type-checking, but it should also run the installed `specify-it check` command as part of the deterministic gate.

The hook should invoke the installed CLI from the package manager context rather than relying on a globally installed binary.

The repository does not need to remove its in-repo implementation in this slice. The goal is to ensure that contributors also exercise the published package in the repo workflow.

The first version should not yet replace source-level tests with package-level smoke tests, and it should not attempt to self-host the published package through release automation changes. This slice is only about consuming the published package in local development.

README documentation should be updated to explain:

- that the repository now installs `specify-it` as a package dependency for local workflow validation
- that `specify-it.config.json` is committed and used by hooks
- that `lefthook` runs `specify-it check` during `pre-commit`

## Examples

Example outcomes this change should enable:

- a fresh clone followed by dependency installation has `specify-it` available through the package manager
- running `lefthook run pre-commit` executes `specify-it check`
- contributors can run the installed `specify-it check` manually against the committed repository config

Example files expected to change:

- `package.json`
- lockfile
- `specify-it.config.json`
- `lefthook.yml`
- `README.md`

## Acceptance Criteria

- the repository installs the published `specify-it` package locally
- a committed `specify-it.config.json` exists at the repository root
- `lefthook.yml` runs `specify-it check` during `pre-commit`
- the integration uses the installed package-manager-managed binary, not a global install assumption
- README documents the local package integration and deterministic hook behavior
- the slice does not modify the library implementation itself
