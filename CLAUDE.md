# Bass Practice App

Real-time bass guitar practice tool with pitch detection, built with React + TypeScript + Vite.

## Quick Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Type-check (tsc -b) + production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

## Tech Stack

- **Framework**: React 19 + TypeScript 6 + Vite 8
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **Routing**: react-router-dom v7
- **Audio**: Web Audio API + [pitchy](https://github.com/ianprime0509/pitchy) for pitch detection
- **Music Theory**: [tonal](https://github.com/tonaljs/tonal) for MIDI/note conversion
- **Testing**: Vitest + Testing Library

## Architecture

```
src/
  components/audio/   # UI components (AudioSetup, AudioMeter, PitchDisplay)
  hooks/              # React hooks (useAudioInput, usePitchDetection)
  lib/audio/          # Core audio logic (AudioEngine, PitchAnalyzer) - no React deps
  types/              # Shared TypeScript types (audio, music, practice)
```

### Key Patterns

- **Separation of concerns**: `lib/` contains pure logic classes, `hooks/` bridges them to React, `components/` handles rendering
- **AudioEngine** wraps Web Audio API (AudioContext, AnalyserNode, MediaStream) - instantiated per session, not a singleton
- **PitchAnalyzer** uses pitchy's autocorrelation detector with configurable clarity threshold (default 0.9)
- **Bass frequency range**: 30-500 Hz hardcoded in PitchAnalyzer
- **Pitch display**: Uses hold duration (200ms) to avoid flicker when signal drops briefly

## Conventions

- Functional components only, no class components
- Custom hooks for all stateful logic
- Props interfaces defined inline above component (not exported separately unless shared)
- Tailwind utility classes directly in JSX, no separate CSS files
- Named exports for components, default export only for App
- Use `type` imports for type-only imports (`import type { ... }`)
- Sharps notation for notes (C#, not Db) - consistent with tonal library defaults
