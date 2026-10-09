# Supported Browsers & Limitations — Voice Over Paint

## Manual drawing

Manual drawing works in any modern browser with Canvas 2D support (current
Chrome, Edge, Firefox, and Safari). It never depends on the microphone.

## Voice commands

Voice uses the browser **Web Speech API** (`SpeechRecognition` /
`webkitSpeechRecognition`) behind `SpeechRecognitionAdapter`.

| Browser                  | Manual drawing | Voice commands                                    |
| ------------------------ | -------------- | ------------------------------------------------- |
| Chrome / Edge (Chromium) | ✅             | ✅ Best supported                                 |
| Safari                   | ✅             | ⚠️ Partial / version dependent                    |
| Firefox                  | ✅             | ❌ Not supported — microphone control is disabled |

Notes:

- Voice requires a **secure context** (`https://` or `localhost`).
- Recognition may rely on browser/vendor services and **network connectivity**;
  do not assume local-only or offline processing.
- Microphone permission is requested only after the user presses the control.
- Transcripts and audio are **not persisted** by the app.
- Availability and accuracy vary by browser and platform; the exact phrases in
  [`VOICE_COMMANDS.md`](./VOICE_COMMANDS.md) are the supported grammar.

## Known limitations (MVP)

- **Import scales to fit** — an opened PNG/JPEG is scaled (contain) and centred
  inside the 960 × 720 document; the document size does not change yet.
- **No transparency** — drawings composite onto the white background, so
  transparent areas of an imported image show as white, and the eraser paints the
  background colour.
- **Clear is not undoable** — it resets the history and is guarded by a
  confirmation.
- **Fixed command grammar** — there is no natural-language understanding and no
  LLM in the command path; unknown phrasing returns a helpful message without
  changing the canvas.
- **No layers, filters, text, crop, rotate, resize, or cloud storage** — deferred
  by scope (zoom and pan are supported).
- **No backend, accounts, or analytics** — the app is a static site and stores
  nothing server-side. Drawings are kept in the browser's IndexedDB by default;
  clearing site data or using private browsing removes them.
