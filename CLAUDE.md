# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

## Architecture

This is a minimal React 19 + Vite app. Entry point is `src/main.jsx`, which mounts `src/App.jsx` into `#root` in `index.html`.

- The project mixes `.jsx` and `.tsx` files — ESLint currently only covers `*.{js,jsx}` (not `.tsx`), so TypeScript files won't be linted.
- `no-unused-vars` is configured to ignore variables matching `^[A-Z_]` (uppercase/underscore-prefixed names).
