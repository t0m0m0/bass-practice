---
name: new-feature
description: Guided workflow for adding a new feature to the bass practice app. Ensures proper architecture and testing.
disable-model-invocation: true
argument-hint: "[feature description]"
allowed-tools: Bash(npm run *) Read Grep Glob Edit Write
---

# New Feature: $ARGUMENTS

Follow this workflow to implement the feature:

## 1. Plan
- Identify which layers need changes (types, lib, hooks, components)
- Check existing types in `src/types/` for reusable interfaces
- Check existing hooks and lib modules for reusable logic

## 2. Implement (bottom-up)
- **Types first**: Add/extend interfaces in `src/types/`
- **Library logic**: Pure TypeScript classes/functions in `src/lib/` (no React)
- **Hooks**: React hooks in `src/hooks/` that bridge lib logic to React state
- **Components**: UI components in `src/components/` using the hooks

## 3. Integrate
- Wire the new feature into `App.tsx` or the appropriate page
- Ensure the feature works with existing audio pipeline if relevant

## 4. Verify
- Run `npm run build` to check types and build
- Run `npm run lint` to check code style
- Start dev server and test the feature in browser if UI was changed

## Architecture Reminder
- `lib/` = pure logic, no React dependencies
- `hooks/` = React bridge layer, manages state and effects
- `components/` = presentational, receives data via props
- Keep audio processing in `lib/audio/`, music theory in `lib/music/` (create if needed)
