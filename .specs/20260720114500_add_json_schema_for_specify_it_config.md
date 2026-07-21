# Add JSON Schema For Specify It Config

## Objective

Add a published JSON Schema for `specify-it.config.json` and use `$schema` in the `specify-it` repository config so editors and tools can validate the configuration directly.

## Scope

- create a JSON Schema file for the `specify-it` repository configuration
- publish the schema as part of the npm package contents
- add `$schema` to the `specify-it.config.json` file in this repository
- update `specify-it init` so generated configs include `$schema`
- update the local published `specify-it` dependency used by this repository
- document the schema location and usage
- exclude any change to the underlying config behavior or validation rules in this slice

## Design

The project already has a deterministic configuration contract implemented in the CLI.

This slice should expose that contract as JSON Schema so editors such as VS Code can provide validation and autocomplete for `specify-it.config.json`.

The schema should be stored inside the package in a dedicated public folder:

- `schemas/specify-it.json`

The schema URL should follow the unpkg pattern used by tools such as `release-it`:

```json
{
  "$schema": "https://unpkg.com/specify-it@0.5.0/schemas/specify-it.json"
}
```

The first implementation should:

1. add `schemas/specify-it.json`
2. include the `schemas/` directory in the published package
3. update the repository's `specify-it.config.json` to include `$schema`
4. update `specify-it init` so generated configs also include `$schema`
5. update the local `specify-it` dependency in this repository to the published version that includes the schema support

The schema should describe the current supported configuration surface, including:

- `specs`
- `agents`
- `checks`
- nested structures such as `sections` and `commitSpecs`

The schema should stay aligned with the configuration shape enforced by the CLI.

This slice does not need to fully automate schema generation from Zod, but the resulting schema should reflect the same supported public contract.

The documentation should explain:

- what the schema is for
- where it lives
- why the generated config includes `$schema`

This repository also uses the published `specify-it` package as part of its own deterministic checks, so the dependency version should be updated in the same slice once the published package includes the schema support.

## Examples

Example config header:

```json
{
  "$schema": "https://unpkg.com/specify-it@0.5.0/schemas/specify-it.json",
  "specs": {
    "root": ".specs"
  }
}
```

Example published schema path:

```text
https://unpkg.com/specify-it@0.5.0/schemas/specify-it.json
```

## Acceptance Criteria

- a JSON Schema file exists at `schemas/specify-it.json`
- the schema is included in the published package contents
- the repository `specify-it.config.json` includes `$schema`
- `specify-it init` writes `$schema` into generated configs
- the local published `specify-it` dependency is updated to the version that includes the schema support
- the README documents the schema usage
- no runtime config rules are changed by this slice
