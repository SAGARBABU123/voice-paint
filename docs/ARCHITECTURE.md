# Architecture — Voice Over Paint

> Canonical baseline: [`../PROJECT_PLAN.md`](../PROJECT_PLAN.md) §8–§10.

## Data flow

```text
React UI
  ├── Toolbar / Color / Size / Status / Voice panel
  ├── Manual input adapters (pointer + keyboard)
  └── Voice UI
        └── SpeechRecognitionAdapter
              └── Transcript
                    └── CommandParser
                          └── CommandValidator
                                └── CommandDispatcher
                                      └── PaintEngine
                                            ├── Document / active tool
                                            ├── Renderer
                                            ├── Operation history
                                            └── Export service
```

## Boundaries (hard rules)

- **UI** displays state and dispatches intents; it does not own drawing
  algorithms.
- **Speech adapter** only captures speech and emits lifecycle/results; it never
  mutates canvas state.
- **Parser** maps transcript text → typed command or structured failure; it never
  executes.
- **Validator** checks command names, parameters, ranges, and policy.
- **Dispatcher** routes valid commands to the _same_ engine methods used by
  toolbar and keyboard.
- **Paint engine** owns drawing state and operation history.
- **Renderer** turns document state into pixels.
- **Export service** handles serialization/download and is separate from React.
- No second, voice-only implementation of any action.

## Repository map (grows with real responsibility)

```text
src/
├── app/                     App entry
├── design/                  Vendored Vault UI theme: tokens.css (warm paper +
│                            indigo), button.css, primitives.css, Inter fonts
├── components/
│   ├── editor/              App shell (header/footer), status bar, help
│   ├── toolbar/             Tool & option controls
│   ├── canvas/              Canvas workspace, view controls
│   ├── ui/                  Token-driven primitives: Button, Badge, Card,
│   │                        Icon, Toast, ConfirmDialog, ResizeDialog
│   └── voice/               Mic control, transcript, help
├── paint/                   engine, renderer, tools, history, export,
│                            transforms, text, fill, selection, image
│                            import, sketch trace (OpenCV.js contour
│                            pipeline in sketchImage.ts + opencv.ts,
│                            rough.js rendering in roughSketch.ts,
│                            pure geometry in sketch.ts, sketch pencil
│                            presets in sketchStyles.ts)
├── voice/                   adapters, parser, types
├── hooks/
├── types/
└── test/                    Test setup
docs/
├── PRODUCT_SPEC.md
├── ARCHITECTURE.md
├── VOICE_COMMANDS.md
└── ROADMAP.md
```

Folders are introduced only when they hold real code — not to match the diagram.

## Core contracts (illustrative, from the plan)

```ts
type PaintTool = 'pencil' | 'eraser' | 'line' | 'rectangle' | 'ellipse'

type PaintCommand =
  | { type: 'tool.select'; tool: PaintTool }
  | { type: 'color.set'; color: string }
  | { type: 'brush.size.set'; size: number }
  | { type: 'history.undo' }
  | { type: 'history.redo' }
  | { type: 'canvas.clear' }
  | { type: 'canvas.export'; format: 'png' }
  | { type: 'help.open' }

type CommandParseResult =
  | { ok: true; command: PaintCommand }
  | { ok: false; reason: 'unknown' | 'ambiguous' | 'missing_parameter'; message: string }
```

## UI layer

The visual language is the **Vault UI design system** (warm-paper neutrals, a
single indigo accent, tight radii, light-from-above elevation, 4px spacing
grid), vendored rather than installed so the app keeps zero runtime UI
dependencies. `src/design/tokens.css` exposes the theme as Tailwind v4 tokens;
`src/design/*.css` carry the kit's button/primitive classes; `src/components/ui`
wraps them as typed React primitives. All screens compose those primitives — no
ad-hoc colour, radius or shadow literals — so the look stays consistent and can
be re-branded from one token block. Light theme only; desktop is the primary
layout.

## Decision record

Web-only MVP · browser speech recognition first · small MVP first · no backend ·
React + TypeScript + Vite + Tailwind · Canvas 2D · deterministic allowlisted
commands routed through the shared engine · Vault UI design system for visuals.
