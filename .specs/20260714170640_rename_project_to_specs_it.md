# Rename Project To Specs It

## Objective

Define the approved rename of the project from `spec-it` to `specify-it` across package metadata, CLI-facing names, configuration contract names, release automation, and repository documentation.

## Scope

- define the package rename from `spec-it` to `specify-it`
- define the CLI binary rename that should accompany the package rename
- define the configuration contract rename from `spec-it.config.*` to `specify-it.config.*`
- define which documentation references must be updated
- define which release and publish-related files must reflect the new name
- exclude new product features or behavioral changes unrelated to the rename

## Design

The current npm publication flow is blocked by naming restrictions around `spec-it`, so the project should adopt `specify-it` as its new public package identity.

The rename should be treated as a repository-wide naming update for package and release-facing surfaces, while preserving the current product direction, source layout, and feature set.

At minimum, the package manifest should update the published package name to `specify-it`.

The CLI binary exposed by the package should also use `specify-it` so installation and invocation stay aligned with the published package name.

Repository documentation should be updated anywhere the project is presented as `spec-it`, especially where the package name, CLI usage, installation expectations, or release workflow are described.

Release and publish automation should reflect the new package identity so generated releases, publish metadata, and workflow documentation no longer refer to the old blocked name.

The configuration contract should be renamed as part of the same change so the package name, CLI name, and generated config filename stay aligned. The generated default configuration file should become `specify-it.config.json`.

The first implementation may treat the config rename as a hard rename instead of a compatibility layer, since the project is still early and there is limited migration cost.

If examples or release notes include the package name, they should be updated to `specify-it` so the repository has one consistent public identity.

## Examples

Example outcomes this change should enable:

- `package.json` publishes the package as `specify-it`
- the package exposes a `specify-it` CLI binary
- `specify-it init` generates `specify-it.config.json`
- repository documentation refers to the public package as `specify-it`
- release automation publishes `specify-it` instead of `spec-it`
- code and docs use `specify-it.config.json` as the primary config filename

Example files expected to change:

- `package.json`
- `README.md`
- `src/commands/init.ts`
- `src/commands/init.test.ts`
- `.github/workflows/release.yml`
- `.release-it.json` if the release copy references the package name

## Acceptance Criteria

- the repository defines `specify-it` as the new package name
- the CLI binary name is aligned with `specify-it`
- the generated config contract uses `specify-it.config.*`
- release and publish-related files no longer present the package as `spec-it`
- repository documentation consistently uses `specify-it` for the public package identity
- no unrelated schema or feature changes are introduced beyond the rename
