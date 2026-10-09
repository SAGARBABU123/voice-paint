# Voice Over Paint

A browser-based painting app with a small, deterministic voice-command MVP.

> **Promise:** "Draw naturally. Stay in control."

The canonical product/engineering baseline is [`PROJECT_PLAN.md`](./PROJECT_PLAN.md).
AI-assisted development rules live in [`SKILL.md`](./SKILL.md).
Both are locked decisions — do not change them silently.

## Status

| Milestone             | Scope                                         | State   |
| --------------------- | --------------------------------------------- | ------- |
| M0 — Foundation       | Editor shell, toolchain, quality gates        | ✅ Done |
| M1 — Manual drawing   | Canvas, tools, history, PNG export            | ✅ Done |
| M2 — Voice MVP        | Speech adapter, parser, validator, dispatcher | ✅ Done |
| M3 — UX & reliability | A11y, errors, E2E                             | ✅ Done |
| M4 — Release          | Docs, CI, static deploy                       | ✅ Done |

**Post-MVP (P1):** Phase 5 — local project persistence ✅ (IndexedDB autosave &
restore). Next: image import + view controls, text/fill, recent colours,
cross-browser E2E.

## Stack (locked)

React · TypeScript (strict) · Vite · Tailwind CSS · Canvas 2D · Web Speech API ·
Vitest + React Testing Library · ESLint + Prettier · no backend.

## Scripts

| Command                | Purpose                       |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Start the dev server          |
| `npm run build`        | Type-check + production build |
| `npm run preview`      | Preview the production build  |
| `npm run typecheck`    | `tsc -b`                      |
| `npm run lint`         | ESLint                        |
| `npm run format`       | Prettier write                |
| `npm run format:check` | Prettier check                |
| `npm test`             | Vitest (watch)                |
| `npm run test:run`     | Vitest (single run)           |
| `npm run test:e2e`     | Build + Playwright E2E        |

## Testing

- **Unit / component:** Vitest + React Testing Library (`npm run test:run`).
- **End-to-end:** Playwright against the production build (`npm run test:e2e`).
  Install browsers once with `npx playwright install chromium` (on a fresh Linux
  host you may also need `npx playwright install-deps chromium`).

## Keyboard shortcuts

`P`/`B` pencil · `E` eraser · `L` line · `R` rectangle · `O` ellipse ·
`-`/`+` brush size · `Ctrl/Cmd+Z` undo · `Ctrl/Cmd+Shift+Z` redo ·
`Ctrl/Cmd+S` export PNG · `?` toggle the shortcuts panel.

## Documentation

- [`docs/USAGE.md`](./docs/USAGE.md) — how to draw, use voice, and shortcuts
- [`docs/BROWSERS.md`](./docs/BROWSERS.md) — supported browsers & limitations
- [`docs/RELEASE.md`](./docs/RELEASE.md) — build, deploy, CI, release checklist
- [`docs/PRODUCT_SPEC.md`](./docs/PRODUCT_SPEC.md) — scope, users, scenarios
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — boundaries and data flow
- [`docs/VOICE_COMMANDS.md`](./docs/VOICE_COMMANDS.md) — command catalogue & safety
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — milestones

## Deploy

The build is a fully static site — no backend, database, or secrets. Run
`npm run build` and serve `dist/` from any static host. See
[`docs/RELEASE.md`](./docs/RELEASE.md).

## Known limitations (MVP)

- Voice depends on the browser Web Speech API and a secure context; it is best
  supported in Chrome/Edge and unavailable in Firefox. Manual drawing always works.
- No image import/open yet (PNG export only), no transparency, and no layers,
  text, or filters.
- The eraser paints the background colour; **Clear is not undoable** (it is
  confirmed first).
- Voice uses a fixed grammar with no natural-language understanding; unknown
  phrases return a message and never change the canvas.
- No backend, accounts, analytics, cloud sync, or server-side storage.
