---
name: bundle-and-verify
description:
  Format, lint, test, and bundle TypeScript to dist/ — the full CI pipeline
  locally
disable-model-invocation: true
---

# Bundle and Verify

Runs the complete pre-commit pipeline for this GitHub Action:

1. **Format**: `npm run format:write` — Format all code with Prettier
1. **Lint**: `npm run lint` — Check code quality with ESLint
1. **Test**: `npm run test` — Run Jest tests with coverage badge generation
1. **Bundle**: `npm run package` — Transpile TypeScript to dist/ with Rollup

This matches the CI pipeline exactly. Use before committing to catch issues
locally and ensure CI doesn't block your PR.

## When to Use

- After editing files in `src/`
- Before creating a commit
- When CI reports dist/ is out-of-sync
- To verify you haven't broken tests or coverage

## Quick Run

Just invoke this skill:

```bash
/bundle-and-verify
```

It will run all four steps in sequence. If any step fails, stop and fix that
step first.
