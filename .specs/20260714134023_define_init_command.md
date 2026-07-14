# Define Init Command

## Objective

Define the first real `spec-it` CLI command by specifying how `spec-it init` should bootstrap a repository for spec-driven workflows.

## Scope

- define the purpose and behavior of the `spec-it init` command
- define which files and directories the command should create
- define how the command should behave when target files already exist
- define how the command should initialize the project configuration file
- define the relationship between `init` output and the existing configuration contract
- define the documentation expectations for the command

## Design

`spec-it init` should be the first project-facing bootstrap command of the library.

The command should create the minimum repository structure needed for a project to adopt `spec-it` without manually assembling files by hand.

The initial bootstrap should include the root specs directory and a project configuration file that matches the public configuration contract supported by the library.

The first version should keep the bootstrap intentionally small while still being useful. By default it should create `.specs/`, a default `spec-it.config.json`, and an initial bootstrap spec example that demonstrates the expected file format and structure.

The command should prefer safe behavior when files already exist. It should not silently overwrite an existing configuration or specs directory contents without explicit intent.

The first version of `init` should focus on a predictable baseline rather than on extensive interactivity. It only needs enough behavior to establish the project structure and config entrypoint needed for future commands such as spec generation and checking.

The command should support the current direction of the library where configuration may later exist in multiple formats, but the bootstrap should choose one clear default output format for the generated config file. The default generated configuration file should be `spec-it.config.json`.

The command should also support a `--format=<value>` flag that defines the spec document format for the generated bootstrap example and the initial config. The command should default to `md` when the flag is not provided.

The generated configuration should treat `specs.format` as the single source of truth for the repository spec document type. The bootstrap should not duplicate that information in a separate extensions list when only one project-wide format is supported.

The generated configuration should also use a `specs.naming` value. The initial bootstrap should default to `timestamp-slug`, and the supported naming strategies should be:

- `timestamp-slug`
- `slug`
- `sequence-slug`
- `date-slug`
- `datetime-slug`
- `group-timestamp-slug`
- `timestamp-group-slug`
- `group-slug`

The command should support a `--bare` flag that skips creation of the initial bootstrap spec example. In that mode, the command should only create the minimum repository structure and should include a placeholder file such as `.specs/.gitkeep` when needed to preserve the empty specs directory in version control.

The command should validate CLI option input defensively. The `InitCommand.fromCliOptions` entrypoint should accept `unknown` input and should parse it with an inline `zod` schema inside `init.ts` before constructing the command instance.

The generated configuration should reflect the current project contract, including the main `specs`, `checks`, and `agents` areas, while staying small enough for users to understand and edit directly.

Optional config areas such as `specs.groups` should be omitted from the generated file when they are not being actively configured by the bootstrap. The default init output should stay minimal rather than emitting disabled placeholders.

The generated configuration should also include a `specs.language` field that communicates the expected language for LLM-authored specs. The first version should keep this field simple and store it as a locale-style string such as `en` or `pt-BR`.

The generated configuration should also formalize commit-to-spec expectations under `checks.commitSpecs`. The initial contract should keep `mode` configurable and should also include a `requireLatest` flag that expresses whether a newly added spec in a commit must be the latest spec in `.specs/` by timestamp order.

The default bootstrap spec example should use a reserved seed-style filename such as `00000000000000_initial_spec_example.<format>` so users can immediately recognize it as a template artifact rather than as a real generated work item.

The command should also define how users are informed about what was created, skipped, or already present in the target repository.

The documentation should explain what `spec-it init` creates and how the generated config connects to the broader spec workflow.

## Examples

Example bootstrap outputs that the command should be able to create:

- `.specs/`
- `spec-it.config.json`
- `.specs/00000000000000_initial_spec_example.md`

Example bootstrap outputs when using `--bare`:

- `.specs/`
- `.specs/.gitkeep`
- `spec-it.config.json`

Example outcomes that the command should handle:

- bootstrapping a clean repository
- bootstrapping a clean repository with `--format=json`
- bootstrapping a clean repository with `--bare`
- running in a repository that already has `.specs/`
- running in a repository that already has a `spec-it` config file
- receiving unknown CLI option input and normalizing it through schema validation

Example generated config expectations:

- `checks.commitSpecs.mode` may be `none`, `one`, or `any`
- `checks.commitSpecs.requireLatest` defines whether a new spec added by a commit must be the latest spec in the directory
- `specs.naming` defaults to `timestamp-slug` and must be one of the supported naming strategies

## Acceptance Criteria

- the `init` command behavior is clearly defined
- the initial bootstrap files and directories are explicitly defined
- the default generated config format is defined
- the default generated spec format is defined
- the supported naming strategies are defined
- the `--bare` behavior is defined
- CLI options are parsed from `unknown` input through a `zod` schema
- the bootstrap example filename convention is defined
- the command behavior for existing files is defined
- the generated config is aligned with the current configuration contract
- the generated config formalizes commit spec ordering expectations
- the documentation expectations for `init` are defined
