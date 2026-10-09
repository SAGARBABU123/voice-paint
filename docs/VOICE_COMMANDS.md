# Voice Commands — Voice Over Paint

> Canonical baseline: [`../PROJECT_PLAN.md`](../PROJECT_PLAN.md) §6.

## Interaction loop

1. User activates the microphone control (explicit activation; no always-on).
2. A visible listening indicator appears.
3. Speech recognition returns text.
4. Parser normalizes text and matches it to the command grammar.
5. Validator checks the operation and parameters.
6. App previews/confirms when needed (destructive actions).
7. Dispatcher invokes the **same** core action as manual controls.
8. UI reports success, clarification, unsupported intent, or failure.

## Command catalogue

| Intent      | Example phrases                                    | Expected behavior              |
| ----------- | -------------------------------------------------- | ------------------------------ |
| Select tool | "use pencil", "switch to eraser", "choose ellipse" | Change active tool             |
| Set color   | "set color to red", "use blue"                     | Update active color            |
| Set width   | "set brush size to 8", "make the brush smaller"    | Update validated width         |
| Undo        | "undo", "undo last action"                         | Undo one supported action      |
| Redo        | "redo", "restore last action"                      | Redo one supported action      |
| Clear       | "clear canvas"                                     | **Ask for confirmation first** |
| Export      | "export PNG", "save as PNG"                        | Local PNG download + result    |
| Help        | "what can I say?", "show voice commands"           | Open command help              |

## Safety rules

- Treat transcripts as untrusted input.
- Never use `eval`, `Function`, generated code, or dynamic function lookup.
- Use a fixed command registry/allowlist and typed payloads.
- Never pass speech directly to canvas or DOM APIs.
- Reject invalid values; clamp only per documented limits.
- Require confirmation for destructive actions.
- Never treat silence, partial, or low-confidence/ambiguous input as a command.
- Do not claim recognition is available before feature detection + permission.
- Handle permission denial, unavailable mic, unsupported browser, no speech,
  network/service errors, and cancellation.
- No always-on listening in the MVP.
- Do not persist transcripts/audio by default.
- Browser speech availability and network requirements vary — say so plainly.

## Parser result contract

```ts
type CommandParseResult =
  | { ok: true; command: PaintCommand }
  | { ok: false; reason: 'unknown' | 'ambiguous' | 'missing_parameter'; message: string }
```

Failures must produce a helpful message and **must not** mutate the drawing.
