# Allow Release Commits To Skip Local Hooks

## Objective

Allow automated `release-it` version commits to bypass local Git hooks so repository release automation can succeed without being blocked by commit-time spec enforcement rules intended for human-authored changes.

## Scope

- define how automated release commits should bypass local hooks
- update the `release-it` configuration to pass `--no-verify` on its Git commit step
- document the reason for this release behavior
- exclude any change to the core `specify-it check` rules in this slice

## Design

The repository currently enforces `specify-it check` in `pre-commit`.

That is correct for normal contributor commits, but it conflicts with the automated `release-it` version commit because the release commit only updates release metadata and does not include a new spec change.

The release automation should not weaken the repository rules for normal development commits.

Instead, the automated release commit should bypass local hooks by passing `--no-verify` to Git.

The `release-it` configuration should keep:

- the same commit message format
- the same tag behavior
- the same npm publication flow
- the same GitHub release flow

Only the Git commit invocation should change so release automation can complete after `npm publish`.

The repository documentation should explain that this bypass is intentional for automated release commits because the pre-commit checks are designed for human-authored repository changes rather than mechanical version bumps.

## Examples

Example release-it behavior:

```json
{
  "git": {
    "commitMessage": "chore(release): release ${version}",
    "tagName": "v${version}",
    "commitArgs": ["--no-verify"]
  }
}
```

Example rationale:

- a contributor commit should still run `lefthook`
- an automated release commit may skip hooks because it only records the version bump and release metadata

## Acceptance Criteria

- `release-it` Git commits pass `--no-verify`
- normal contributor commits continue to run local hooks
- release documentation explains why automated release commits bypass hooks
- `specify-it check` behavior itself is unchanged
