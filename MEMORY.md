# MEMORY.md

## Project state

- Halden is a concept website for a fictional private aviation company in Geneva. Deployed.
- Repo: github.com/thomasaugot/halden-3D-website
- Stack: Vite 8, React 19, TypeScript 7, Tailwind v4, GSAP, Lenis, three.js, oxlint. Typecheck is `npx tsc -b`. Full check is `npm run verify`.
- The source follows the house structure: `app`, `styles`, `components/{layout,ui,pages}`, `hooks`, `lib`, `stores`, `services`, `utils`, `constants`, `types`. Imports use the `@/` alias for `src/`.

## Route

A single page. Sections and their ids, in order:

| Id | Section |
|---|---|
| `hero` | The flight film, pinned. Holds the anchors `aircraft` and `cabin` inside it |
| `routes` | The route globe and the departure board |
| `descent` | Wrapper for the two sections below, drives the altimeter descent |
| `membership` | Charter, jet card and share |
| `book` | The booking form |
| `landing` | The landing film and the sign-off (the footer) |

## Design tokens

| Token | Hex | Use |
|---|---|---|
| contrail | #eef2f6 | Daylight ground, night text |
| stratos | #0d1424 | Day text, night panels |
| haze | #4e5a6c | Secondary text by day |
| mist | #a9b4c4 | Secondary text by night |
| cobalt | #2340c8 | The livery colour, the only accent |
| cobalt-hi | #8fa2ff | The accent lifted for dark sky |

The page switches between day and night with `data-sky` on the root element.

Fonts: Archivo Variable at stretch 112% and weight 420 for display, Instrument Sans for body, IBM Plex Mono for data.

## Open items

- The portrait 9:16 cut is blocked by Gemini billing (HTTP 402). Until `public/seq-portrait` exists, tall screens use the landscape frames.
