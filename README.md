# IMPOSSIBLE

Optical-illusion / perspective puzzle. Rotate a 2.5D isometric scene until disconnected platforms visually align into a walkable path, then walk it — if the seam is real.

**Not Smash Lab.** Original levels, no Matter.js physics, distinct branding.

## Stack

- Vite + TypeScript
- Canvas 2D renderer
- Pure sim under `src/sim/` (no DOM) for a future C# port
- Capacitor Android (`com.impossible.puzzle`)

## Scripts

```bash
npm install
npm run dev          # http://0.0.0.0:43201
npm test
npm run typecheck
npm run build
npm run icons        # sharp → public/ + store/icons
npm run android:sync # after `npx cap add android`
npm run android:bundle
```

## Play Console

See `store/PLAY.md` (Lounge Lizard, package `com.impossible.puzzle`, version 1.0.0 / versionCode 1).

Upload helpers (require gitignored `play-service-account.json`):

```bash
node scripts/play-upload-aab.mjs
node scripts/play-upload-listing.mjs --commit
```

## Privacy

`public/privacy/index.html` ships with the web build and is linked from the in-app Privacy screen.
