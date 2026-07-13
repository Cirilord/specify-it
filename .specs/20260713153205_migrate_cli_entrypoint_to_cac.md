# Migrate CLI Entrypoint To Cac

## Objective

Define the first basic `spec-it` CLI implementation with `cac`, focused only on establishing the CLI entrypoint and help experience for future commands.

## Scope

- introduce `cac` as the CLI command parser for `spec-it`
- create a minimal CLI entrypoint with help and usage output
- define the expected help and usage experience for the initial CLI
- define the expected testing adjustments for the new CLI structure
- exclude product commands from this first CLI bootstrap

## Design

The project should establish a real CLI foundation before adding product commands.

The first CLI implementation should adopt `cac` to make command registration declarative and to provide a conventional command-line experience from the beginning.

The initial CLI should stay intentionally small. It only needs enough structure to:

- expose the `spec-it` command as a proper CLI entrypoint
- provide consistent help and usage output
- establish the structure that future commands will plug into

The CLI entrypoint should register top-level metadata such as the CLI name, description, and help behavior through `cac`.

The implementation should rely on `cac` for:

- usage output
- help output
- unknown command handling
- future command extensibility

This first CLI bootstrap does not need to implement any product command yet. The goal is to create a clean and minimal CLI shell that can later host those commands without reworking the entrypoint again.

Tests should be updated to validate the new CLI entrypoint shape without overfitting to `cac` internals. Command behavior should continue to be covered primarily through observable inputs and outputs.

Documentation should be updated only where needed to reflect the new CLI foundation and any user-visible help or usage improvements.

## Examples

Example commands that should work after the bootstrap:

- `spec-it --help`
- `spec-it`

Example outcomes that should be handled:

- running the CLI with no command
- running the CLI with an unknown command

## Acceptance Criteria

- `cac` is adopted as the CLI command parser
- the CLI entrypoint is implemented with a minimal `cac` setup
- CLI help and usage output are defined through the new command system
- tests are updated to cover the migrated CLI behavior
- documentation is updated where the migration changes the user experience
