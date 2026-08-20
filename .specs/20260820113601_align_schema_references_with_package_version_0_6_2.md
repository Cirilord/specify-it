# align schema references with package version 0.6.2

## Objective

Align the repository's generated config expectations and published schema references with the current package version `0.6.2`, so the `init` command, tests, local schema metadata, and documentation all point to the same released schema URL.

## Scope

- update `init` test expectations that still hardcode the previous `0.6.1` schema URL
- update repository-owned schema references that still point to `0.6.1`
- keep the current runtime behavior where `init` derives the schema URL from `package.json`
- exclude any change to config structure, CLI flags, or validation semantics

## Design

The current failure is caused by a version drift inside the repository:

- `package.json` is already versioned as `0.6.2`
- `src/commands/init.ts` builds `$schema` dynamically from `package.json.version`
- `src/commands/init.test.ts` still expects `0.6.1`
- `README.md`, `specify-it.config.json`, and `schemas/specify-it.json` still reference `0.6.1`

This slice should align the repository around the currently published package version `0.6.2`.

The implementation should update the remaining hardcoded `0.6.1` references to `0.6.2` in repository-owned files, while preserving the existing dynamic generation in `InitCommand`.

The implementation should not:

- change the schema shape
- pin `InitCommand` to a fixed version string
- change spec bootstrap behavior beyond the schema URL it already derives from the package version
- introduce new CLI options or release workflow changes

## Examples

Example expected generated config snippet:

```json
{
  "$schema": "https://unpkg.com/specify-it@0.6.2/schemas/specify-it.json"
}
```

Example schema metadata identifier:

```json
{
  "$id": "https://unpkg.com/specify-it@0.6.2/schemas/specify-it.json"
}
```

## Acceptance Criteria

- `src/commands/init.test.ts` expects the `0.6.2` schema URL
- `README.md` examples use the `0.6.2` schema URL
- `specify-it.config.json` points to the `0.6.2` schema URL
- `schemas/specify-it.json` uses the `0.6.2` published `$id`
- `yarn test` passes for the `init` test suite after the references are aligned
- no config behavior or schema structure changes beyond version alignment are introduced
