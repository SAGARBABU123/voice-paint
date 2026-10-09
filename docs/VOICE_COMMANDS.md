# Voice Commands — Voice Over Paint

> Canonical baseline: [`../PROJECT_PLAN.md`](../PROJECT_PLAN.md) §6.

## Interaction loop

1. User activates the microphone control (explicit activation; no always-on).
2. A visible listening indicator appears.
3. Speech recognition returns text (Whisper engine by default).
4. Parser normalizes text and matches it to the command grammar.
5. Validator checks the operation and parameters.
6. **The understood command is shown in the transcript panel as a draft.**
   Nothing is applied yet.
7. User reviews the draft and presses **Enter** (or **Apply**) to run it.
8. Dispatcher invokes the **same** core action as manual controls.
9. UI reports success, clarification, unsupported intent, or failure.

This **review-then-apply** loop means a misheard command can never change the
painting without the user seeing it first (industry-standard safe pattern).

## Command catalogue

| Intent      | Example phrases                                    | Expected behavior                     |
| ----------- | -------------------------------------------------- | ------------------------------------- |
| Select tool | "use pencil", "switch to eraser", "choose ellipse" | Change active tool                    |
| Draw shape  | "draw a circle", "add a rectangle"                 | Draw a shape centred in the document  |
| Fill        | "fill it red", "fill it"                           | Flood-fill the centre with the colour |
| Set color   | "set color to red", "use blue"                     | Update active color                   |
| Set width   | "set brush size to 8", "make the brush smaller"    | Update validated width                |
| Undo        | "undo", "undo last action"                         | Undo one supported action             |
| Redo        | "redo", "restore last action"                      | Redo one supported action             |
| Clear       | "clear canvas"                                     | **Ask for confirmation first**        |
| Export      | "export PNG", "save as PNG"                        | Local PNG download + result           |
| Help        | "what can I say?", "show voice commands"           | Open command help                     |

## Compound commands

A phrase may contain several clauses joined by **and**, **then**, or **also**.
Each clause is parsed independently and the commands run in order through the
same engine path:

- "draw a circle and fill it with red color" → draw an ellipse, set the colour
  to red, then flood-fill inside it.
- "use blue then draw a rectangle" → set the colour, then draw a rectangle.

If **any** clause is unknown, the whole phrase fails with a message and nothing
is drawn — a partial command is never executed. Contradictory input such as
"undo and redo" is rejected as ambiguous.

## Multilingual (Telugu)

The parser accepts **English**, **Telugu script**, and **romanised Telugu**. The
typing and execution path is identical — only the spoken words differ:

- English: "draw a circle and fill it with red color"
- Telugu: "వృత్తం గీయి మరియు ఎరుపు నింపు"
- Romanised: "vrutham geyyi mariyu erupu nimpu"

Colours (ఎరుపు/erupu = red, నీలం/nilam = blue, …), tools
(వృత్తం/vrutham = circle, …), sizes, and actions (తుడిచి = clear, వెనక్కి =
undo, …) all map through the same allowlist. Telugu transcriptions must come
from a recogniser that can produce them — the Whisper Worker can; the browser
Web Speech API generally cannot.

> Behaviour change: "draw a circle" now **draws** a centred shape (previously it
> only selected the tool). Say "select circle" or just "circle" to only change
> the tool.

## Speech engines

The command grammar is identical for both engines — only recognition changes.

- **Browser Web Speech API** (default): Chromium/Edge only, English-focused,
  online, and has no reliable Telugu.
- **Whisper Worker** (set `VITE_WHISPER_ENDPOINT` in `.env`): the app records a
  short clip and a Cloudflare Worker transcribes it with
  `whisper-large-v3-turbo`. Works in Chrome, Edge, Firefox, and Safari; handles
  Telugu (pass `VITE_WHISPER_LANGUAGE=te`). **Audio leaves the device** and is
  processed by Cloudflare — say so in the UI. See
  [`whisper-worker/README.md`](../whisper-worker/README.md) for deployment.

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
  | { ok: true; commands: PaintCommand[] }
  | { ok: false; reason: 'unknown' | 'ambiguous' | 'missing_parameter'; message: string }
```

A phrase may resolve to more than one command (for example "use the red brush"
sets the colour _and_ the tool), so the parser returns a list. The allowlisted
`PaintCommand` union is defined in `src/voice/types.ts`.

Failures must produce a helpful message and **must not** mutate the drawing.

## Implementation (Milestone 2)

| Stage                           | File                                         |
| ------------------------------- | -------------------------------------------- |
| Speech adapter (Web Speech API) | `src/voice/adapters/BrowserSpeechAdapter.ts` |
| Grammar / aliases / examples    | `src/voice/grammar.ts`                       |
| Parser                          | `src/voice/parser.ts`                        |
| Validator                       | `src/voice/validator.ts`                     |
| Dispatcher (same engine path)   | `src/voice/dispatcher.ts`                    |
| React wiring                    | `src/hooks/useVoiceCommands.ts`              |
| Voice UI                        | `src/components/voice/VoicePanel.tsx`        |

Only **final** transcripts are dispatched. Interim results are shown but never
executed. `canvas.clear` is returned as `pending` and only runs after the user
confirms in `ConfirmDialog`.
