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

## Milestone 4 — MVP release ⏳

README, usage guide, supported-browser note, known limitations · production build
and smoke tests.
**Acceptance:** deployable static site, no required server, documented
limitations, passing quality gates.

## Post-MVP (P1) — requires explicit approval

PNG/JPEG import · text tool · fill/crop/rotate/resize/zoom · improved selection ·
recent colors · IndexedDB persistence · full cross-browser E2E.
