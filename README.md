# spec-it

`spec-it` is a planned CLI and validation library for standardizing spec-driven workflows across repositories.

## Goals

- standardize where specs live
- standardize how spec files are named
- provide a CLI to initialize and generate specs
- provide non-LLM validation for local hooks and CI
- prepare machine-readable rules that agents and LLMs can follow

## Product Model

`spec-it` is expected to combine deterministic commands with agent-facing skills.

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

Install dependencies with `yarn install`.

Common commands:

- `yarn build`
- `yarn format`
- `yarn format:check`
- `yarn lint`
- `yarn lint:check`
- `yarn test`
- `yarn type-check`
- `yarn commit-lint --edit .git/COMMIT_EDITMSG`

Local hooks:

- `pre-commit` runs `lint` and `format:check`
- `commit-msg` runs `commit-lint`

## Workflow

Implementation work should follow this order:

1. Create the relevant spec.
2. Refine the spec until the design is aligned.
3. Approve the spec.
4. Implement the change.

## Current Direction

The initial focus is to define the project documentation foundation and then design the first version of the `spec-it` configuration model, CLI, checker behavior, and future skill contract.
