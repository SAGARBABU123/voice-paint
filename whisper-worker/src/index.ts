/**
 * Voice Over Paint — Whisper transcription Worker.
 *
 * Accepts raw audio bytes on POST and returns `{ text }`, using Cloudflare
 * Workers AI (`@cf/openai/whisper-large-v3-turbo`). The app posts a short clip
 * recorded with MediaRecorder; the model handles English, Telugu, and many
 * other languages.
 *
 * Query parameters:
 *   language  optional ISO-639-1 hint, e.g. `te` or `en`. Omitted = auto-detect.
 *   task      `transcribe` (default) or `translate` (translate to English).
 */

type AiRunInput = {
  /** Base64-encoded audio; that is the shape the model's schema accepts. */
  audio: string
  task: 'transcribe' | 'translate'
  language?: string
}

type AiBinding = {
  run: (model: string, input: AiRunInput) => Promise<{ text?: string }>
}

type Env = {
  AI: AiBinding
  ALLOWED_ORIGINS?: string
}

const MODEL = '@cf/openai/whisper-large-v3-turbo'
const MAX_BYTES = 10 * 1024 * 1024

function corsHeaders(origin: string | null, allowedOrigins: string | undefined): Headers {
  const headers = new Headers()
  headers.set('access-control-allow-methods', 'POST, OPTIONS')
  headers.set('access-control-allow-headers', 'content-type')
  headers.set('vary', 'origin')

  const allowed = (allowedOrigins ?? '*')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (allowed.includes('*')) headers.set('access-control-allow-origin', '*')
  else if (origin && allowed.includes(origin)) headers.set('access-control-allow-origin', origin)

  return headers
}

/** Workers AI Whisper expects the audio as a base64 string. */
function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const CHUNK = 0x8000
  for (let index = 0; index < bytes.length; index += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(index, index + CHUNK))
  }
  return btoa(binary)
}

function json(body: unknown, status: number, headers: Headers): Response {
  const responseHeaders = new Headers(headers)
  responseHeaders.set('content-type', 'application/json')
  return new Response(JSON.stringify(body), { status, headers: responseHeaders })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const cors = corsHeaders(request.headers.get('origin'), env.ALLOWED_ORIGINS)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }
    if (request.method !== 'POST') {
      return json({ error: 'Use POST with audio bytes.' }, 405, cors)
    }

    const declaredLength = Number(request.headers.get('content-length') ?? '0')
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BYTES) {
      return json({ error: 'Audio is too large.' }, 413, cors)
    }

    const audio = new Uint8Array(await request.arrayBuffer())
    if (audio.byteLength === 0) return json({ error: 'No audio received.' }, 400, cors)
    if (audio.byteLength > MAX_BYTES) return json({ error: 'Audio is too large.' }, 413, cors)

    const language = url.searchParams.get('language')?.trim() || undefined
    const task = url.searchParams.get('task') === 'translate' ? 'translate' : 'transcribe'

    try {
      const result = await env.AI.run(MODEL, {
        audio: toBase64(audio),
        task,
        ...(language ? { language } : {}),
      })
      const text = (result.text ?? '').trim()
      if (!text) return json({ text: '', error: 'No speech detected.' }, 422, cors)
      return json({ text }, 200, cors)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      return json({ error: 'Transcription failed.', detail: detail.slice(0, 500) }, 502, cors)
    }
  },
}
