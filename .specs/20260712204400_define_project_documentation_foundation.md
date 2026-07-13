# Bootstrap Project Documentation Files

## Objective

Bootstrap the repository documentation for `spec-it` by creating the initial `AGENTS.md`, `README.md`, and `IDEA.md` files before broader implementation work begins.

## Scope

- create the initial `AGENTS.md` file as the contributor and coding-agent instruction file
- create the initial `README.md` file as the project overview and workflow entry point
- create the initial `IDEA.md` file as the place for early-stage direction and unresolved product questions
- establish the first repository-level documentation set in the project root
- align the repository with a spec-driven workflow adapted for this project
- capture the initial distinction between deterministic commands and future agent-facing skills

## Design

The repository root must contain newly created `AGENTS.md`, `README.md`, and `IDEA.md` files as part of the initial bootstrap.

Spec files must live directly under `.specs/` without an intermediate group directory.

`AGENTS.md` must define the baseline operating rules for work in the repository. As part of the bootstrap, it should preserve the spec-first workflow already used in related projects, including the `.specs/` directory, the timestamp-plus-slug filename pattern, and the required section ordering for specs.

`README.md` must explain what `spec-it` is trying to become, summarize the main goals of the project, and direct readers to the other documentation entry points.

`IDEA.md` must hold the evolving product direction, initial capabilities, and open questions that are not yet stable enough to be treated as implementation-ready requirements.

The bootstrap documentation should also record the current product direction that deterministic commands are responsible for structural validation and context gathering, while future skills are responsible for semantic review and reconciliation between specs and code.

The initial documentation set should be intentionally lightweight. This bootstrap must create enough structure to support future specs for the CLI, checker, configuration model, and agent-facing skills without pretending those designs are already finalized.

## Acceptance Criteria

- `AGENTS.md` is created at the repository root
- `README.md` is created at the repository root
- `IDEA.md` is created at the repository root
- `AGENTS.md` defines a spec-first workflow centered on `.specs/`
- `README.md` explains the purpose and current direction of `spec-it`
- `IDEA.md` captures early-stage product direction and open questions
- the documentation records the initial separation between deterministic commands and future skills
