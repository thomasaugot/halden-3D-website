# Halden

Halden is a concept website for a fictional private aviation company based in Geneva. The aircraft, prices and services are invented. The page is one long scroll: a continuous flight film, a route globe, the membership offer, a booking form and a landing.

## Stack

Vite 8, React 19, TypeScript 7, Tailwind v4 (CSS only, via `@tailwindcss/vite`), GSAP with ScrollTrigger, Lenis for smooth scroll, three.js for the globe, oxlint.

## Run it

```
npm install
npm run dev
npm run verify
```

`npm run verify` runs the typecheck, the linter and a production build into `node_modules/.cache/verify-build`. `npm run typecheck` and `npm run lint` run alone.

## Folder map

| Folder | What it holds |
|---|---|
| `src/app` | The root component: smooth scroll and the page layout |
| `src/styles` | Tailwind entry, theme tokens, base rules, animation and accessibility CSS |
| `src/components/layout` | Navbar, page loader, altimeter, footer with the landing film |
| `src/components/ui` | Small reusable pieces: brand mark, split-flap board, form field, film caption |
| `src/components/pages/home` | The home page and its sections |
| `src/hooks` | React hooks: portrait detection, film manifest, nav hiding, split-flap, booking form, stores |
| `src/lib` | GSAP and Lenis setup, the frame sequence player, the signal store primitive, the WebGL globe |
| `src/stores` | Shared signals: load progress, scene ready, active route, altimeter |
| `src/services` | Network access (the film manifests) |
| `src/utils` | Pure helpers, the logger and the GSAP scroll animations |
| `src/constants` | Copy and data: film beats, routes, aircraft, membership, contact |
| `src/types` | Shared TypeScript types |
| `public` | Static files: frame sequences, textures, photographs |
| `tools` | Offline scripts that make the footage, photographs and 3D model |

## How the film works

The flight is a chain of Gemini Omni clips. Each clip opens on the last frame of the one before, so the footage reads as one continuous camera move. `tools/video/chain.py` generates the clips and cuts each into numbered JPEG frames in `public/seq`, with a `manifest.json` that lists frame counts.

In the browser, `src/lib/frame-sequence.ts` plays those frames on a canvas from a 0 to 1 scroll position. It loads coarse to fine, so the whole timeline can be scrubbed early, and blends neighbouring frames so the motion reads as continuous. The section height follows the length of the footage.

Tall screens use a 9:16 portrait cut from `public/seq-portrait`, generated with `python3 tools/video/chain.py --portrait`. It needs `GEMINI_API_KEY`. If that folder is missing, the page falls back to the landscape cut.

## Tools

| Script | Purpose |
|---|---|
| `tools/video/chain.py` | Generates the chained clips and the frame sequences. Needs `GEMINI_API_KEY`. Raw clips are kept in `tools/video/raw` |
| `tools/images/generate.py` | Generates the site photographs into `public/images`. Needs `GEMINI_API_KEY` |
| `tools/blender/build_jet.py` | Builds the H7 jet model in Blender and exports a GLB |
