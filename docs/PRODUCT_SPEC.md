# Product Spec — Voice Over Paint

> Canonical baseline: [`../PROJECT_PLAN.md`](../PROJECT_PLAN.md). This file is a
> working summary; the plan wins on conflicts.

## Vision

A browser-based painting application that lets people create and edit simple
images using familiar manual controls **and** a carefully bounded set of natural
voice commands. It is not an attempt at full Microsoft Paint parity, and it does
not use an LLM in the command path.

## Goals (MVP)

- Polished, responsive painting workspace in a modern browser.
- Mouse, keyboard, and (where practical) touch input.
- Tools: pencil/freehand brush, eraser, line, rectangle, ellipse.
- Color palette + custom color, brush/line width.
- Undo/redo for supported operations.
- Browser speech recognition behind a replaceable adapter.
- Recognized phrases map to a small, explicit, validated command set.
- Visible listening / transcript / result / error states.
- Local PNG export; manual workflow never requires a microphone.
- No backend, no account.
- Automated tests for parsing, validation, history, and core drawing logic.

## Non-goals (MVP)

OS-default replacement, native packaging, public SDK, accounts, cloud sync,
collaboration, server storage, LLM/natural-language reasoning, generative
images, full Paint parity, guaranteed offline speech, layers/vector/animation.

## P0 — required for first usable release

Editor layout · freehand pencil/brush · eraser · line/rectangle/ellipse ·
foreground color + custom color · brush/line width · undo/redo · clear with
confirmation · PNG export · speech adapter with permission/support states ·
voice commands for tool/color/size/undo/redo/clear/export/help · manual fallback ·
unit tests · keyboard access + basic responsiveness.

## P1 — after P0 is stable

Open/import PNG & JPEG · text tool · fill/crop/rotate/resize/zoom · improved
selection/move · recent colors · voice help panel · IndexedDB persistence ·
cross-browser E2E.

## Principles

1. Manual controls are first-class.
2. Commands are explicit and testable.
3. Never silently guess a risky action.
4. Show system state.
5. Local-first.
6. Accessible by default.
7. UI separated from the drawing core.

## MVP success measures

Draw and export without instructions · every documented phrase is predictable in
supported browsers · unknown phrases never draw · undo/redo restores expected
state · full manual workflow without microphone permission · deployable as a
static site with no required backend.
