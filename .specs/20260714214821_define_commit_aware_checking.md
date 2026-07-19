# Define Commit-Aware Checking

## Objective

Define the second validation slice for `specify-it check` so the project can deterministically validate commit-aware spec rules using Git context in addition to the existing structural repository checks.

## Scope

- define the first commit-aware behaviors that should be enforced by the checker
- define how `specify-it check` should use Git state to evaluate commit-related config rules
- define how `checks.commitSpecs.mode`, `checks.commitSpecs.maxChangedSpecs`, and `checks.commitSpecs.requireLatest` should behave
- define the expected CLI behavior for commit-aware failures
- exclude semantic code-to-spec comparison from this version

## Design

This spec extends the checker beyond repository structure and file validation.

The structural validation behavior already defined for `specify-it check` should remain intact. The scope of this spec is only the Git-aware layer that evaluates whether spec files were changed in the expected way for the current working set or commit context.

The command surface should remain:

- `specify-it check`

The first commit-aware version should evaluate Git state from the current repository and apply the repository configuration under `checks.commitSpecs`.

The first version should be intentionally conservative about what it validates. It only needs to answer deterministic questions such as whether spec files were added or changed together with other work, and whether a newly added spec is the latest spec in the configured specs root.

The checker should continue to fail clearly when `specify-it.config.json` is missing or invalid. In addition, the commit-aware layer should fail clearly when Git context is required but cannot be resolved from the current repository state.

The first commit-aware version should interpret `checks.commitSpecs.mode` as follows:

- `none`: no spec file is required in the current change set
- `one`: at least one spec file must be present in the current change set
- `any`: zero or more spec files are allowed, but when spec files are present they must still satisfy the other commit-aware rules

The first commit-aware version should interpret `checks.commitSpecs.maxChangedSpecs` as follows:

- when omitted, the checker should not enforce a maximum number of changed spec files
- when present, the value must be a positive integer
- when present, the number of changed spec files in the current change set must not exceed the configured value
- `maxChangedSpecs` should be evaluated independently from `mode`, so repositories can combine "at least one spec" with "no more than one spec"

The first commit-aware version should define the current change set as the files currently changed in the working tree relative to Git, including staged and unstaged changes. This keeps the command useful before a commit is finalized and allows it to support local hook workflows.

Spec files in the current change set should be identified according to the configured specs root and current format rules.

For `checks.commitSpecs.requireLatest`:

- when `false`, the checker should not enforce spec recency
- when `true`, each newly added spec file in the current change set must be the latest spec in its target directory according to the configured naming strategy

In the first version, recency enforcement only needs to support `specs.naming = "timestamp-slug"`.

For grouped repositories:

- recency should be evaluated within the resolved target directory of the spec file
- a spec under `.specs/feat/` should only be compared against other specs under `.specs/feat/`
- a spec under the ungrouped root should be compared against other specs in the root

The reserved bootstrap spec created by `specify-it init` should be ignored by commit-aware recency checks. It should not block new work items from being treated as the latest spec.

The first commit-aware version should report failures deterministically:

- when `checks.commitSpecs.mode = "one"` and no spec files are changed, the command should fail
- when `checks.commitSpecs.mode = "none"` and spec files are changed, the command should fail
- when `checks.commitSpecs.maxChangedSpecs = 1` and more than one spec file is changed, the command should fail
- when `checks.commitSpecs.requireLatest = true` and a newly added spec is not the latest in its directory, the command should fail

The first commit-aware version should not attempt to infer whether a code change semantically required a spec update. It only validates the presence and ordering of spec files in the Git change set.

The first commit-aware version should not attempt branch-aware comparisons, pull request awareness, or remote-based checks. It should operate only on local Git state.

## Examples

Example successful outcomes:

- `checks.commitSpecs.mode = "one"` and the current working tree includes at least one changed spec file
- `checks.commitSpecs.mode = "one"` and `checks.commitSpecs.maxChangedSpecs = 1` and the current working tree includes exactly one changed spec file
- `checks.commitSpecs.mode = "none"` and the current working tree includes no changed spec files
- `checks.commitSpecs.requireLatest = true` and a newly added `timestamp-slug` spec is newer than every other real spec in the same target directory

Example failure outcomes:

- `checks.commitSpecs.mode = "one"` and no spec file is changed
- `checks.commitSpecs.mode = "none"` and a spec file is changed
- `checks.commitSpecs.maxChangedSpecs = 1` and two spec files are changed in the same working tree
- `checks.commitSpecs.requireLatest = true` and a newly added spec is older than an existing spec in the same target directory
- Git context cannot be resolved for a repository where commit-aware checks are enabled

## Acceptance Criteria

- the commit-aware layer is defined as a separate extension of `specify-it check`
- the structural checker behavior remains outside the scope of this spec and should continue to work unchanged
- `checks.commitSpecs.mode` behavior is defined for `none`, `one`, and `any`
- `checks.commitSpecs.maxChangedSpecs` behavior is defined as an optional upper bound for changed spec files in the current change set
- the first version defines the current change set using local Git working tree changes
- spec file detection for the change set is defined in terms of the configured specs root and format
- `checks.commitSpecs.requireLatest` behavior is defined for the first version
- recency enforcement is limited to `specs.naming = "timestamp-slug"` in the first version
- grouped repositories define recency within the resolved target directory
- the reserved bootstrap example is ignored by commit-aware recency checks
- the first version defines deterministic failure behavior for missing required specs, forbidden spec changes, too many changed specs, and non-latest new specs
- semantic code-to-spec comparison is explicitly excluded from this spec
