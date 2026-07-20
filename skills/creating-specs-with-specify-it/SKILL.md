---
name: creating-specs-with-specify-it
description: Use when creating a new spec in a repository that uses specify-it - read the enforced repository contract first, scaffold with the CLI, draft within the generated structure, and correct deterministic validation failures instead of inventing filenames or paths manually.
---

# Creating specs in a repository that uses specify-it

`specify-it` defines a deterministic contract for spec location, naming, grouping, and section structure. The configuration is the contract: read it before creating a spec, use the CLI to scaffold the file, and trust deterministic validation output when the repository rejects the result.

## 1. Detect whether the repository uses specify-it

Any of these usually means `specify-it` is in play:

- a `specify-it.config.json` file in the repository root
- a dependency on `specify-it` in `package.json`
- a Git hook or CI step that runs `specify-it check`

If none of these are present, stop and ask the user to initialize the repository first. Do not guess the local spec contract.

## 2. Read the enforced repository contract

```bash
npx specify-it print-config --json
```

If this exits non-zero, the configuration itself is missing or broken. Read the error output instead of guessing.

Use the JSON output as the source of truth. The fields that matter most when creating a spec are:

- `specs.root` — where specs live
- `specs.format` — which spec format the repository expects
- `specs.naming` — how the spec filename is constructed
- `specs.groups` — whether the repository requires a group and which values are allowed
- `specs.sections.order` — which sections the scaffold should contain and in what order
- `specs.sections.required` — which sections must be present
- `specs.language` — which language the repository expects for authored specs

Do not infer rules from other files when `print-config` already provides the contract.

## 3. Create the spec scaffold

Derive or confirm a concise title from the user request, then create the scaffold with the CLI:

```bash
npx specify-it new --title="add social login"
```

If `specs.groups` is configured, include `--group` with one of the allowed values:

```bash
npx specify-it new --title="add social login" --group=feat
```

Rules:

- never invent the spec filename manually
- never choose the target spec path manually
- never bypass `npx specify-it new` when creating a new spec

The generated file is the correct place to continue drafting.

## 4. Draft the spec content

Open the generated spec and write the content inside the scaffolded structure.

Follow `specs.sections.order` exactly. In Markdown repositories this usually means:

- `# Title`
- `## Objective`
- `## Scope`
- `## Design`
- `## Examples`
- `## Acceptance Criteria`

Keep the draft concrete and implementation-oriented:

- explain what should change
- describe the intended boundaries of the work
- capture the expected behavior or workflow
- give examples when the repository contract expects them
- write acceptance criteria that can be checked later

Do not rewrite the repository contract inside the spec unless the spec itself is changing that contract.

## 5. Validate when finalizing

When explicitly finalizing the task, or when deterministic validation is requested, run:

```bash
npx specify-it check
```

If the repository has a hook that runs `specify-it check`, that hook remains the final guardrail. You do not need to run the checker after every small edit.

## 6. Self-correct when validation rejects the spec

If `specify-it check` fails:

- fix only the reported deterministic issues
- keep the intended meaning of the spec intact
- re-run the check when final validation is needed
- never bypass the hook or ignore the validation output

Typical deterministic failures include:

- missing required sections
- invalid section order
- invalid filename shape
- missing or invalid group usage
- unsupported format or repository layout mismatches

Use the CLI output as the correction guide.
