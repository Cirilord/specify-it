<div align="center">
  <h1>Specify It!</h1>
  <img src="./assets/banner.png" alt="Specify It!" width="900" />
  <br />
  <br />
  <a href="https://www.npmjs.com/package/specify-it"><img src="https://img.shields.io/npm/v/specify-it.svg?style=flat" alt="npm version" /></a>
  <a href="https://github.com/Cirilord/specify-it/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="license" /></a>
  <a href="https://github.com/Cirilord/specify-it/actions"><img src="https://img.shields.io/github/actions/workflow/status/Cirilord/specify-it/release.yml?branch=main" alt="GitHub Actions" /></a>
  <a href="https://github.com/Cirilord/specify-it/issues"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome" /></a>
  <br />
  <br />
  <a href="#getting-started">Quickstart</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#core-commands">Commands</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#configuration">Configuration</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#agent-skills">Agent Skills</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#release">Release</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://github.com/Cirilord/specify-it">GitHub</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://github.com/Cirilord/specify-it/issues">Issues</a>
  <br />
  <hr />
</div>

Standardize how your repository creates, names, validates, and shares specs across humans, hooks, CI, and agents.

## What is Specify It!

`specify-it` helps teams define a clear repository contract for specs.

Instead of letting every repository invent its own structure, naming, and validation rules, `specify-it` gives you a deterministic workflow that works for:

- humans writing specs
- local Git hooks
- CI pipelines
- agent and LLM tooling

It currently provides:

- `specify-it init` to bootstrap a repository contract
- `specify-it new` to create new spec scaffolds
- `specify-it check` to validate repository specs
- `specify-it list` to enumerate known specs
- `specify-it print-config --json` to expose the resolved repository contract for tools and agents
- official agent-facing skills for assisted spec workflows

## Getting Started

Install `specify-it` as a development dependency:

```bash
npm install -D specify-it
```

Initialize the repository:

```bash
npx specify-it init
```

Create a new spec:

```bash
npx specify-it new --title="add social login"
```

Validate the repository specs:

```bash
npx specify-it check
```

Inspect the resolved repository contract:

```bash
npx specify-it print-config --json
```

After `init`, your repository gets a deterministic contract through:

- `specify-it.config.json`
- a dedicated specs directory
- a predictable section structure
- validation rules that can run locally and in CI

## How Specify It! Works

Every repository that uses `specify-it` has a deterministic contract in `specify-it.config.json`.

That contract defines:

- where specs live
- how spec files are named
- which sections they must contain
- whether groups are used
- which validations apply during local development and CI

The CLI enforces that contract.

At a high level:

- deterministic commands define and validate the repository rules
- agent-facing skills consume those rules for assisted workflows

This separation lets repositories keep a stable source of truth for structural rules while still enabling LLM-assisted authoring.

## Core Commands

### `specify-it init`

Bootstraps `specify-it` in the current repository.

```bash
npx specify-it init
```

Useful variants:

```bash
npx specify-it init --bare
npx specify-it init --format=json
```

`init` creates the repository contract and the initial specs structure.

### `specify-it new`

Creates a new spec scaffold from the repository configuration.

```bash
npx specify-it new --title="bootstrap release workflow"
```

If the repository uses spec groups:

```bash
npx specify-it new --title="add config loader" --group=feat
```

Key behavior:

- `--title` is required
- `specs.groups` is optional
- when groups are configured, `--group` is required
- the filename is always derived from the configured naming strategy

### `specify-it check`

Validates repository specs against `specify-it.config.json`.

```bash
npx specify-it check
```

Machine-readable output:

```bash
npx specify-it check --json
```

The checker validates:

- repository layout
- filename shape
- file extension
- Markdown section order and required sections
- commit-aware repository rules when configured

### `specify-it list`

Lists known specs from the configured repository layout.

```bash
npx specify-it list
```

Machine-readable output:

```bash
npx specify-it list --json
```

This is useful for scripts, CI, and agent tooling that need spec inventory.

### `specify-it print-config`

Prints the resolved repository contract as JSON.

```bash
npx specify-it print-config --json
```

This command is designed for tools and agents that need a deterministic view of the repository rules without parsing multiple project files.

## Configuration

`specify-it init` generates a `specify-it.config.json` file that becomes the source of truth for the repository spec workflow.

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
      "mode": "one",
      "maxChangedSpecs": 1,
      "requireLatest": true
    }
  }
}
```

Grouped repositories can add:

```json
{
  "specs": {
    "groups": ["feat", "fix", "docs", "chore"]
  }
}
```

### Naming strategies

Supported `specs.naming` values:

- `timestamp-slug`
- `slug`
- `sequence-slug`
- `date-slug`
- `datetime-slug`
- `group-timestamp-slug`
- `timestamp-group-slug`
- `group-slug`

Slug segments use ASCII `snake_case` across every naming strategy.

### Configuration reference

| path                                 | required | description                                                                                                                                                                                                                                   |
| ------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specs.root`                         | `true`   | defines where repository specs live                                                                                                                                                                                                           |
| `specs.format`                       | `true`   | defines the single source of truth for the project spec format; current bootstrap values are `md`, `json`, `html`, and `xml`                                                                                                                  |
| `specs.language`                     | `true`   | communicates the expected language for LLM-authored specs                                                                                                                                                                                     |
| `specs.naming`                       | `true`   | defines the filename strategy for specs; supported values are `timestamp-slug`, `slug`, `sequence-slug`, `date-slug`, `datetime-slug`, `group-timestamp-slug`, `timestamp-group-slug`, and `group-slug`; slug segments use ASCII `snake_case` |
| `specs.groups`                       | `false`  | optionally lists the allowed spec groups; when present, `specify-it new` requires `--group` with one of the configured values                                                                                                                 |
| `specs.sections.order`               | `true`   | defines the canonical section order for markdown-style specs                                                                                                                                                                                  |
| `specs.sections.required`            | `true`   | lists sections that must exist in every compliant spec                                                                                                                                                                                        |
| `specs.sections.optional`            | `true`   | lists sections that may be omitted                                                                                                                                                                                                            |
| `agents.syncDocuments`               | `true`   | lists repository documents that should stay aligned with spec and workflow changes                                                                                                                                                            |
| `checks.requireSpecsDirectory`       | `true`   | requires the configured specs directory to exist                                                                                                                                                                                              |
| `checks.requireOrderedSections`      | `true`   | requires specs to follow the configured section order                                                                                                                                                                                         |
| `checks.requireKnownExtension`       | `true`   | requires spec files to match the configured format                                                                                                                                                                                            |
| `checks.commitSpecs.mode`            | `true`   | describes commit-level expectations for specs; supported values are `none`, `one`, and `any`                                                                                                                                                  |
| `checks.commitSpecs.maxChangedSpecs` | `false`  | optionally caps how many spec files may be changed in the current Git working set                                                                                                                                                             |
| `checks.commitSpecs.requireLatest`   | `true`   | expresses whether a newly added spec in a commit must be the latest spec in its target specs directory by timestamp order                                                                                                                     |

## Agent Skills

`specify-it` combines deterministic CLI commands with agent-facing skills.

- commands define and enforce the repository contract
- skills use that contract for assisted workflows

The first official skill currently shipped by the project is:

- `skills/creating-specs-with-specify-it/`

That skill is designed for repositories that already use `specify-it` and follows this workflow:

1. run `npx specify-it print-config --json`
2. read the repository contract
3. create the spec with `npx specify-it new`
4. draft the content inside the generated scaffold
5. run `npx specify-it check` when final validation is needed

For agents or environments without native skill support, a repository can mirror that same workflow in documents such as `AGENTS.md`.

## Release

The project uses `release-it` for package releases.

- `yarn release` is the local release entrypoint
- `.release-it.json` defines Git tags, npm publication, GitHub releases, and changelog generation
- `.github/workflows/release.yml` defines the manual GitHub Actions workflow for `patch`, `minor`, and `major` releases
- the workflow verifies npm authentication explicitly with `npm whoami`
- `release-it` uses `--no-verify` on automated version commits so mechanical release metadata updates do not get blocked by human-focused pre-commit checks
- the package publishes to `https://registry.npmjs.org/`

The release workflow runs:

- `yarn format:check`
- `yarn lint:check`
- `yarn type-check`
- `yarn test`
- `yarn build`

## Contributing

The repository follows a spec-first workflow for implementation work:

1. create the relevant spec
2. refine the spec until the design is aligned
3. approve the spec
4. implement the change

Helpful project documents:

- `AGENTS.md` defines collaboration and spec-writing rules for contributors and coding agents
- `IDEA.md` captures early-stage product direction and open questions
- `.specs/` stores implementation-ready and approved specs

For local project development:

- `yarn build` emits runnable output to `dist/`
- `yarn start` runs the built CLI
- `yarn start:dev` runs the source entrypoint directly
- `yarn test` runs the Vitest suite
- `yarn test:cov` runs the suite with coverage
- `yarn specify-it:check` runs the released CLI against this repository
