# Define Check Command

## Objective

Define the first version of the `specify-it check` command so the project can deterministically validate spec files and repository structure without relying on LLM-assisted reasoning.

## Scope

- define the purpose and CLI contract of `specify-it check`
- define which repository and file-level validations belong to the first version
- define how the command loads and applies repository configuration
- define how the command reports success and failure
- exclude commit-aware checks and Git-history-aware checks from the first version

## Design

`specify-it check` should be the deterministic validation command for repository specs.

The first version should validate the current repository state on disk, using `specify-it.config.json` as the source of truth for spec location, format, naming, and section order rules.

The command interface should stay intentionally small in the first version. It should support:

- `specify-it check`

The first version should load `specify-it.config.json` from the current repository root before running checks. If the configuration file is missing or invalid, the command should fail with a clear error rather than inferring defaults.

The first version should validate repository structure according to the current configuration contract:

- when `checks.requireSpecsDirectory` is `true`, the configured specs root must exist
- when the configured specs root does not exist and the check requires it, the command should fail
- when `specs.groups` is configured, each spec file must live directly under a configured group directory inside the specs root
- when `specs.groups` is not configured, each spec file must live directly under the configured specs root

The first version should validate spec files according to the current naming and format rules:

- when `checks.requireKnownExtension` is `true`, each spec file must use the configured repository format
- the first version only needs to implement filename validation for `specs.naming = "timestamp-slug"`
- for `timestamp-slug`, filenames must match `YYYYMMDDHHMMSS_slug.<format>`
- the reserved bootstrap filename `00000000000000_initial_spec_example.<format>` should also be treated as valid
- the slug portion should contain lowercase letters, numbers, and hyphens
- grouped repositories should validate the filename independently from the group directory name

The first version should validate document structure only for Markdown specs.

For Markdown specs:

- when `checks.requireOrderedSections` is `true`, section headings must follow `specs.sections.order`
- required sections listed in `specs.sections.required` must exist
- optional sections listed in `specs.sections.optional` may be omitted
- the top-level title heading should be validated against the configured section contract, where `Title` represents the initial `# ...` heading in the document
- extra sections that are not part of the configured order should cause the check to fail in the first version, because the configuration already describes the canonical document structure

The first version should not attempt semantic validation of section content. It only needs to validate structural shape such as path, extension, filename, and section order.

The first version should not implement commit-aware checks, staged-file checks, branch comparisons, or `checks.commitSpecs.*` behavior. Those rules should be designed in a separate spec.

The command should exit with code `0` when all checks pass and with a non-zero exit code when any check fails.

The command output should be concise and deterministic:

- on success, print a short summary that the repository passed validation
- on failure, print each validation error on its own line
- error messages should identify the relevant file or path whenever possible
- when multiple files fail validation, the command should report all discovered structural errors from the current run instead of stopping at the first one

## Examples

Example CLI usage:

- `specify-it check`

Example successful outcomes:

- `.specs/` exists when required
- `.specs/20260714213000_bootstrap_release_workflow.md` matches `timestamp-slug`
- `.specs/00000000000000_initial_spec_example.md` is accepted as the reserved bootstrap example
- `.specs/feat/20260714213000_add_config_loader.md` is valid when `specs.groups` includes `feat`
- a Markdown spec follows the configured title and section order

Example failure outcomes:

- `specify-it.config.json` is missing
- the configured specs root does not exist
- a spec file uses `.txt` when the configured format is `md`
- a spec filename does not match `timestamp-slug`
- a grouped repository contains a spec outside the configured group directories
- a Markdown spec is missing `## Acceptance Criteria`
- a Markdown spec includes sections in the wrong order

## Acceptance Criteria

- `specify-it check` is defined as the deterministic repository validation command
- the first version uses the CLI shape `specify-it check`
- the command loads `specify-it.config.json` from the repository root and fails clearly when config is missing or invalid
- the first version validates repository structure using `specs.root`, `specs.groups`, and `checks.requireSpecsDirectory`
- the first version validates file extensions when `checks.requireKnownExtension` is enabled
- the first version validates filenames for `specs.naming = "timestamp-slug"`
- the first version accepts the reserved bootstrap example filename created by `specify-it init`
- grouped repositories validate group directories separately from filename structure
- the first version validates Markdown section order and required sections using `specs.sections.*` and `checks.requireOrderedSections`
- the first version treats extra Markdown sections outside the configured order as structural errors
- the command reports all discovered structural validation errors from the current run
- the command exits with `0` on success and non-zero on failure
- commit-aware validation and `checks.commitSpecs.*` behavior are explicitly excluded from this spec
