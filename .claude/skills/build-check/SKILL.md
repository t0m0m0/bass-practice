---
name: build-check
description: Run full build pipeline (type-check + lint + build) to verify code health. Use before committing or after significant changes.
disable-model-invocation: true
allowed-tools: Bash(npm run build) Bash(npm run lint)
---

# Build Check

Run the full verification pipeline and report results:

1. Run `npm run lint` - check for ESLint violations
2. Run `npm run build` - runs TypeScript type-check (`tsc -b`) then Vite production build
3. If any step fails, analyze the errors and fix them
4. Report a summary of results: pass/fail status for each step

## On Failure
- TypeScript errors: fix type issues, don't use `any` or `@ts-ignore` as workarounds
- ESLint errors: fix the violations, don't disable rules inline unless there's a legitimate reason
- Build errors: check for missing imports, circular dependencies, or Vite config issues
