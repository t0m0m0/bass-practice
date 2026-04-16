---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
---

# Testing Rules

- Use Vitest (`import { describe, it, expect } from 'vitest'`)
- Use Testing Library for component tests (`@testing-library/react`)
- Web Audio API and MediaDevices must be mocked in tests (not available in jsdom)
- Test file lives next to the module it tests: `Foo.tsx` -> `Foo.test.tsx`
- Prefer `userEvent` over `fireEvent` for user interaction tests
