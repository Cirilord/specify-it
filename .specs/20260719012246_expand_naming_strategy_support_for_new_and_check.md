# Expand Naming Strategy Support For New And Check

## Objective

Define the next deterministic expansion for `specify-it new` and `specify-it check` so the project can support every configured `specs.naming` strategy, not only `timestamp-slug`.

## Scope

- define how all supported naming strategies should behave
- define how `specify-it new` should generate filenames for each supported strategy
- define how `specify-it check` should validate filenames for each supported strategy
- define how grouped repositories interact with naming strategies that include the group in the filename
- exclude changes to semantic validation and commit-aware recency beyond `timestamp-slug`

## Design

The current implementation only supports `specs.naming = "timestamp-slug"` in both `specify-it new` and `specify-it check`. The next slice should expand deterministic support across the full configured naming set.

This slice should support these naming strategies:

- `timestamp-slug`
- `slug`
- `sequence-slug`
- `date-slug`
- `datetime-slug`
- `group-timestamp-slug`
- `timestamp-group-slug`
- `group-slug`

The command surfaces should remain:

- `specify-it new --title="<title>"`
- `specify-it new --title="<title>" --group=<group>`
- `specify-it check`

Filename generation rules should be:

- `timestamp-slug`: `YYYYMMDDHHMMSS_slug.<format>`
- `slug`: `slug.<format>`
- `sequence-slug`: `NNNN_slug.<format>` where `NNNN` is the next zero-padded sequence in the target directory
- `date-slug`: `YYYYMMDD_slug.<format>`
- `datetime-slug`: `YYYYMMDDTHHMMSS_slug.<format>`
- `group-timestamp-slug`: `group_YYYYMMDDHHMMSS_slug.<format>`
- `timestamp-group-slug`: `YYYYMMDDHHMMSS_group_slug.<format>`
- `group-slug`: `group_slug.<format>`

For `sequence-slug`, the first version should derive the next value by scanning the target directory and incrementing the highest existing numeric prefix. The sequence width should be preserved at four digits in the first version.

`specify-it new` should keep using the normalized slug generated from `--title` for every naming strategy that includes a slug segment.

For naming strategies that include `group`, `specify-it new` should resolve the group from `--group` using the existing grouped-repository rules:

- when `specs.groups` is configured, `--group` remains required
- when `specs.groups` is not configured, naming strategies that include `group` should fail clearly because the command has no configured group value to embed in the filename
- the group segment written into the filename should use the configured group value verbatim

For grouped repositories using a naming strategy that includes `group`, both the directory and the filename should agree on the same group value. A spec under `.specs/feat/` with `specs.naming = "group-slug"` must use `feat_...` in the filename, not a different configured group.

`specify-it check` should validate filenames according to the configured naming strategy and the configured format. The validator should fail clearly when a filename does not match the active strategy.

When the active naming strategy includes `group`, `specify-it check` should validate both shape and consistency:

- the filename must match the configured strategy pattern
- the embedded group value must be one of the configured groups when `specs.groups` exists
- if the spec lives under a configured group directory, the embedded filename group must match that directory name

When the active naming strategy does not include `group`, grouped repositories should continue to validate directory placement separately from filename structure.

The reserved bootstrap file created by `specify-it init` should remain valid only for `timestamp-slug`. This slice does not need to define bootstrap exceptions for other naming strategies.

Commit-aware recency should remain limited to `timestamp-slug` in this slice. Supporting additional naming strategies for `new` and structural `check` should not expand `checks.commitSpecs.requireLatest`.

## Examples

Example generated filenames:

- `timestamp-slug` with title `Bootstrap Release Workflow` produces `20260719013000_bootstrap-release-workflow.md`
- `slug` with title `Bootstrap Release Workflow` produces `bootstrap-release-workflow.md`
- `sequence-slug` with title `Bootstrap Release Workflow` produces `0007_bootstrap-release-workflow.md` when `0006_existing-spec.md` is the current highest sequence
- `date-slug` with title `Bootstrap Release Workflow` produces `20260719_bootstrap-release-workflow.md`
- `datetime-slug` with title `Bootstrap Release Workflow` produces `20260719T013000_bootstrap-release-workflow.md`
- `group-timestamp-slug` with title `Bootstrap Release Workflow` and group `feat` produces `feat_20260719013000_bootstrap-release-workflow.md`
- `timestamp-group-slug` with title `Bootstrap Release Workflow` and group `feat` produces `20260719013000_feat_bootstrap-release-workflow.md`
- `group-slug` with title `Bootstrap Release Workflow` and group `feat` produces `feat_bootstrap-release-workflow.md`

Example supported outcomes:

- `specify-it new` creates a slug-only spec when `specs.naming = "slug"`
- `specify-it check` accepts `20260719_bootstrap-release-workflow.md` when `specs.naming = "date-slug"`
- `specify-it new` picks the next available `sequence-slug` value inside the target directory
- `specify-it new` creates `feat_bootstrap-release-workflow.md` under `.specs/feat/` when `specs.naming = "group-slug"`
- `specify-it check` accepts `20260719013000_feat_bootstrap-release-workflow.md` under `.specs/feat/` when `specs.naming = "timestamp-group-slug"`

Example failure outcomes:

- `specify-it check` rejects `bootstrap-release-workflow.md` when `specs.naming = "date-slug"`
- `specify-it new` fails when `specs.naming = "group-slug"` and `specs.groups` is not configured
- `specify-it check` rejects `fix_bootstrap-release-workflow.md` under `.specs/feat/` when `specs.naming = "group-slug"`
- `checks.commitSpecs.requireLatest = true` continues to reject unsupported naming strategies for commit-aware recency checks

## Acceptance Criteria

- `specify-it new` supports every configured naming strategy: `timestamp-slug`, `slug`, `sequence-slug`, `date-slug`, `datetime-slug`, `group-timestamp-slug`, `timestamp-group-slug`, and `group-slug`
- `specify-it check` validates filenames for the same supported naming strategies
- `sequence-slug` generation is defined using the next four-digit numeric prefix in the target directory
- naming strategies that include `group` require a resolved configured group value
- grouped repositories validate both directory placement and filename-group consistency when the naming strategy includes `group`
- the bootstrap filename exception remains limited to `timestamp-slug`
- commit-aware recency remains limited to `timestamp-slug`
