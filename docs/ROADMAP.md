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
  grammar; no LLM.
- **Phase 12 — English grammar (synonyms/slang) ✅** — expanded English aliases
  ("make a circle", "draw me a rectangle and fill it blue", "bucket it", …)
  so casual phrasing maps to the same allowlisted commands. Multilingual/Telugu
  aliases were removed at the user's request — recognition is English by
  default (`VITE_WHISPER_LANGUAGE=en`).
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
- **Phase 16 — Vault UI design system refresh ✅** — vendored the Vault tokens,
  button and primitive CSS, added token-driven `Button`/`Badge`/`Card`/`Icon`/
  `Toast` primitives, and restyled the whole app: a proper app header and status
  footer, grouped toolbar, polished canvas well, restyled voice panel, and
  Vault-styled confirm/resize dialogs + toasts (replacing native
  `window.confirm`/`alert`). Follow-up polish: dot-grid workspace mat with a
  paper-shadowed document sheet, micro-caps toolbar group labels and a custom
  colour chip, header brand accent + document size read-out, voice unsupported
  empty-state and a listening level meter, plus `prefers-reduced-motion`
  support. Follow-up: live cursor X/Y read-out in the status bar and
  MS-Paint-style brush/font-size presets, plus a header-shell layout: brand +
  a horizontally-scrollable creative shelf (freeform tools · big shapes group ·
  colour · size presets · recents) with generous group gaps, a slim
  document/history/export row, plus pro interactions:
  brush-size cursor ring, Shift-lock straight lines and perfect shapes, keyboard
  Delete/Escape on the selection, drag-and-drop image import, JPEG export,
  window-resize refit, and an autosave-restore skeleton. The canvas promoted to
  the hero workspace with a richer empty state. Theme library: `data-theme`
  combos in `src/design/themes.css` — generic gradient chrome (header strip,
  logo tile, primary buttons, workspace mat, app wash) driven by per-theme
  gradient variables; combos:
  Ocean (white + blue → cyan → teal · active), Midnight (dark studio +
  cyan → violet glow), Sunset (magenta → coral → amber), Emerald
  (teal → green), Aurora (indigo → violet → rose), and Warm paper
  (default). A header ThemeSwitcher cycles them live and remembers the choice. Typography:
  a single Inter type scale (11/13/15/17px tokens) replaces ad-hoc sizes, with
  display-family headings, tight tracking, tabular numerals and optimized
  rendering. The Ocean theme is locked as the base default (gradients in the
  core tokens, no attribute required); alternate combos including the legacy
  Warm paper stay switchable via the header ThemeSwitcher. Brand signature:
  transparent artist-palette mark (gradient body, thumb-hole, four paint dots)
  matching the favicon — no background tile or shape. Workspace & tools: the header slimmed to brand + switcher + shortcuts,
  and the full kit (tools, a 23-shape MS-Paint gallery incl. arrows, stars,
  callouts, heart, lightning; colour, size, recents) lives in a vertical rail
  beside the sheet that collapses to tool icons and expands on hover/focus.
  Open/export folded into one Export menu (PNG/JPEG). Canvas uses a normal
  cursor; the empty-state hint is pinned to the visible centre. Sketch trace:
  upload a photo via the Export menu → grayscale → proper computer-vision
  edge detection (OpenCV.js: Canny → findContours → approxPolyDP) → real
  hand-drawn pencil strokes rendered by rough.js (fixed seed, undoable as
  one step, follows the current colour/pen style) and revealed stroke-by-
  stroke with a pen cursor that skims the sheet (hand write-order, pen-lift
  pauses). Five sketch pencils (pencil, charcoal, colour-pencil, ink, hatch)
  with weight (lighter/normal/darker) and detail (simpler/normal/more) knobs
  are selectable in the rail and by voice. The OpenCV engine
  (~15 MB WASM, browser-cached) lazy-loads on first conversion; the pure
  geometry core (paint/sketch.ts, paint/roughSketch.ts) stays
  unit-testable without the engine. Behaviour, tests, and accessibility
  unchanged.
