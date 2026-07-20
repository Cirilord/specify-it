# Define Print Config Command

## Objective

Define a `specify-it print-config --json` command that prints the resolved repository configuration in a machine-readable format so agents and tools can consume the repository contract without reading multiple project files.

## Scope

- define the purpose and output shape of `specify-it print-config --json`
- define how the command reads and validates `specify-it.config.json`
- define the minimum JSON payload returned by the command
- define failure behavior when the repository config is missing or invalid
- exclude agent-specific prompt assembly or semantic guidance in this slice

## Design

The repository should expose a deterministic command:

```bash
specify-it print-config --json
```

The command should read the same repository configuration source already used by the other deterministic commands.

The first version should only support JSON output.

The command should print the resolved `specify-it` repository contract as JSON so callers do not need to parse `README.md`, `AGENTS.md`, or other documentation files to discover the deterministic rules.

The command should include the effective values needed by other tools and agents, including:

- `specs.root`
- `specs.format`
- `specs.language`
- `specs.naming`
- `specs.groups` when configured
- `specs.sections`
- `agents.syncDocuments`
- `checks`

The output should reflect the normalized and validated configuration shape used internally by the CLI rather than the raw file contents when those differ.

The command should fail clearly when:

- `specify-it.config.json` does not exist
- the config file cannot be parsed
- the config file does not match the supported schema

The first version should remain intentionally narrow:

- it prints configuration only
- it does not generate agent instructions
- it does not print repository docs
- it does not synthesize workflow recommendations

This command should act as the deterministic base layer that future skills or agent integrations can consume.

## Examples

Example command:

```bash
specify-it print-config --json
```

Example output:

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
      "maxChangedSpecs": 1,
      "requireLatest": true
    }
  }
}
```

Example failure cases:

- missing config file returns a non-zero exit code with a clear error message
- invalid config file returns a non-zero exit code with schema validation details

## Acceptance Criteria

- `specify-it` defines a `print-config` command
- `specify-it print-config --json` prints the resolved repository config as valid JSON
- the output includes the effective `specs`, `agents`, and `checks` sections
- the command reads the same config source and schema used by the existing CLI commands
- missing, malformed, or schema-invalid config files cause a clear non-zero failure
- the first version does not include agent-specific instruction synthesis
