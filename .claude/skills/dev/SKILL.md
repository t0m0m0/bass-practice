---
name: dev
description: Start the development server and verify the app runs correctly. Use when beginning a development session or after making changes that need visual verification.
disable-model-invocation: true
allowed-tools: Bash(npm run dev) Bash(npx vite *) Bash(lsof -i *)
---

# Start Development Server

1. Check if port 5173 is already in use: `lsof -i :5173`
2. If occupied, kill the existing process or use a different port
3. Start the dev server: `npm run dev`
4. Report the local URL to the user
5. If there are build errors, diagnose and fix them before reporting success

## Notes
- The dev server uses Vite with HMR (hot module replacement)
- Tailwind CSS is processed via the `@tailwindcss/vite` plugin
- Audio features require HTTPS or localhost (browser security policy)
