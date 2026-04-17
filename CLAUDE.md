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

## Git Workflow

- ISSUEに取り組む際は必ず専用ブランチを切る
- ブランチ命名: `feature/issue-{番号}-{概要}` or `fix/issue-{番号}-{概要}`
- mainブランチへの直接コミットは禁止

## デバッグの原則

> 推測で直すな、観測して切り分けろ。

このプロジェクトでメトロノームの音が出ないバグを修正した際、もっともらしい仮説に飛びつき3回空振りした。最終的に解決できたのは「素のHTMLでは鳴る／Reactアプリでは鳴らない」という対照実験で問題領域を絞れたから。

### やるべきこと

1. **最小再現を作る** — 問題をアプリから切り離した最小コードで再現できるか試す。これが対照群になる
2. **実際の実行フローを手で追う** — 特にReactでは `setState` → 再レンダー → useEffect cleanup/再実行 の連鎖を追わないと、オブジェクト再生成による意図しない副作用を見落とす
3. **差分で考える** — 「動くコード」と「動かないコード」の差異は何か？に集中する

### やってはいけないこと

1. **有名な原因に飛びつく** — 「Autoplay Policyだろう」「ゲインが小さいのだろう」と推測で修正して確認を怠らない
2. **UIの状態変化だけで判断する** — ボタンが切り替わった＝動いている、ではない。特に音声・ネットワーク等の副作用は別途確認が必要
3. **1回の修正で複数の仮説を混ぜる** — 切り分けができなくなる

### このプロジェクト固有の注意点

- **Web Audio API + React**: AudioContextはユーザージェスチャーの同期コールスタック内で生成・resumeする必要がある。`setState` による再レンダーを挟むとジェスチャーコンテキストが切れる
- **useCallbackの返り値オブジェクト**: hook内の各関数が `useCallback` で安定していても、返り値のオブジェクトリテラル自体は毎レンダーで新規生成される。依存配列にオブジェクトごと入れるとeffectが毎回再実行される → `useMemo` で安定化するか、refで参照する
