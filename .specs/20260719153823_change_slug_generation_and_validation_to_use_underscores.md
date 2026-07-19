# Change Slug Generation And Validation To Use Prisma-Style Snake Case

## Objective

Define how `specify-it` should switch spec slug generation and validation from hyphen-separated slugs to Prisma-style `snake_case` so generated filenames match the repository's preferred naming style across every naming strategy that includes a slug segment.

## Scope

- define the expected filename behavior for every naming strategy that includes a slug segment
- define how title normalization should convert spaces and separators into `snake_case`
- define the validation changes needed in deterministic checks
- define the generation changes needed in `new` and related naming helpers
- define the minimum documentation and test updates for this naming change
- exclude unrelated changes to spec timestamps, grouping rules, or section validation

## Design

The project should treat Prisma-style `snake_case` as the canonical format for spec slug segments.

When a spec title is normalized into a slug, the result should be ASCII-only `snake_case`.

The normalization rules should be:

- convert the title to lowercase
- normalize and remove diacritics
- convert spaces and other separators to `_`
- remove characters that are not `a-z`, `0-9`, or `_`
- collapse repeated underscores into a single `_`
- remove leading and trailing underscores

Accented characters should not be preserved in filenames. They should be normalized into their ASCII equivalents before validation or generation.

Examples:

- `Bootstrap Release Workflow` becomes `bootstrap_release_workflow`
- `Add config loader` becomes `add_config_loader`
- `LLM + Hooks` becomes `llm_hooks`
- `Definir ação rápida` becomes `definir_acao_rapida`

This rule should apply consistently anywhere a slug segment appears inside a configured naming strategy, including all supported naming strategies:

- `timestamp-slug`
- `slug`
- `sequence-slug`
- `date-slug`
- `datetime-slug`
- `group-timestamp-slug`
- `timestamp-group-slug`
- `group-slug`

Filename validation should be updated to accept ASCII `snake_case` slug segments as the canonical format for these naming strategies.

The implementation may decide whether to keep backward compatibility for already-created hyphenated spec filenames, but that decision must be explicit in the implementation and reflected in tests. If backward compatibility is not retained, the checker should consistently report older hyphenated filenames as invalid under the new rule.

Generated filenames must follow the same separator rule as validation so the `new` command and the checker stay aligned.

README documentation should be updated anywhere it currently implies hyphenated slug output.

## Examples

Example filenames under the updated rule:

- `20260719153823_bootstrap_release_workflow.md`
- `20260719_bootstrap_release_workflow.md`
- `0001_bootstrap_release_workflow.md`
- `feat_20260719153823_add_config_loader.md`
- `20260719153823_feat_add_config_loader.md`

Example validation outcomes:

- `20260719153823_bootstrap_release_workflow.md` should pass for `timestamp-slug`
- `20260719153823_bootstrap-release-workflow.md` should follow the explicitly chosen compatibility behavior from the implementation
- `20260719153823_definir_acao_rapida.md` should pass for `timestamp-slug`
- `20260719153823_definir_ação_rápida.md` should be rejected

## Acceptance Criteria

- slug generation uses ASCII `snake_case` instead of hyphenated slugs
- filename validation recognizes ASCII `snake_case` slug segments for every supported naming strategy
- `new` produces filenames with ASCII `snake_case` slugs
- tests cover both generation and validation for the updated separator behavior
- README examples and wording match the implemented naming behavior
