# SKILL.md --- Voice Over Paint Project Engineering Rules

## Purpose

This skill governs AI-assisted development for Voice Over Paint, a
browser-based painting app with a small voice-command MVP. It keeps
implementation aligned with the product baseline and prevents premature
scope expansion.

## Locked product decisions

-   Platform: web application only for the MVP.
-   Initial voice approach: browser speech recognition behind an
    adapter.
-   Scope: small MVP first; do not attempt full Microsoft Paint parity
    in the first release.
-   Backend: none required for core MVP functionality.
-   Stack: React, TypeScript, Vite, Tailwind CSS, Canvas 2D.
-   Voice commands must be deterministic, allowlisted, validated, and
    routed through the same engine as manual controls.
-   Manual drawing must remain fully usable when speech recognition is
    unavailable or denied.

Do not silently change these decisions. If a change seems necessary,
explain the trade-off and ask for approval before implementing it.

## Operating procedure

For every task:

1.  Read `README.md` and the relevant documents under `docs/`,
    especially `PRODUCT_SPEC.md`, `ARCHITECTURE.md`,
    `VOICE_COMMANDS.md`, and `ROADMAP.md` when present.
2.  Identify the specific feature, user outcome, and acceptance criteria
    before coding.
3.  Inspect existing code and tests before proposing changes. Do not
    assume the repository is empty.
4.  State a short implementation plan for non-trivial work.
5.  Implement the smallest coherent change that satisfies the task.
6.  Add or update tests with the implementation.
7.  Run available type checks, linting, and relevant tests. Report
    exactly what ran and what did not.
8.  Update documentation when behavior, commands, architecture, or
    limitations change.
9.  Summarize changed files, test results, known limitations, and next
    steps.

Do not claim a command, test, build, or browser check passed unless it
was actually run and passed.

## Architecture rules

-   Keep UI components, voice recognition, command parsing, command
    validation, command dispatch, painting operations, rendering,
    history, and export responsibilities separate.
-   UI components should dispatch typed intents; they should not contain
    the full drawing algorithm.
-   The voice adapter captures speech and exposes lifecycle/results. It
    must not directly mutate canvas state.
-   The parser converts transcript text into a typed command or a
    structured failure. It must not execute commands.
-   The validator checks command names, parameters, ranges, and policy
    requirements.
-   The dispatcher routes valid commands to the same engine methods used
    by toolbar and keyboard actions.
-   The paint engine owns supported drawing state and operation history.
-   The renderer turns engine/document state into pixels.
-   Export logic should be separate from the React components.
-   Avoid a second voice-only implementation of any action.
-   Avoid premature abstractions. Create an interface when it provides a
    real boundary or replaceability, not merely to increase file count.

## Voice-command safety rules

-   Treat speech transcripts as untrusted input.
-   Never use `eval`, `Function`, arbitrary dynamic method names, or
    generated code based on a transcript.
-   Use a fixed command registry/allowlist and typed payloads.
-   Do not pass arbitrary speech directly to canvas methods or DOM APIs.
-   Unknown, incomplete, or ambiguous phrases must return a helpful
    message and must not mutate the drawing.
-   Validate colors and numeric parameters.
-   Keep parameter limits explicit and documented.
-   Destructive actions such as clearing the canvas require a
    confirmation step.
-   Do not execute a partial recognition result as a final command.
-   Use explicit user activation for listening in the MVP; do not
    introduce always-on listening.
-   Handle unsupported APIs, permission denial, unavailable microphone,
    no speech, cancellation, and recognition errors.
-   Keep transcripts and audio out of persistent storage by default.
-   Clearly communicate that browser speech recognition behavior,
    availability, and network requirements vary.
-   Never claim offline speech recognition unless it has been
    implemented and verified.

## Painting and history rules

-   Use a single source of truth for active tool, color, brush size,
    document dimensions, and supported operations.
-   Use Pointer Events where practical so mouse, touch, and pen can
    share input handling.
-   Correctly map CSS pointer coordinates to canvas/document
    coordinates, including resizing and high-DPI displays.
-   Keep drawing operations reproducible enough for the undo/redo
    strategy selected by the project.
-   Every user-visible mutating operation must have defined history
    behavior.
-   Undo/redo must not create inconsistent UI and canvas state.
-   Test geometry and history logic separately from React where
    practical.
-   Do not add advanced features such as layers, filters, cloud sync, or
    multi-document editing without explicit scope approval.

## UI and accessibility rules

-   Canvas is the primary workspace; keep controls discoverable and
    uncluttered.
-   Give every control an accessible name and keyboard behavior where
    appropriate.
-   Show visible focus indicators.
-   Do not communicate state using color alone.
-   Make active tool, current color, brush size, listening status,
    transcript, and command result understandable.
-   Provide a clear microphone start/stop interaction and a "What can I
    say?" help path.
-   Include loading, unsupported-browser, permission-denied, empty, and
    error states.
-   Add concise tooltips for tools and relevant keyboard shortcuts.
-   Maintain responsive layouts; desktop may be the primary editing
    layout, but avoid breaking narrow screens.
-   Prefer clear language over technical jargon in user-facing messages.
-   Do not make microphone permission mandatory for using the app.

## Technology and dependency rules

-   Use React + TypeScript + Vite + Tailwind CSS unless a documented
    decision is approved.
-   Keep TypeScript strict; avoid `any`. If an exception is unavoidable,
    narrow it and explain why.
-   Prefer browser-native APIs for MVP functionality.
-   Do not add a backend, database server, authentication, analytics, or
    cloud dependency for core drawing/export.
-   Avoid installing a dependency for a small utility that can be safely
    implemented with existing APIs.
-   Check existing package versions and conventions before changing
    dependencies.
-   Keep secrets out of source control. The MVP should not require
    secrets.
-   Keep code formatted consistently with the repository configuration.

## Testing expectations

-   Add parser tests for supported phrases, normalization, missing
    parameters, ambiguous phrases, and unknown commands.
-   Add validator tests for invalid colors, invalid numbers,
    out-of-range values, and destructive-action policy.
-   Add engine/history tests for each supported operation and undo/redo
    behavior.
-   Add UI tests for manual controls, voice states, permission/error
    feedback, confirmation, and export initiation where feasible.
-   Add end-to-end coverage for the primary path: draw → change
    tool/color/size → undo/redo → export.
-   Test that unsupported or unknown voice input does not change the
    canvas.
-   Run the checks available in the repository and report exact results.
-   Do not delete or weaken tests just to make a change pass.

## Scope control

MVP P0 features are: - Freehand pencil/brush - Eraser - Line, rectangle,
ellipse - Color palette/custom color - Brush/line width - Undo/redo -
Clear with confirmation - PNG export - Browser speech adapter with clear
support/permission states - Voice commands for tool selection, color,
size, undo, redo, clear, export, and help - Manual fallback, accessible
controls, and tests

Features such as text, fill, crop, rotate, resize, advanced selection,
IndexedDB project persistence, layers, cloud sync, native packaging, and
public SDK publishing are deferred unless the task explicitly authorizes
them.

If a task exceeds MVP scope: 1. Identify it as out of scope. 2. Explain
the cost or architectural impact briefly. 3. Suggest a later milestone.
4. Do not implement it without approval.

## Definition of done

A change is complete only when: - Acceptance criteria are satisfied. -
Shared engine/command pathways are respected. - Relevant tests are added
or updated. - Type checks and lint checks pass, or failures are reported
accurately. - Error and permission states are handled where relevant. -
Accessibility has been considered. - Documentation is updated when
needed. - No unrelated changes or unapproved dependencies are
included. - The final response lists changes, tests run and results, and
known limitations.

## Required final report format

For implementation tasks, report:

1.  **Implemented:** concise behavior summary.
2.  **Files changed:** list key files.
3.  **Validation:** exact commands run and their results.
4.  **Limitations:** anything not implemented or not verified.
5.  **Next step:** one concrete recommended action.

## Guiding principle

Build a small, reliable, understandable painting app first. Voice should
be an additional input path to the same deterministic painting
engine---not a fragile layer that bypasses it.
