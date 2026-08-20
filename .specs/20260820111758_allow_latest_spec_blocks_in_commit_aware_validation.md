# allow latest spec blocks in commit-aware validation

## Objective

Allow commit-aware validation to accept multiple newly added timestamp-slug specs when they form
the newest contiguous block in a specs directory.

## Scope

Update the `checks.commitSpecs.requireLatest` behavior for timestamp-slug naming so that it
evaluates the full set of newly added specs in a directory instead of validating each new spec in
isolation.

Keep the existing single-spec behavior and error messaging intact when only one new spec is added.

Add automated coverage for both the passing and failing multi-spec scenarios.

## Design

When commit-aware checks run with `requireLatest: true`, group newly added specs by directory and
extract their timestamps in ascending order.

Resolve the sorted timestamp list for every timestamp-slug spec file currently present in that same
directory.

Treat the new specs as valid only when their timestamp list exactly matches the final suffix of the
directory timestamp list with the same length.

If a directory contains exactly one new spec and it is not the latest timestamp, keep emitting the
existing single-spec error message.

If a directory contains multiple new specs and they do not form the newest suffix block, emit a
multi-spec error that identifies the affected spec files and explains that they must form the
newest timestamp-slug block in that directory.

## Examples

A valid sequence:

- Existing specs: `20260714213000_existing_spec.md`
- New specs in the current change: `20260714214000_new_spec_one.md`,
  `20260714215000_new_spec_two.md`
- Result: pass, because the new specs occupy the newest timestamp block in `.specs`

An invalid sequence:

- Existing specs: `20260714216000_existing_latest_spec.md`
- New specs in the current change: `20260714214000_new_spec_one.md`,
  `20260714215000_new_spec_two.md`
- Result: fail, because a pre-existing newer spec still sits after the new block

## Acceptance Criteria

- `requireLatest: true` continues to fail when a single new timestamp-slug spec is older than the
  newest spec in its directory.
- `requireLatest: true` passes when multiple new timestamp-slug specs in the same directory form
  the newest contiguous timestamp block.
- `requireLatest: true` fails when multiple new timestamp-slug specs in the same directory do not
  form the newest contiguous timestamp block.
- The multi-spec failure message names the affected spec files and the directory they must trail.
