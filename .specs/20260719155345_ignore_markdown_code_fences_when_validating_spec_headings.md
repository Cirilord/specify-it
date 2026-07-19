# Ignore Markdown Code Fences When Validating Spec Headings

## Objective

Define how the `specify-it check` command should ignore Markdown headings that appear inside fenced code blocks so example snippets do not trigger false-positive title, duplicate-section, or section-order validation errors.

## Scope

- define how Markdown structure validation should treat fenced code blocks
- define the expected behavior for heading parsing outside and inside fenced code blocks
- define the minimum test coverage needed for this parsing fix
- exclude broader Markdown parsing redesigns beyond the fenced-code handling needed for current validation

## Design

The current Markdown structure validation should continue to validate visible document headings, but it should stop treating lines inside fenced code blocks as part of the spec document outline.

When the checker evaluates a Markdown spec, fenced code blocks delimited by triple backticks should be treated as opaque content regions.

While the parser is inside a fenced code block, lines that begin with `#` or `##` should not count as title or section headings for validation purposes.

This behavior should apply regardless of whether the fence includes an info string such as:

- ` ```md `
- ` ```json `
- ` ```text `
- ` ``` `

When the closing fence is reached, normal heading parsing should resume.

This change should ensure that Markdown examples embedded in spec files can demonstrate valid heading structures without corrupting the validation result for the surrounding spec.

The validation rules outside code fences should remain unchanged:

- the spec still needs exactly one top-level title heading
- required sections must still be present
- duplicate sections outside code fences should still be reported
- configured section ordering outside code fences should still be enforced

The implementation does not need to introduce a full Markdown parser. A lightweight fenced-code-aware line scan is sufficient for this slice as long as it is deterministic and covered by tests.

## Examples

Example content that should pass:

````md
# Define New Command

## Objective

## Scope

## Design

## Examples

```md
# Bootstrap Release Workflow

## Objective

## Scope

## Design

## Examples

## Acceptance Criteria
```
````

## Acceptance Criteria

```

The example above should not report:

- duplicate `Objective`
- duplicate `Scope`
- duplicate `Design`
- duplicate `Examples`
- duplicate `Acceptance Criteria`
- multiple top-level titles

## Acceptance Criteria

- Markdown heading validation ignores headings inside fenced code blocks
- headings outside fenced code blocks continue to be validated exactly as before
- specs that include Markdown examples with heading syntax no longer fail with false positives
- tests cover at least one passing case where a fenced example contains `#` and `##` headings
```
