---
paths:
  - "src/components/**/*.tsx"
---

# React Component Rules

- Use function declarations (`export function Foo()`) not arrow function exports
- Define Props interface directly above the component, name it `{ComponentName}Props`
- Tailwind classes go directly in JSX className, no `cn()` utility or CSS modules
- Color scheme: slate-900 background, slate-800 cards, emerald/yellow/red for status indicators
- Use `space-y-*` for vertical spacing, `gap-*` for flex/grid layouts
- Transitions: `transition-all duration-75` for real-time audio feedback elements
