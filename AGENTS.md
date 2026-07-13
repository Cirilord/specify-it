# Project Instructions

## Language

- Write all code, comments, documentation, filenames, and commit-facing text in English.

## Scope

- Make only the changes that are required to complete the requested task.
- If the user asks a question, answer it without changing code or files unless the user explicitly asks for changes.
- Every implementation must start with a spec in `.specs/`, followed by refinement and approval before implementation begins.
- Spec files must live directly under `.specs/`.
- Spec filenames must follow the `YYYYMMDDHHMMSS_name_of_the_spec` pattern.

## Documentation

- Keep `README.md` updated whenever project behavior, setup, scripts, or usage changes.
- Capture early-stage product direction, architectural intent, and open-ended project ideas in `IDEA.md`.
- Treat `.specs/` as the place for implementation-ready, refined, and approved work items.
- Keep the distinction between deterministic commands and agent-facing skills documented whenever that workflow changes.

## Spec Format

- Every spec must use the following section order:
  1. `# Spec Title`
  2. `## Objective`
  3. `## Scope`
  4. `## Design`
  5. `## Examples`
  6. `## Acceptance Criteria`
- Every spec must include `Objective`, `Scope`, `Design`, and `Acceptance Criteria`.
- `Examples` may be omitted when a spec is purely procedural and has no syntax, input, or output to illustrate.
- Specs that define syntax or behavior must include `Examples`.
- Extra sections may be added only when they are directly useful to the spec.

## Collaboration

- Before implementing significant features or design changes, discuss the implementation approach and align on the design first.
- If the user is discussing a feature direction, stay in design discussion mode until the user explicitly asks to proceed with implementation.
- Do not implement features until the supporting spec has been created, refined, and approved.
- Treat explicit user confirmation on the spec or design direction as approval.
- Approved specs are the source of truth for implementation.
- When code and specs diverge, update the code to match the approved spec unless a spec refinement is explicitly approved first.
- Do not rewrite specs only to justify an unapproved implementation.

## Commits

- Use commitlint-style commit messages in the format `type(scope): message`.
- The commit body may be written as a short bullet list.

Example:

```text
feat(project): add the initial implementation

- add the first implementation slice
- cover the behavior with specs
- document setup and usage changes in the README
```
