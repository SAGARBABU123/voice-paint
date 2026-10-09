# Voice Over Paint --- Product & Engineering Plan

**Document status:** Initial product baseline\
**Version:** 0.1\
**Product direction:** Web app only · Browser speech recognition first ·
Small MVP first\
**Working name:** Voice Over Paint

## 1. Product vision

Voice Over Paint is a browser-based painting application that lets
people create and edit simple images using familiar manual controls and
a carefully bounded set of natural voice commands.

The MVP is not a replacement for every capability in Microsoft Paint,
nor does it claim to be the first voice-controlled drawing tool. It
establishes a reliable foundation: a usable canvas, core painting
operations, accessible manual controls, deterministic voice commands,
undo/redo, and local export.

**Product promise:** "Draw naturally. Stay in control."

## 2. Goals and non-goals

### MVP goals

-   Deliver a polished, responsive painting workspace in a modern
    browser.
-   Support mouse and keyboard input, with touch support where
    practical.
-   Provide essential tools: pencil/freehand brush, eraser, line,
    rectangle, ellipse, color selection, and brush size.
-   Support undo/redo for supported operations.
-   Offer browser speech recognition behind a replaceable adapter.
-   Translate recognized phrases into a small, explicit set of validated
    commands.
-   Show listening state, recognized text, command result, and
    recoverable errors.
-   Save/export artwork locally as PNG; support opening a PNG if
    feasible within the MVP.
-   Work without a custom application backend or account.
-   Include automated tests for command parsing and core drawing
    behavior.

### Non-goals for MVP

-   Replacing the operating system's default Paint app.
-   Native desktop packaging or OS-wide integration.
-   A public SDK package or third-party integrations.
-   User accounts, cloud sync, collaboration, or server-side storage.
-   Full natural-language reasoning, generative image creation, or an
    LLM in the command path.
-   Full parity with every Microsoft Paint feature.
-   Guaranteed offline speech recognition across all browsers.
-   Advanced layers, vector editing, animation, or professional-grade
    image manipulation.

## 3. Target users and key scenarios

### Primary users

-   People who want a simple drawing tool with hands-free commands.
-   Beginners who benefit from clear labels and contextual help.
-   Users who find some mouse interactions difficult and prefer
    alternative input methods.
-   Developers or evaluators interested in a future reusable
    voice-command architecture.

### MVP scenarios

1.  A user opens the app and draws with the pencil.
2.  A user says "select the red brush" or "set brush size to 8" and sees
    the corresponding setting update.
3.  A user says "draw a rectangle" and then uses pointer input to place
    it, if the selected tool uses pointer placement.
4.  A user says "undo" or "redo" and sees the canvas update.
5.  A user says "clear canvas"; the app asks for confirmation before
    clearing.
6.  A user exports their artwork as a PNG.
7.  A user denies microphone permission or uses an unsupported browser
    and can still use the full manual drawing experience.

## 4. Product principles

1.  **Manual controls are first-class.** Voice is an additional input
    method, not a requirement.
2.  **Commands are explicit and testable.** A command must map to a
    known operation and validated parameters.
3.  **Never silently guess a risky action.** Ambiguous, unsupported, or
    destructive commands are clarified, rejected, or confirmed.
4.  **Show system state.** The UI clearly indicates listening,
    processing, recognized text, execution result, and errors.
5.  **Local-first.** Artwork remains in the browser unless the user
    exports it.
6.  **Accessible by default.** Controls have labels, keyboard access,
    visible focus, and non-color-only feedback.
7.  **Separate UI from the drawing core.** Voice, toolbar, and keyboard
    all invoke the same command interfaces.

## 5. MVP feature scope

### P0 --- Required for first usable release

-   Responsive editor layout: toolbar, canvas/work area, color controls,
    brush size, status area.
-   Freehand pencil/brush.
-   Eraser.
-   Line, rectangle, and ellipse tools.
-   Foreground color selection with a small palette and custom color
    input.
-   Brush/line width setting.
-   Undo and redo.
-   Clear canvas with confirmation.
-   Export canvas as PNG.
-   Browser speech recognition adapter with visible permission and
    support states.
-   Voice commands for tool selection, color, brush size, undo, redo,
    clear (confirmation required), and export.
-   Manual interaction remains available if voice is unavailable.
-   Unit tests for parser, command validation, history behavior, and
    core geometry/operation logic.
-   Keyboard-accessible controls and basic responsive behavior.

### P1 --- Add after P0 is stable

-   Open/import PNG and JPEG with clear handling of transparency.
-   Text tool.
-   Fill tool, crop, rotate, resize, zoom.
-   Better selection/move operations.
-   Recent colors and improved palette.
-   Voice command help panel with examples.
-   Save project state locally using IndexedDB.
-   E2E tests across supported browsers.

### Explicitly deferred

-   Layers, advanced selection masks, filters, pressure-sensitive stylus
    tuning, multi-document workflows, SVG editing, cloud storage,
    accounts, SDK publishing, desktop packaging.

## 6. Voice interaction design

### Interaction loop

1.  User activates the microphone control or a clearly documented
    listening mode.
2.  The app shows a visible listening indicator.
3.  Speech recognition returns text.
4.  The parser normalizes the text and matches it to a known command
    grammar.
5.  The command validator checks the operation and parameters.
6.  The app previews or confirms the action when needed.
7.  The command dispatcher invokes the same core action used by manual
    controls.
8.  The UI reports success, clarification, unsupported intent, or
    failure.

### Initial command catalogue

  -----------------------------------------------------------------------
  Intent                  Example phrases         Expected behavior
  ----------------------- ----------------------- -----------------------
  Select tool             "use pencil", "switch   Change active tool
                          to eraser", "choose     
                          ellipse"                

  Set color               "set color to red",     Update active drawing
                          "use blue"              color

  Set width               "set brush size to 8",  Update validated width
                          "make the brush         
                          smaller"                

  Undo                    "undo", "undo last      Undo one supported
                          action"                 action

  Redo                    "redo", "restore last   Redo one supported
                          action"                 action

  Clear                   "clear canvas"          Ask for confirmation
                                                  first

  Export                  "export PNG", "save as  Initiate local PNG
                          PNG"                    download; show result

  Help                    "what can I say?",      Open command help
                          "show voice commands"   
  -----------------------------------------------------------------------

### Voice safety and reliability rules

-   Do not execute arbitrary recognized text as code.
-   Do not route voice text directly to DOM manipulation or canvas APIs.
-   Use a fixed command registry and typed command payloads.
-   Reject invalid values; for example, clamp brush size only according
    to documented limits.
-   Require confirmation for destructive actions.
-   Never treat silence, partial recognition, or
    low-confidence/ambiguous phrases as a valid command.
-   Do not pretend speech recognition is available before feature
    detection and permission checks.
-   Handle permission denial, unavailable microphone, unsupported
    browser, no speech, network/service errors, and cancellation.
-   Avoid always-on listening in the MVP; use explicit user activation.
-   Do not store microphone audio or transcripts beyond what is
    necessary for the current interaction unless the user explicitly
    chooses a future feature that requires it.
-   Make clear that browser speech recognition availability and offline
    behavior vary by browser.

## 7. Recommended technology stack

### Application

-   React
-   TypeScript with strict mode
-   Vite
-   Tailwind CSS
-   A small accessible component primitive set, selected only if needed
-   Lucide icons or another consistent icon set

### Drawing

-   Canvas 2D for raster rendering
-   Pointer Events for mouse/touch/pen input
-   A small document/state model for supported operations
-   An operation/history layer for undo and redo
-   Avoid adding a large canvas framework unless implementation evidence
    shows it is needed.

### Voice

-   Browser Web Speech API behind a `SpeechRecognitionAdapter`
    interface.
-   Deterministic phrase/grammar parser for MVP.
-   Typed command registry and validator.
-   No backend and no LLM in the command execution path.

### Storage and export

-   Browser Blob and download APIs for PNG export.
-   IndexedDB only when local project persistence is introduced.
-   No server database for MVP.

### Quality

-   Vitest for unit tests.
-   React Testing Library for UI behavior.
-   Playwright for end-to-end testing once core flows exist.
-   ESLint and Prettier.
-   TypeScript strict checks in CI.

### Why this stack

React and Tailwind make the UI easy to iterate on; TypeScript gives
commands and drawing operations clear contracts; Vite keeps the
development setup lean; Canvas 2D provides direct control over
rendering; and browser APIs avoid a backend for the initial product.

## 8. High-level architecture

``` text
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

### Architectural boundaries

-   UI components display state and dispatch intents; they should not
    own drawing algorithms.
-   Voice adapter only captures/returns speech text and lifecycle
    events.
-   Parser maps text to a typed command or a structured parse failure.
-   Validator checks command parameters and action policy.
-   Dispatcher invokes the same engine methods as toolbar and keyboard
    actions.
-   Paint engine owns drawing state and operation history.
-   Renderer draws the document state to the canvas.
-   Export service handles serialization/downloads.
-   No component should call a second, voice-only implementation of a
    drawing action.

## 9. Suggested repository structure

``` text
voice-over-paint/
├── public/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes.tsx                 # optional; omit if single-screen
│   ├── components/
│   │   ├── editor/
│   │   ├── toolbar/
│   │   ├── voice/
│   │   └── ui/
│   ├── paint/
│   │   ├── engine/
│   │   ├── renderer/
│   │   ├── tools/
│   │   ├── history/
│   │   ├── commands/
│   │   └── export/
│   ├── voice/
│   │   ├── adapters/
│   │   ├── parser/
│   │   └── types/
│   ├── hooks/
│   ├── styles/
│   ├── types/
│   └── main.tsx
├── tests/
│   ├── unit/
│   └── e2e/
├── docs/
│   ├── PRODUCT_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── VOICE_COMMANDS.md
│   └── ROADMAP.md
├── SKILL.md
├── README.md
├── package.json
├── tsconfig.json
└── vite.config.ts
```

Keep this structure proportional to the MVP. Do not create empty
abstractions or folders just to match the diagram; introduce modules
when they have a real responsibility.

## 10. Core type contracts (illustrative)

``` ts
type PaintTool =
  | "pencil"
  | "eraser"
  | "line"
  | "rectangle"
  | "ellipse";

type PaintCommand =
  | { type: "tool.select"; tool: PaintTool }
  | { type: "color.set"; color: string }
  | { type: "brush.size.set"; size: number }
  | { type: "history.undo" }
  | { type: "history.redo" }
  | { type: "canvas.clear" }
  | { type: "canvas.export"; format: "png" }
  | { type: "help.open" };

type CommandParseResult =
  | { ok: true; command: PaintCommand }
  | {
      ok: false;
      reason: "unknown" | "ambiguous" | "missing_parameter";
      message: string;
    };
```

These are starting contracts, not a mandate to copy blindly. Keep names
and limits consistent across the UI, tests, docs, and implementation.

## 11. UX requirements

-   Clear hierarchy: canvas is the primary workspace.
-   Voice control has an explicit microphone button and visible state.
-   Show the latest recognized phrase and a concise result message.
-   Provide a "What can I say?" help affordance.
-   Make tool selection and active color obvious.
-   Use tooltips that explain tool names and keyboard shortcuts.
-   Provide undo/redo buttons and keyboard shortcuts where safe and
    conventional.
-   Keep destructive actions behind confirmation.
-   Avoid relying on color alone to communicate status.
-   Support zoomed browser layouts and reasonable small-screen behavior;
    canvas editing may be optimized for desktop first.
-   Provide useful empty, permission-denied, unsupported-browser, and
    error states.

## 12. Security, privacy, and browser limitations

-   The app has no backend in the MVP.
-   Microphone permission is requested only after a user gesture.
-   Browser speech recognition may rely on browser/vendor services and
    may require connectivity; do not promise local-only processing.
-   Explain microphone use near the control.
-   Do not persist transcripts or audio by default.
-   Treat transcripts as untrusted input.
-   Validate all command names and parameters against the allowlist.
-   Do not use `eval`, generated code, or dynamic function lookup from
    speech.
-   Keep exports user-initiated and local.
-   Test target browsers rather than assuming uniform API support.

## 13. Delivery milestones

### Milestone 0 --- Foundation

-   Confirm feature list and command grammar.
-   Set up React, TypeScript, Vite, Tailwind, linting, formatting, and
    tests.
-   Create the basic editor shell.
-   Acceptance: clean install, development server, typecheck, lint, and
    test commands work.

### Milestone 1 --- Manual drawing

-   Canvas scaling and coordinate mapping.
-   Pencil, eraser, line, rectangle, ellipse.
-   Color and width controls.
-   Undo/redo and PNG export.
-   Acceptance: each P0 manual action works consistently and has tests
    for its core logic.

### Milestone 2 --- Voice MVP

-   Speech adapter, permission and support states.
-   Parser, validator, command registry.
-   P0 voice commands.
-   Confirmation flow for clear.
-   Acceptance: voice commands call the same engine actions as manual
    controls; unsupported phrases do not change the canvas.

### Milestone 3 --- UX and reliability

-   Help panel, tooltips, status messages, keyboard access.
-   Error handling and browser checks.
-   E2E coverage for primary user flows.
-   Acceptance: users can complete a drawing with voice unavailable, and
    recover cleanly from voice errors.

### Milestone 4 --- MVP release

-   README, usage guide, supported-browser note, known limitations.
-   Production build and smoke tests.
-   Acceptance: deployable static site, no required server, documented
    limitations, and passing quality gates.

## 14. Definition of Done

A feature is done only when: - Its acceptance criteria are met. - It
uses the shared command/engine path where applicable. - TypeScript and
lint checks pass. - Relevant unit and UI tests pass. - Errors and empty
states are handled. - Keyboard/accessibility behavior is considered. -
User-facing labels and documentation are updated. - No unsupported
capability is claimed. - The implementation has no unrelated refactor or
dependency additions.

## 15. MVP success measures

Use these as initial targets, not as claims: - A first-time user can
draw and export a basic image without instructions. - Every documented
voice phrase maps to a predictable result in supported environments. -
Unknown phrases never trigger drawing operations. - Undo/redo restores
the expected supported state. - Users can complete the entire manual
workflow without microphone permission. - The app can be built and
deployed as a static web application. - No backend service is required
for core drawing and export.

## 16. Risks and mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Speech recognition differs by       Adapter abstraction, feature
  browser                             detection, supported-browser
                                      documentation, manual fallback

  Natural-language commands are       Small grammar, clear error
  ambiguous                           responses, ask for clarification
                                      rather than guess

  Undo/redo becomes unreliable        Central operation/history model;
                                      tests for each supported operation

  Canvas coordinates drift on resize  Explicit CSS-to-canvas coordinate
  or high-DPI screens                 mapping and resize tests

  MVP scope expands into full Paint   P0/P1 separation and
  parity                              deferred-feature list

  Voice UI feels bolted on            Design listening, transcript,
                                      command help, and error feedback as
                                      part of the editor

  Accessibility is postponed          Include keyboard and semantic
                                      requirements in every milestone
  -----------------------------------------------------------------------

## 17. Immediate next actions

1.  Create the repository and apply the project skill.
2.  Freeze the P0 feature list and initial voice command grammar.
3.  Build the editor shell and canvas coordinate system.
4.  Implement manual tools and history before voice integration.
5.  Add the speech adapter and deterministic command path.
6.  Run acceptance tests, then release the static MVP.

**Decision record:** Web-only MVP; browser speech recognition first;
small MVP first; no backend; React + TypeScript + Vite + Tailwind;
Canvas 2D; deterministic allowlisted commands.
