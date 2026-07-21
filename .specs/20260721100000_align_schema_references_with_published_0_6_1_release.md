# Align Schema References With Published 0.6.1 Release

## Objective

Align the repository's schema references with the first published `specify-it` version that actually includes the config schema in the package, so local configuration, generated configuration, tests, and documentation all point to the correct released schema URL.

## Scope

- update schema references from `0.6.0` to `0.6.1`
- update the local published `specify-it` dependency to `^0.6.1`
- update generated config expectations in tests
- update the local repository config and documentation examples
- exclude any change to the schema structure or config behavior in this slice

## Design

The previous implementation introduced a published JSON Schema for `specify-it.config.json` and pointed repository references at:

```text
https://unpkg.com/specify-it@0.6.0/schemas/specify-it.json
```

However, the schema is only available starting with the published `0.6.1` package.

This slice should correct every public-facing schema reference so the repository points to the first valid published release that includes the schema.

The update should apply consistently to:

- `specify-it.config.json`
- `schemas/specify-it.json` `$id`
- `src/commands/init.test.ts`
- `README.md`
- the local published `specify-it` dependency used by this repository

The implementation should not change:

- the config shape
- the schema contents apart from its published `$id`
- CLI validation behavior
- runtime command behavior

## Examples

Example corrected schema reference:

```json
{
  "$schema": "https://unpkg.com/specify-it@0.6.1/schemas/specify-it.json"
}
```

Example corrected dependency:

```json
{
  "devDependencies": {
    "specify-it": "^0.6.1"
  }
}
```

## Acceptance Criteria

- repository schema references use `0.6.1`
- the local published `specify-it` dependency uses `^0.6.1`
- tests expect the `0.6.1` schema URL
- README examples use the `0.6.1` schema URL
- no schema structure or runtime config behavior is changed
