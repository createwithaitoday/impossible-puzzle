# Google Play listing — IMPOSSIBLE

Developer account: Lounge Lizard Personal, `6155776633763969971`, signed in as jyefulton@gmail.com. No Vanta Works account, branding, or signing identity is used.

Package: `com.impossible.puzzle`  
App name: IMPOSSIBLE  
Version name: **1.0.0**  
Version code: **1**

Create the Play Console app under Lounge Lizard if it does not exist yet, then paste the app id here.

## Build

- App name: IMPOSSIBLE
- Package: `com.impossible.puzzle`
- Version name: 1.0.0
- Version code: 1
- Target SDK: 36 (Capacitor default). min SDK: 24
- Free app. No in-app products in 1.0.0.
- Default language: English (en-US)
- Category: Game / Puzzle

## Store text

Title: IMPOSSIBLE

Short description:

Rotate illusions until broken platforms become a path.

Full description:

IMPOSSIBLE is an optical-illusion perspective puzzle.

Rotate a 2.5D scene until disconnected platforms visually align into a walkable path. Then walk it — if the seam is real. False alignments, decoy edges, and timed rotates escalate across fifteen handcrafted rooms.

Progress stays on the device.

## Assets

- `store/feature-graphic.png` — 1024×500
- `store/icons/` — Play / Android density PNGs from `npm run icons`
- Phone screenshots: add under `store/screenshots/` before `play:listing`

## Upload

Service account JSON (gitignored): `play-service-account.json` at repo root.

```bash
npm run build
npm run android:bundle
node scripts/play-upload-aab.mjs
node scripts/play-upload-listing.mjs --commit
```

Upload keystore paths and passwords stay outside git (`*.jks`, `android/keystore*`, `local.properties`).

## Privacy

In-app screen + `public/privacy/index.html`. Host or ship the HTML with the web build.
