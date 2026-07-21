# Refine README Hero And Config Example

## Objective

Capture the latest README refinements so the public package landing section and configuration example better match the intended product presentation.

## Scope

- document the decision to render the banner as a standalone image above the centered README hero block
- document the decision to include `$schema` in the main configuration example shown in the README
- exclude any change to CLI behavior, package metadata, or runtime validation rules

## Design

The README hero now uses two distinct layers:

1. a standalone banner image at the very top of the document
2. a centered product header block beneath it with the title, badges, and quick links

This keeps the banner visually prominent while preserving a clean centered metadata block similar to product READMEs such as Prisma.

The configuration section should also show `$schema` directly in the main example config, not only in the short standalone snippet above it.

That makes the most complete example align with the actual generated `specify-it.config.json` file and reduces the chance that readers copy an incomplete config header.

These README refinements are presentation-only and should not change the underlying package behavior.

## Examples

Example hero structure:

```md
![Specify It!](./assets/banner.png)

<div align="center">
  <h1>Specify It!</h1>
  ...
</div>
```

Example config excerpt:

```json
{
  "$schema": "https://unpkg.com/specify-it@0.6.1/schemas/specify-it.json",
  "specs": {
    "root": ".specs"
  }
}
```

## Acceptance Criteria

- the README hero documents the banner as a standalone image above the centered header block
- the main README config example includes `$schema`
- the spec is limited to README presentation refinements
