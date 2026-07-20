# Restructure README For Library Users

## Objective

Restructure the public `README.md` so it serves primarily as user-facing product documentation for people adopting `specify-it` in their repositories, with a clearer getting-started flow and a presentation style closer to the Prisma README.

## Scope

- redefine the README structure around library users instead of project contributors
- add a clearer product introduction and value proposition
- add a practical getting-started section with the main adoption flow
- explain the core deterministic commands and agent skill model at a high level
- add the standard public package metadata fields needed for npm and GitHub discoverability
- normalize the public-facing `package.json` field order for readability
- preserve important setup, configuration, and release information in a better-organized form
- exclude any change to the CLI behavior or runtime package contents in this slice

## Design

The README should shift from an implementation-oriented repository overview to a product-oriented library overview.

The new structure should prioritize:

1. what `specify-it` is
2. why a repository would adopt it
3. how to get started quickly
4. how the main commands and configuration fit together
5. how agent-facing skills relate to the deterministic CLI

The top of the README should feel closer to a product README than to internal contributor notes.

The README should include a short, direct introduction that explains `specify-it` as a tool for standardizing repository specs for:

- humans
- local hooks
- CI
- agent tooling

The README should then present a quickstart flow using the main public commands:

- install `specify-it`
- run `npx specify-it init`
- create a spec with `npx specify-it new --title="..."`
- validate with `npx specify-it check`
- inspect the repository contract with `npx specify-it print-config --json`

The README should keep configuration and command details, but move them behind a clearer introductory and onboarding flow.

The README should also explain the product model at a high level:

- deterministic commands define and enforce the repository contract
- agent-facing skills consume that contract for assisted workflows

Contributor-oriented details should still exist, but they should appear later in the document or be framed as secondary information compared to adoption and usage.

The final README should be easy to scan and should use examples generously, similar to the way the Prisma README quickly moves from product framing into practical usage.

Because this slice improves the public-facing presentation of the package, it should also add the standard metadata fields to `package.json` that help npm users and GitHub integrations understand the project:

- `author`
- `repository`
- `homepage`
- `bugs`
- `keywords`

Those fields should point to the canonical public GitHub repository and should use concise, relevant values for package discovery.

The same slice may also normalize the top-level manifest ordering so the public package information reads more cleanly, including placing `dependencies` before `devDependencies`.

## Examples

Example high-level README flow:

```text
1. Title and short product description
2. Quick links
3. What is specify-it?
4. Getting started
5. How specify-it works
6. Core commands
7. Configuration
8. Agent skills
9. Release or contributing information
```

Example quickstart section:

```bash
npm install -D specify-it
npx specify-it init
npx specify-it new --title="add social login"
npx specify-it check
npx specify-it print-config --json
```

## Acceptance Criteria

- `README.md` is restructured primarily for library users
- the top of the README clearly explains what `specify-it` is and why to use it
- the README includes a practical getting-started flow with the main public commands
- the README explains the relationship between deterministic commands and agent-facing skills
- `package.json` includes standard public metadata for author, repository, homepage, bugs, and keywords
- `package.json` uses a cleaner public-facing top-level field order
- important configuration and release information remain documented, but no longer dominate the opening sections
- the change is limited to documentation and package metadata
