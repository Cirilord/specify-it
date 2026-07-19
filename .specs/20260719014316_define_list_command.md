# Define List Command

## Objective

Define the first version of `specify-it list` so repositories can deterministically enumerate their known specs without relying on ad hoc filesystem inspection or agent reasoning.

## Scope

- define the CLI contract for `specify-it list`
- define which spec metadata should be returned in the first version
- define how grouped repositories should be represented in the output
- define how the command should interact with the repository configuration
- exclude semantic analysis, document parsing beyond basic metadata, and filtering by Git state

## Design

`specify-it list` should be the deterministic inventory command for repository specs.

The first version should read `specify-it.config.json` from the current repository root and use the configured `specs.root`, `specs.groups`, `specs.format`, and `specs.naming` rules to discover specs.

The command surface should support:

- `specify-it list`
- `specify-it list --json`

When `--json` is not provided, the command should print a concise human-readable list of discovered spec paths, one per line, followed by a short summary line with the total count.

When `--json` is provided, the command should print exactly one JSON object to stdout with:

- `count`: total number of discovered spec files
- `specs`: array of spec objects

Each spec object in the first version should include:

- `path`: repository-relative path to the spec file
- `group`: configured group name when the repository uses groups, otherwise `null`
- `format`: file format derived from configuration
- `naming`: active naming strategy from configuration

The first version should only list files that satisfy the configured placement rules:

- when `specs.groups` is not configured, only files directly under `specs.root` should be listed
- when `specs.groups` is configured, only files directly under configured group directories should be listed

The first version should not recurse arbitrarily or attempt to recover invalid layouts. Invalid directories or misplaced files should cause the command to fail clearly instead of being silently skipped.

`specify-it list` should reuse the same structural expectations already enforced by `specify-it check` for repository placement. It does not need to validate full document structure, but it should reject invalid repository layout and invalid filename shape according to the configured naming strategy.

If `specify-it.config.json` is missing or invalid, the command should fail clearly.

If `checks.requireSpecsDirectory` is `true` and the configured specs root does not exist, the command should fail clearly. If the specs directory is optional and missing, the command should return an empty result.

The first version should not support filtering by group, by filename prefix, by date, or by changed files. Those can be added in later specs if needed.

## Examples

Example CLI usage:

- `specify-it list`
- `specify-it list --json`

Example text output:

```text
.specs/20260719013000_bootstrap-release-workflow.md
.specs/20260719014000_add-config-loader.md
2 specs found.
```

Example grouped JSON output:

```json
{
  "count": 2,
  "specs": [
    {
      "path": ".specs/feat/feat_bootstrap-release-workflow.md",
      "group": "feat",
      "format": "md",
      "naming": "group-slug"
    },
    {
      "path": ".specs/fix/fix_repair-parser-edge-case.md",
      "group": "fix",
      "format": "md",
      "naming": "group-slug"
    }
  ]
}
```

Example failure outcomes:

- `specify-it.config.json` is missing
- the configured specs root is required but missing
- a repository contains invalid nested spec directories for its configured grouping model
- a listed file does not match the configured naming strategy

## Acceptance Criteria

- `specify-it list` is defined as the deterministic spec inventory command
- the first version supports text output and `--json`
- the command loads `specify-it.config.json` from the repository root and fails clearly when config is missing or invalid
- the command respects `specs.root`, `specs.groups`, `specs.format`, and `specs.naming`
- grouped repositories include `group` metadata in the result
- invalid layout or invalid filename shape causes the command to fail clearly
- a missing optional specs directory returns an empty result
- the first version explicitly excludes semantic parsing and filtering features
