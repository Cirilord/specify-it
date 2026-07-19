# Define JSON Output For Check Command

## Objective

Define a machine-readable output mode for `specify-it check` so CI jobs, Git hooks, and coding agents can consume deterministic validation results without parsing human-oriented text.

## Scope

- define the CLI contract for JSON output on `specify-it check`
- define the JSON result shape for successful and failing runs
- define how JSON output should interact with exit codes
- define which existing validation data should be exposed in the first version
- exclude semantic code-to-spec analysis and rich reporting formats beyond JSON

## Design

`specify-it check` should keep its current human-readable default output. The first machine-readable extension should be an opt-in JSON mode.

The command surface should become:

- `specify-it check`
- `specify-it check --json`

When `--json` is not provided, the command should keep the current text output behavior unchanged.

When `--json` is provided, the command should print exactly one JSON object to stdout. It should not print human summary lines alongside the JSON payload.

The first JSON payload should include:

- `ok`: boolean indicating whether validation passed
- `errors`: array of validation error strings in the same deterministic order used by the text output
- `checkedSpecs`: number of spec files structurally evaluated during the run
- `changedSpecs`: number of spec files detected in the current Git working set when commit-aware checks are enabled, otherwise `0`

The first version should not require a nested or heavily structured error format. Reusing the existing error strings keeps the JSON mode easy to adopt without redesigning every validation branch.

The first version should treat JSON output as a presentation change, not a behavior change:

- successful runs should still exit with code `0`
- failing runs should still exit with a non-zero code
- config parse failures and missing Git context should still fail the command

If the command fails before producing a validation result, such as when config loading throws or Git context cannot be resolved for commit-aware checks, `--json` should still return a JSON object instead of plain stderr text when the failure is handled within the command boundary.

For handled command failures, the JSON payload should use this shape:

- `ok: false`
- `errors`: array containing the thrown error message
- `checkedSpecs: 0`
- `changedSpecs: 0`

The first version should not add per-file nested diagnostics, severity levels, timestamps, or schema versioning. Those can be introduced later if the project needs richer machine-readable integrations.

## Examples

Example CLI usage:

- `specify-it check --json`

Example success payload:

```json
{
  "ok": true,
  "errors": [],
  "checkedSpecs": 3,
  "changedSpecs": 1
}
```

Example failure payload:

```json
{
  "ok": false,
  "errors": ["Missing required spec change: checks.commitSpecs.mode is \"one\"."],
  "checkedSpecs": 2,
  "changedSpecs": 0
}
```

Example handled command error payload:

```json
{
  "ok": false,
  "errors": ["Could not find specify-it.config.json in /repo."],
  "checkedSpecs": 0,
  "changedSpecs": 0
}
```

## Acceptance Criteria

- `specify-it check` keeps the current human-readable output by default
- `specify-it check --json` is defined as an opt-in machine-readable mode
- the JSON output shape is defined with `ok`, `errors`, `checkedSpecs`, and `changedSpecs`
- JSON mode reuses the existing deterministic error strings in the first version
- JSON mode preserves the same success and failure exit-code behavior as text mode
- handled command failures return JSON output when `--json` is enabled
- the first version explicitly excludes richer nested diagnostics and non-JSON machine-readable formats
