# Roadmap — Voice Over Paint

> Canonical baseline: [`../PROJECT_PLAN.md`](../PROJECT_PLAN.md) §13.

## Milestone 0 — Foundation ✅

Confirm feature list and command grammar · set up React + TS + Vite + Tailwind +
lint/format/tests · basic editor shell.
**Acceptance:** clean install; dev, typecheck, lint, and test commands all pass.

## Milestone 1 — Manual drawing ✅

Canvas scaling + coordinate mapping · pencil, eraser, line, rectangle, ellipse ·
color and width · undo/redo · PNG export · clear with confirmation.
**Acceptance:** each P0 manual action works consistently and its core logic is
tested.

## Milestone 2 — Voice MVP ✅

Speech adapter + permission/support states · parser, validator, command registry ·
P0 voice commands · clear-confirmation flow.
**Acceptance:** voice and manual share one engine path; unsupported phrases never
change the canvas.

## Milestone 3 — UX & reliability ✅

Help panel, tooltips, status messages, keyboard access · error handling and
browser checks · E2E for primary flows.
**Acceptance:** a user can complete a drawing with voice unavailable and recover
cleanly from voice errors.

## Milestone 4 — MVP release ✅

README, usage guide, supported-browser note, known limitations · production build
and smoke tests.
**Acceptance:** deployable static site, no required server, documented
limitations, passing quality gates.

## Post-MVP (P1) — requires explicit approval

- **Phase 5 — Local project persistence ✅** — autosave and restore via
  IndexedDB.
- **Phase 6 — Image import & view controls ✅** — open PNG/JPEG (scaled to fit),
  zoom, pan, fit, actual size.
- **Phase 7 — Document transforms ✅** — rotate, crop, and resize (all undoable).
- **Phase 8 — Text, fill, selection/move ✅** — text placement with font size,
  flood fill, and rectangular marquee move/cut (all undoable).
- **Phase 9 — Recent colours, palette polish, cross-browser E2E ✅** — recent
  swatches (persisted locally), a current-colour chip, and Playwright projects
  for Chromium, Firefox, and WebKit.
- **Phase 10 — Reliability & accessibility hardening ✅** — per-browser E2E
  scripts (Chromium and Firefox verified locally; WebKit runs in CI where its
  system libraries are installed), modal focus trapping with focus restoration,
  and keyboard-only E2E coverage for the P1 tools. No new product surface;
  deferred features remain deferred.
- **Phase 11 — Compound voice commands (English) ✅** — clause splitting on
  "and/then/also", new allowlisted `shape.draw` and `canvas.fill` intents, and a
  shared-engine route so "draw a circle and fill it red" works. Deterministic
  grammar; no LLM. Multilingual (Telugu) and packaging remain later phases.
- **Phase 12 — Telugu / multilingual grammar ✅** — Telugu script and romanised
  aliases for tools, colours, sizes, actions, and connectors, with Unicode-safe
  normalization ("వృత్తం గీయి మరియు ఎరుపు నింపు" and "vrutham geyyi mariyu erupu
  nimpu" both parse). Same allowlisted commands.
- **Phase 13 — Whisper speech engine ✅** — a standalone Cloudflare Worker
  (`whisper-worker/`) using Workers AI `whisper-large-v3-turbo`, plus a
  `WhisperSpeechAdapter` behind the existing adapter interface. Enabled by
  setting `VITE_WHISPER_ENDPOINT`; the browser Web Speech API stays as fallback.
  The parser, validator, and dispatcher are unchanged.
- **Phase 14 — PWA packaging ✅** — web app manifest, icons (192/512/maskable),
  and a service worker so the app installs and works offline. Native wrappers
  (Tauri/Capacitor) remain documented options, not implemented.
- **Phase 15 — Deploy & release pipeline ✅** — GitHub Actions deploys the app
  to Cloudflare Pages and the Whisper worker via `wrangler`; release checklist
  updated.
