---
name: project-contributing-engine
description: CONTRIBUTING.md generation engine — module layout, sections, templates, and CLI command
metadata:
  type: project
---

`src/contributing/` — 12-file module for generating CONTRIBUTING.md

**Why:** Open-source contributors need a structured, project-adapted guide.
**How to apply:** When asked to extend or debug the contributing generator.

## Structure
- `types.ts` — ContributingContext, ContributingOptions, ContributingResult, SectionRenderer
- `context.ts` — buildContributingContext (scans repo, detects tooling, infers cmds)
- `renderer.ts` — renderContributing, registerSection, buildTableOfContents
- `sections/intro.ts` — welcome + license note
- `sections/setup.ts` — prerequisites + fork/clone/install/dev steps
- `sections/workflow.ts` — branching strategy + commit convention (conventional or generic)
- `sections/pr-guidelines.ts` — checklist + PR description guide + review process
- `sections/coding-standards.ts` — TS / lint / format / test / git hooks gates
- `sections/repo-structure.ts` — top-level dir tree with annotations
- `sections/index.ts` — ALL_SECTIONS registry
- `templates/index.ts` — default | minimal | library | app
- `index.ts` — generateContributing(root, opts) high-level helper

## CLI command
`src/commands/contributing.ts` → `docsmith contributing [root]`
Flags: --template, --output, --skip-analysis, --min-confidence, --list-templates, --dry-run
Registered in `src/commands/index.ts`.

## Key detection logic (context.ts)
- commitConvention: checks @commitlint/* deps + commitlint config files → "conventional" | "unknown"
- hasLinting: eslint config OR @biomejs/biome dep OR lint script
- hasFormatting: prettier config OR @biomejs/biome dep OR format script
- hasTests: vitest/jest config OR test script
- hasCi: ci-type config file (github workflows, circleci, etc.)
- hasGitHooks: husky | lint-staged | lefthook in deps
