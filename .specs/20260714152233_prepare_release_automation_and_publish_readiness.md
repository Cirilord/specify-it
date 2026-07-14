# Prepare Release Automation And Publish Readiness

## Objective

Define the first release-preparation slice for `spec-it` so the project can be made ready for npm publication with `release-it` without performing the actual publish in this change.

## Scope

- define how `release-it` should be introduced into the project
- define the minimum package metadata required before first publication
- define the release script and release configuration expectations
- define which build and validation steps must run before a release is created
- define the documentation updates required for release preparation
- exclude the actual npm publish operation from this change

## Design

The project now has an initial CLI and bootstrap flow, so the next step is to prepare a repeatable release workflow before attempting the first public npm publish.

This change should introduce `release-it` as the release automation tool for the repository. The first version only needs enough configuration to support version bumping, Git tagging, and npm-oriented release preparation from the project root.

The release setup should remain intentionally small. It should avoid advanced changelog automation or remote release providers unless they are necessary for the initial publish path.

The initial `release-it` configuration should use:

- a Git commit message in the format `chore: release ${version}`
- Git tag names in the format `v${version}`
- npm publishing enabled in the release configuration
- GitHub release creation enabled
- the `@release-it/conventional-changelog` plugin with the `angular` preset

The package metadata should be reviewed so the project is publish-ready. At minimum, the package should no longer remain private, and the manifest should expose the fields required for a normal public npm package workflow.

Before the first automated release is cut, the package should keep an explicit baseline version of `0.0.0` in `package.json`. The first published version should be produced by the release flow rather than being pre-bumped manually in the repository.

The release workflow should run the project validation steps before creating a release. At this stage, that should include formatting checks, linting, tests, and type checking, along with any build step required to produce the published output.

The project should define a `release` script in `package.json` so the release entrypoint is obvious and documented.

The build flow for published artifacts should avoid stale files in `dist/`. The repository should define an explicit cleanup step before the publish build so a release never ships removed or outdated files from a previous compilation. In the first version, that cleanup should be implemented with `rimraf dist` through the build script flow.

The `release-it` configuration may live in a dedicated config file or inside `package.json`, but the repository should choose one explicit approach and document it.

The repository should also define a manual GitHub Actions workflow for releases. The first version should use `workflow_dispatch` with an `increment` input limited to `patch`, `minor`, and `major`, and should only run when triggered from `main`.

The workflow should use the repository-provided `GITHUB_TOKEN` for GitHub release operations. The only additional secret that should need explicit repository configuration is `NPM_TOKEN`.

The GitHub Actions release step may call the `release-it` binary directly instead of going through the package script alias, as long as the workflow remains explicit and consistent with the repository tooling.

Because `release-it` performs its own npm authentication checks, the workflow may need to materialize npm authentication explicitly before the release step, for example by writing the npm token into the same config file referenced by `NPM_CONFIG_USERCONFIG` instead of relying only on transient setup-step state or a different `.npmrc` location.

If the workflow already performs an explicit npm authentication gate such as `npm whoami`, the repository may configure `release-it` to skip its redundant npm preflight checks so the workflow remains deterministic and does not fail on duplicated environment-specific validation.

The quality gates in the workflow should call the actual repository scripts rather than guessed command names. At this stage, that means the workflow should use the existing lint, format-check, test, type-check, and build entrypoints defined by the project.

The release preparation should also define what the first publish-ready package should include. The repository should clarify whether the distributed package is expected to ship built output only, plus the minimum supporting files such as the license and readme.

The publish-ready manifest should follow npm's canonical package metadata expectations so the release step does not depend on npm auto-correcting fields during publication. For this CLI package, that includes using the npm-compatible named `bin` object form that matches the published executable name.

The publish-ready manifest should also pin the npm publish registry explicitly when the repository uses Yarn for installation, so release automation does not accidentally attempt to publish against `registry.yarnpkg.com` or any other inherited default registry.

If the repository needs different TypeScript behavior for developer checks versus publish output, it should introduce a dedicated build tsconfig so the release package can exclude test artifacts while linting and type-checking still cover the full source tree.

This change should stop short of actually publishing to npm. The purpose is to leave the repository ready for a first manual publish once the maintainer confirms the npm account, package visibility, and release version strategy.

## Examples

Example outcomes this change should enable:

- `yarn release` exists as the release entrypoint
- `release-it` is configured for the repository
- the package manifest is no longer blocked from publication by `private: true`
- the package manifest keeps `0.0.0` as the pre-release baseline before the first published bump
- release automation runs validation before release creation
- a manual GitHub Actions release workflow exists with an `increment` input
- repository documentation explains that `NPM_TOKEN` must be configured and `GITHUB_TOKEN` is provided by GitHub Actions
- the publish build clears stale `dist/` artifacts before compilation
- repository documentation explains how release preparation works and what remains manual for the first publish

Example files expected to change:

- `package.json`
- `yarn.lock`
- a `release-it` configuration file or the manifest config block
- `README.md`

## Acceptance Criteria

- `release-it` is added to the project
- the project exposes a release script
- release configuration is defined in one explicit place
- the package manifest is prepared for future npm publication
- the manifest version remains `0.0.0` until the release workflow creates the first published version
- release automation validates the project before creating a release
- a release workflow is defined for manual GitHub Actions execution
- the workflow relies on `GITHUB_TOKEN` and documents `NPM_TOKEN` as the required custom secret
- the build flow clears `dist/` before compiling publish artifacts
- a dedicated build tsconfig may be used when publish output must differ from developer checks
- documentation explains the release-preparation workflow
- the change prepares publication readiness without performing an actual publish
