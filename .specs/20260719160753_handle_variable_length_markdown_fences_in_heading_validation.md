# Use CommonMark Parsing For Markdown Heading Validation

## Objective

Define how `specify-it check` should use a real Markdown parser based on `commonmark` so heading validation remains correct for fenced code blocks, escaped examples, and other Markdown structures that are fragile to maintain with manual line scanning.

## Scope

- define how `commonmark` should be used to extract structural headings for spec validation
- define how fenced code blocks and escaped examples should behave under the parser-backed implementation
- define the minimum regression coverage needed for the parser-backed validation change
- define the dependency and implementation constraints for this migration
- exclude unrelated changes to spec naming, commit-aware checks, or non-Markdown formats

## Design

The current manual heading scan should be replaced with a `commonmark`-based parsing step for Markdown specs.

The checker should parse Markdown documents into a structural representation and derive heading validation from real Markdown heading nodes rather than from raw lines that happen to start with `#`.

This change should make heading validation robust for Markdown constructs such as:

- fenced code blocks
- escaped examples that use longer outer fences and shorter inner fences
- inline code that contains heading-like text
- future Markdown examples that would otherwise confuse a line-based parser

The implementation should use `commonmark` only as a parsing primitive. The repository should continue to own its validation rules, including:

- requiring exactly one top-level title
- validating supported section names
- detecting duplicate sections
- enforcing configured section order
- checking required sections

The parser-backed implementation should inspect heading nodes that exist at the document structure level and ignore heading-like text that appears inside code blocks or other non-heading nodes.

This should include the currently failing pattern where a spec contains a larger outer fenced block around an example that itself contains a normal three-backtick Markdown block.

The implementation does not need to expose the `commonmark` AST publicly. It only needs to use it internally to make heading validation deterministic and structurally correct.

Outside the parser migration, validation behavior should remain unchanged:

- exactly one top-level title is still required
- duplicate sections outside fences are still invalid
- required sections outside fences must still be present
- configured section ordering outside fences must still be enforced

## Examples

Example shape that should be treated as valid:

- outer fence line: ````md
- inner fence line inside the example: ```md
- inner closing fence line inside the example: ```
- outer closing fence line: ````

Example intent:

- the outer four-backtick fence wraps a Markdown example
- that example itself contains a normal three-backtick fenced block
- heading-like lines inside the wrapped example must not be treated as document headings

The example above should not report duplicate headings from the fenced example content.

## Acceptance Criteria

- Markdown heading validation uses `commonmark` parsing rather than a raw line-based heading scan
- headings inside fenced code blocks no longer trigger false positives
- escaped examples with larger outer fences and smaller inner fences no longer trigger false positives
- existing section validation rules continue to work on top of the parser-derived heading structure
- tests cover at least one case with a four-backtick outer fence and a three-backtick inner fence
