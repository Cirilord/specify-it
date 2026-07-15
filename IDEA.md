# specify-it Idea

## Vision

Build a library and CLI that makes spec-driven development portable, enforceable, and easy to teach to both humans and coding agents.

## Product Direction

- standardize the `.specs/` directory structure across projects
- support predictable spec filenames based on timestamps and slugs
- validate spec structure without using an LLM
- separate deterministic CLI responsibilities from LLM-assisted skill responsibilities
- expose project rules in a way that agents can consume reliably

## Initial Capabilities

- `specify-it init` to create the project folder structure and configuration file
- `specify-it new` to scaffold a spec document from project rules
- `specify-it check` to validate file path, filename, format, and document structure
- future deterministic commands should parse specs, list specs, and report code-to-spec change context without semantic interpretation
- local hook and CI integration for enforcement

## Commands And Skills

Deterministic commands should answer structural questions such as whether a spec is well-formed, where specs are located, and whether code or spec files changed together in a branch or commit.

Agent-facing skills should answer semantic questions such as whether an implementation still matches an approved spec, whether a spec should be updated to reflect an intentional code change, and which side should be treated as the source of truth when divergence is discovered.

This separation should let `specify-it` remain useful in CI and Git hooks while still supporting assisted review and refinement workflows with LLMs.

## Open Questions

- should Markdown remain the only authoring format in v1
- which configuration shape best serves both CLI users and agents
- what machine-readable outputs should be generated for skills and agent prompts
- which deterministic command outputs should be optimized for direct skill consumption

## Near-Term Plan

- define the documentation contract for `AGENTS.md`, `README.md`, and `IDEA.md`
- create the first project spec for the documentation foundation
- design the configuration schema that future skills can consume
- define the boundary between CLI commands and skills before implementing either
