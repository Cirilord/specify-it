# specify-it

`specify-it` is a planned CLI and validation library for standardizing spec-driven workflows across repositories.

## Goals

- standardize where specs live
- standardize how spec files are named
- provide a CLI to initialize and generate specs
- provide non-LLM validation for local hooks and CI
- prepare machine-readable rules that agents and LLMs can follow

## Product Model

`specify-it` is expected to combine deterministic commands with agent-facing skills.

- commands handle structural validation and objective context gathering
- skills handle semantic review and reconciliation between specs and code

The project should treat deterministic checks and LLM-assisted reasoning as complementary parts of the same workflow rather than as competing approaches.

## Documentation Map

- `AGENTS.md` defines collaboration and spec-writing rules for contributors and coding agents
- `IDEA.md` captures early-stage product direction and open questions
- `.specs/` stores implementation-ready and approved specs

## Tooling

The repository uses a small Node-based tooling stack for deterministic local checks.

- `ESLint` validates JavaScript and configuration files
- `Prettier` handles formatting for repository files
- `commitlint` enforces the documented `type(scope): message` commit format
- `lefthook` runs the selected checks during the local Git workflow
- `TypeScript` powers the initial source entrypoint and build flow

Install dependencies with `yarn install`.

Common commands:

- `yarn build`
- `yarn start`
- `yarn start:dev`
- `yarn format`
- `yarn format:check`
- `yarn lint`
- `yarn lint:check`
- `yarn test`
- `yarn test:cov`
- `yarn type-check`
- `yarn release`
- `yarn commit-lint --edit .git/COMMIT_EDITMSG`

Local hooks:

- `pre-commit` runs `lint` and `format:check`
- `commit-msg` runs `commit-lint`

## Source

The project now uses `src/index.ts` as the initial TypeScript entrypoint.

- `yarn type-check` validates the source tree without emitting files
- `yarn build` emits runnable output to `dist/`
- `yarn start` runs the built output
- `yarn start:dev` runs the source entrypoint directly during development
- the CLI now uses `cac` as its command-line foundation
- `yarn start -- --help` shows the current CLI help output
- `yarn start -- init` bootstraps `.specs/` and `specify-it.config.json`
- `yarn start -- init --bare` creates only the minimum structure
- `yarn start -- init --format=json` changes the generated spec example format
- `yarn start -- new --title="bootstrap release workflow"` creates a new Markdown spec scaffold from the repository configuration
- `yarn start -- new --title="add config loader" --group=feat` creates a grouped Markdown spec scaffold when the repository config defines spec groups

The first implemented CLI commands are `specify-it init` and `specify-it new`.

## Config

`specify-it init` generates a `specify-it.config.json` file that describes the repository spec contract.

Example:

```json
{
  "specs": {
    "root": ".specs",
    "format": "md",
    "language": "en",
    "naming": "timestamp-slug",
    "sections": {
      "order": ["Title", "Objective", "Scope", "Design", "Examples", "Acceptance Criteria"],
      "required": ["Objective", "Scope", "Design", "Acceptance Criteria"],
      "optional": ["Examples"]
    }
  },
  "agents": {
    "syncDocuments": ["AGENTS.md", "README.md"]
  },
  "checks": {
    "requireSpecsDirectory": true,
    "requireOrderedSections": true,
    "requireKnownExtension": true,
    "commitSpecs": {
      "mode": "any",
      "requireLatest": true
    }
  }
}
```

Grouped repositories may extend the config with an optional `specs.groups` list:

```json
{
  "specs": {
    "groups": ["feat", "fix", "docs", "chore"]
  }
}
```

Field overview:

| path                               | required | description                                                                                                                                                                                             |
| ---------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specs.root`                       | `true`   | defines where repository specs live                                                                                                                                                                     |
| `specs.format`                     | `true`   | defines the single source of truth for the project spec format; current bootstrap values are `md`, `json`, `html`, and `xml`                                                                            |
| `specs.language`                   | `true`   | communicates the expected language for LLM-authored specs                                                                                                                                               |
| `specs.naming`                     | `true`   | defines the filename strategy for specs; supported values are `timestamp-slug`, `slug`, `sequence-slug`, `date-slug`, `datetime-slug`, `group-timestamp-slug`, `timestamp-group-slug`, and `group-slug` |
| `specs.groups`                     | `false`  | optionally lists the allowed spec groups; when present, `specify-it new` requires `--group` with one of the configured values                                                                           |
| `specs.sections.order`             | `true`   | defines the canonical section order for markdown-style specs                                                                                                                                            |
| `specs.sections.required`          | `true`   | lists sections that must exist in every compliant spec                                                                                                                                                  |
| `specs.sections.optional`          | `true`   | lists sections that may be omitted                                                                                                                                                                      |
| `agents.syncDocuments`             | `true`   | lists repository documents that should stay aligned with spec and workflow changes                                                                                                                      |
| `checks.requireSpecsDirectory`     | `true`   | requires the configured specs directory to exist                                                                                                                                                        |
| `checks.requireOrderedSections`    | `true`   | requires specs to follow the configured section order                                                                                                                                                   |
| `checks.requireKnownExtension`     | `true`   | requires spec files to match the configured format                                                                                                                                                      |
| `checks.commitSpecs.mode`          | `true`   | describes commit-level expectations for specs; planned values are `none`, `one`, and `any`                                                                                                              |
| `checks.commitSpecs.requireLatest` | `true`   | expresses whether a newly added spec in a commit must be the latest spec in `.specs/` by timestamp order                                                                                                |

## New Specs

`specify-it new` scaffolds a new spec from the repository configuration.

- the first version requires `--title`
- the first version only scaffolds Markdown specs
- the first version only supports `specs.naming = "timestamp-slug"`
- the command reads `specify-it.config.json` from the current repository root
- `specs.groups` is optional
- when `specs.groups` is not configured, the spec is created directly under `specs.root`
- when `specs.groups` is configured, the command requires `--group` and validates it against the configured list

Example:

```bash
specify-it new --title="bootstrap release workflow"
specify-it new --title="add config loader" --group=feat
```

For grouped repositories, `specs.groups` is expected to use this shape:

```json
{
  "specs": {
    "groups": ["feat", "fix", "docs", "chore"]
  }
}
```

## Release

The repository is prepared for manual releases with `release-it`.

- `yarn release` is the local release entrypoint.
- `.release-it.json` defines the release strategy for Git tags, npm publishing, GitHub releases, and conventional changelog generation.
- `.github/workflows/release.yml` defines a manual GitHub Actions release workflow with `patch`, `minor`, and `major` version increments.
- the workflow uses the built-in `GITHUB_TOKEN` provided by GitHub Actions
- the repository must define `NPM_TOKEN` as a GitHub Actions secret before npm publication can succeed
- the workflow writes npm authentication explicitly into the npm config file used by the runner before running `release-it` so npm validation and publish steps share the same credentials
- `release-it` skips its redundant npm preflight auth checks because the workflow already verifies npm authentication explicitly with `npm whoami`
- the package manifest pins npm publication to `https://registry.npmjs.org/` so releases do not inherit an unintended registry from the Yarn environment

The release workflow runs these quality gates before creating a release:

- `yarn format:check`
- `yarn lint:check`
- `yarn type-check`
- `yarn test`
- `yarn build`

The package is prepared for public npm publication by:

- publishing built files from `dist/`
- exposing `dist/index.js` as the package entrypoint
- exposing `dist/index.d.ts` as the package type definition entrypoint
- exposing the CLI binary through the npm-compatible named `bin` manifest form
- publishing `README.md` and `LICENSE` alongside the built output

## Tests

Vitest is the current unit test runner for the project.

- `yarn test` runs the unit test suite
- `yarn test:cov` runs the suite with coverage enabled

## Workflow

Implementation work should follow this order:

1. Create the relevant spec.
2. Refine the spec until the design is aligned.
3. Approve the spec.
4. Implement the change.

## Current Direction

The initial focus is to define the project documentation foundation and then design the first version of the `specify-it` configuration model, CLI, checker behavior, and future skill contract around the `specify-it` package.
