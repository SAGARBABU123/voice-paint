# Usage Guide — Voice Over Paint

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

For a production build, see [`RELEASE.md`](./RELEASE.md).

## Drawing

The document starts at 960 × 720 and scales to fit the window. Draw by dragging
on the canvas with a mouse, finger, or stylus.

**Your work is saved automatically.** The drawing is stored locally with
IndexedDB and restored when you reopen the app in the same browser. The status
bar shows `Saving…` / `Saved`. Nothing is sent to a server.

| Tool      | What it does                                       |
| --------- | -------------------------------------------------- |
| Pencil    | Freehand stroke in the active colour               |
| Eraser    | Freehand stroke painted in the background colour   |
| Line      | Straight line from press to release                |
| Rectangle | Rectangle spanning the drag                        |
| Ellipse   | Ellipse spanning the drag                          |
| Text      | Places text at the clicked point (type, `Enter`)   |
| Fill      | Flood-fills a contiguous area in the active colour |
| Select    | Marquee-selects a region; drag inside to move it   |

- **Colour** — pick a palette swatch, a recent swatch, or use the custom colour
  input. The current colour is shown beside the palette, and recent colours are
  remembered in this browser.
- **Brush size** — drag the slider (1–64 px).
- **Undo / Redo** — step through supported operations.
- **Clear** — empties the canvas after a confirmation prompt.
- **Export PNG** — downloads the artwork as `voice-over-paint.png`.

## Importing images

Use **Open image** to load a PNG or JPEG. The image is scaled to fit inside the
document, centred, and added as a normal operation — so it can be undone,
redone, erased, and is saved with your project. Transparent areas show the white
background.

## Document transforms

- **Rotate** the whole document left or right in 90° steps.
- **Resize** to explicit pixel dimensions (the drawing is scaled to fit).
- **Crop**: choose **Crop**, drag an area on the canvas, then **Apply crop**.

Every transform is recorded in history, so undo/redo works across them.

## Text, fill, and selection

- **Text** — choose **Text**, click where the text should start, type in the
  field, then press `Enter` (or **Place text**). The **Font size** slider sets
  the size and the active colour is used. Press `Escape` to cancel.
- **Fill** — choose **Fill** and click a region to flood-fill it with the active
  colour. Clicking the untouched canvas paints the whole background.
- **Select** — choose **Select** and drag a rectangle. Drag inside the selection
  to move that region, use **Delete** to cut it to the background, or
  **Deselect** to clear the marquee. A move is recorded as a single undo step.

Text, fill, and selection are manual-only tools in this release; voice covers the
P0 commands listed in [`VOICE_COMMANDS.md`](./VOICE_COMMANDS.md).

## Zoom and pan

The view controls above the canvas let you **zoom out/in**, **Fit** the whole
document to the window, or return to **1:1** actual size. When the document is
larger than the viewport, pan by scrolling (or with the scrollbars). Hold
`Ctrl`/`Cmd` and scroll to zoom.

## Voice commands

1. Press **Start voice control** and allow microphone access.
2. Wait for the **Listening…** indicator, then speak one phrase.
3. What you said is **transcribed on the right** (Whisper can hear English or
   Telugu). Read it, then press **Enter** (or **Apply**) to paint it.
4. The result appears in the transcript panel. Nothing is drawn until you
   confirm, so a misheard command can't change your painting by surprise.

Only **final** phrases are executed. Interim and low-confidence results are shown
but never change the canvas. Destructive actions (clearing) always ask for
confirmation first. The full phrase list and safety rules live in
[`VOICE_COMMANDS.md`](./VOICE_COMMANDS.md).

If the browser does not support speech recognition, or permission is denied, the
microphone control is disabled and every manual tool keeps working.

## Keyboard shortcuts

| Keys                   | Action                     |
| ---------------------- | -------------------------- |
| `P` / `B`              | Pencil                     |
| `E`                    | Eraser                     |
| `L`                    | Line                       |
| `R`                    | Rectangle                  |
| `O`                    | Ellipse                    |
| `T`                    | Text                       |
| `F`                    | Fill                       |
| `M`                    | Select / move              |
| `-` / `+`              | Smaller / larger brush     |
| `Ctrl/Cmd + Z`         | Undo                       |
| `Ctrl/Cmd + Shift + Z` | Redo                       |
| `Ctrl/Cmd + S`         | Export PNG                 |
| `?`                    | Toggle the shortcuts panel |

Shortcuts are ignored while typing in a form field.

## Accessibility

- Every control has an accessible name and visible focus styling.
- Status is announced through a live region, and is never conveyed by colour
  alone.
- The drawing workflow is fully usable without voice or a microphone.
