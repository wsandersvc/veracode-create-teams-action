---
name: test-action-locally
description: Test the GitHub Action locally using @github/local-action with .env
disable-model-invocation: true
---

# Test Action Locally

Launches a local action environment for testing the Veracode Create Teams action
without CI:

1. Verifies `.env` exists (copies from `.env.example` if needed)
1. Runs `npm run local-action` to test `src/main.ts` entry point
1. Displays logs for debugging team creation/update logic

This uses the `@github/local-action` testing harness to simulate a real GitHub
Actions environment.

## Setup

Before first use, configure your `.env` file:

```bash
cp .env.example .env
# Edit .env and add your real or test credentials:
# GITHUB_TOKEN=ghp_...
# VERACODE_API_ID=...
# VERACODE_API_KEY=...
```

## When to Use

- Testing team creation/update logic locally
- Verifying config resolution for specific repositories
- Debugging API interactions before running full CI
- Validating YAML schema and team mapping changes

## Quick Run

```bash
/test-action-locally
```

Check the output in `local-action-output.log` for detailed results.

## Example Output

```text
[info] Repository: owner/repo
[info] Config: owner/veracode/team-mapping.yaml (ref: main)
[info] Region: US
[info] Clients initialized successfully
[info] Configuration loaded and validated
```
