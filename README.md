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
| M4 — Release          | Docs, CI, static deploy                       | ⏳ Next |

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

- [`docs/PRODUCT_SPEC.md`](./docs/PRODUCT_SPEC.md) — scope, users, scenarios
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — boundaries and data flow
- [`docs/VOICE_COMMANDS.md`](./docs/VOICE_COMMANDS.md) — command catalogue & safety
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — milestones

## Known limitations (MVP)

- Voice depends on browser Web Speech API support; availability varies.
- No backend, accounts, cloud sync, or server-side storage.
- Manual drawing must remain fully usable when voice is unavailable or denied.
