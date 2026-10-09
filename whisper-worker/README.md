# Whisper Worker — Voice Over Paint

A tiny Cloudflare Worker that turns a short audio clip into text with
**Workers AI Whisper** (`@cf/openai/whisper-large-v3-turbo`). The paint app
records a clip in the browser and POSTs it here; the Worker returns `{ text }`.

This is separate from the app so the app can stay a small static site.

## How it works

```text
Browser (MediaRecorder)
  └── POST /?language=en   (raw audio bytes)
        └── Worker  @cf/openai/whisper-large-v3-turbo
              └── { "text": "..." }
```

- **No API key needed** — Workers AI is used through the `AI` binding.
- **No secrets** are stored in this repository.
- Query parameters: `language` (optional ISO-639-1, e.g. `en`, `hi`) and
  `task` (`transcribe` default, or `translate`).
- The free tier is **10,000 Neurons/day**. Set a spend limit of `$0` in the
  Cloudflare dashboard so it can never charge you.

## Deploy (free)

```bash
cd whisper-worker
npx wrangler@latest login        # one-time, opens the browser
npx wrangler@latest deploy
```

Wrangler prints the Worker URL, for example:

```text
https://voice-over-paint-whisper.<your-subdomain>.workers.dev
```

Then point the app at it by creating a `.env` in the project root:

```bash
VITE_WHISPER_ENDPOINT=https://voice-over-paint-whisper.<your-subdomain>.workers.dev
VITE_WHISPER_LANGUAGE=en
```

Rebuild the app (`npm run build`) and voice input goes through Whisper.
The app defaults to English already; set `VITE_WHISPER_LANGUAGE` to another
supported Whisper language if you need one.

## Local development

```bash
cd whisper-worker
npx wrangler@latest dev          # http://localhost:8787
```

Then set `VITE_WHISPER_ENDPOINT=http://localhost:8787` in the app's `.env`.

## Lock down the origin

Edit `wrangler.toml` before going public:

```toml
[vars]
ALLOWED_ORIGINS = "https://your-app.pages.dev"
```

## Notes

- Audio leaves the device and is processed by Cloudflare — say so in the app.
- The Worker rejects bodies over 10 MB. Keep clips short (a few seconds).
