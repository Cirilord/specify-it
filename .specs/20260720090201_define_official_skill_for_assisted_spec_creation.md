# Define Official Skill For Assisted Spec Creation

## Objective

Define the first official `specify-it` agent-facing skill for assisted spec creation so coding agents can create compliant new specs in any repository that uses `specify-it`, by using the deterministic CLI contract instead of generating spec files ad hoc.

## Scope

- define the purpose and workflow of the first official `specify-it` skill
- define how the skill should use `specify-it print-config`, `specify-it new`, and `specify-it check`
- define the minimum repository setup assumptions for using the skill
- define the skill responsibilities and limits for the first version
- define the minimum documentation or packaged assets needed for the skill
- exclude direct semantic code-to-spec reconciliation beyond creating a new spec draft

## Design

The first official `specify-it` skill should focus on one task only:

- creating a new spec draft in any repository that already uses `specify-it`

The skill should not create spec files from scratch by writing arbitrary filenames or folder paths.

Instead, the skill should rely on the deterministic repository contract already provided by the CLI.

The first-version workflow should be:

1. run `npx specify-it print-config --json`
2. read the repository rules that matter for spec creation from the command output
3. derive or confirm a suitable spec title from the user request
4. run `npx specify-it new --title="..."` and `--group` when required by the repository config
5. open the newly created spec scaffold
6. draft the spec content for the scaffolded sections
7. run `npx specify-it check` only when finalizing the task or when deterministic validation is explicitly requested
8. if validation fails, correct the spec and re-run the check

This skill should treat the deterministic CLI as the source of truth for:

- repository contract
- spec location
- filename shape
- group handling
- scaffold structure
- repository validation

The skill should treat itself as responsible for:

- understanding the user request
- proposing the title and initial section content
- filling `Objective`, `Scope`, `Design`, `Examples`, and `Acceptance Criteria`
- revising the drafted content when deterministic validation fails

The first version should assume the repository has already been initialized with:

- the `specify-it` package installed
- a committed `specify-it.config.json`

If those assumptions are not met, the skill should stop and instruct the user to initialize the repository first rather than attempting to guess the project contract.

The first version should remain intentionally narrow:

- it creates new specs
- it does not yet implement semantic spec review
- it does not yet implement code-to-spec diff interpretation
- it does not yet implement spec-to-code planning

The first version should be packaged as an official `specify-it` agent-facing skill rather than as a new CLI command.

The skill instructions should be tool-agnostic where possible, but they should explicitly teach the agent to use the published `specify-it` CLI primitives through `npx specify-it ...` rather than bypass them.

The first version should document a minimal fallback mode for tools without native skill support.

That fallback should be suitable for `AGENTS.md`, `CLAUDE.md`, or equivalent agent instruction files and should explain:

- use `npx specify-it print-config --json` to read the repository contract
- use `npx specify-it new` to create the spec scaffold
- never invent the spec filename manually
- run `npx specify-it check` before considering the spec ready when final validation is needed
- fix validation failures instead of bypassing the workflow

The repository does not need to implement provider-specific prompt orchestration in this slice.

## Examples

Example user intent:

- `Create a spec for adding social login`

Example skill workflow:

```text
1. infer title: "add social login"
2. run: npx specify-it print-config --json
3. run: npx specify-it new --title="add social login"
4. open created spec
5. draft the spec sections
6. optionally run: npx specify-it check
```

Example fallback instructions for agent docs:

```md
## specify-it skill fallback

When asked to create a new spec in this repository:

- read the repository contract with `npx specify-it print-config --json`
- create the spec scaffold with `npx specify-it new`
- do not invent filenames or spec paths manually
- draft the spec content inside the generated scaffold
- run `npx specify-it check` before finishing when final validation is needed
- if the check fails, fix the spec and run the check again
```

## Acceptance Criteria

- the first official `specify-it` skill is defined for assisted new-spec creation
- the skill is documented as an official portable skill for repositories that use `specify-it`
- the skill uses `npx specify-it print-config --json` as the required contract discovery step
- the skill uses `specify-it new` as the required scaffold creation step
- the skill uses `specify-it check` as a final validation step rather than an every-edit loop
- the skill does not manually invent spec filenames or locations
- the first version assumes the repository is already initialized with `specify-it`
- the first version excludes semantic review, code-to-spec comparison, and spec-to-code planning
- the skill contract includes a fallback instruction set for environments without native skill support
