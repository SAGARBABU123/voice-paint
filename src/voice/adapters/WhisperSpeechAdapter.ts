import type { SpeechHandlers, SpeechRecognitionAdapter } from './types'

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024

type MediaDevicesLike = Pick<MediaDevices, 'getUserMedia'>

export type WhisperSpeechAdapterOptions = {
  /** Worker endpoint that accepts raw audio bytes and returns `{ text }`. */
  endpoint: string
  /** Optional Whisper language hint, e.g. `te` for Telugu. Omit to auto-detect. */
  language?: string
  /** Overridable for tests. */
  fetchImpl?: typeof fetch
  mediaDevices?: MediaDevicesLike
  MediaRecorderImpl?: typeof MediaRecorder
  maxBytes?: number
}

function resolveMediaDevices(options: WhisperSpeechAdapterOptions): MediaDevicesLike | undefined {
  if (options.mediaDevices) return options.mediaDevices
  if (typeof navigator === 'undefined') return undefined
  return navigator.mediaDevices
}

function resolveRecorder(options: WhisperSpeechAdapterOptions): typeof MediaRecorder | undefined {
  if (options.MediaRecorderImpl) return options.MediaRecorderImpl
  return typeof MediaRecorder === 'undefined' ? undefined : MediaRecorder
}

function buildEndpoint(endpoint: string, language: string | undefined): string {
  if (!language) return endpoint
  const separator = endpoint.includes('?') ? '&' : '?'
  return `${endpoint}${separator}language=${encodeURIComponent(language)}`
}

function errorName(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const name = (error as { name?: unknown }).name
    if (typeof name === 'string') return name
  }
  return ''
}

/**
 * Records a short clip with MediaRecorder and sends it to a Whisper Worker for
 * transcription. It implements the same `SpeechRecognitionAdapter` contract as
 * the Web Speech adapter, so the parser, validator, and dispatcher are
 * unchanged. Audio is sent off-device — the UI must say so.
 */
export class WhisperSpeechAdapter implements SpeechRecognitionAdapter {
  private stream: MediaStream | null = null
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private handlers: SpeechHandlers | null = null
  private recording = false
  private cancelled = false

  private readonly options: WhisperSpeechAdapterOptions

  constructor(options: WhisperSpeechAdapterOptions) {
    this.options = options
  }

  isSupported(): boolean {
    if (!this.options.endpoint) return false
    return Boolean(resolveRecorder(this.options) && resolveMediaDevices(this.options)?.getUserMedia)
  }

  start(handlers: SpeechHandlers): void {
    this.handlers = handlers
    this.cancelled = false

    if (!this.isSupported()) {
      handlers.onError('unknown', 'Recording is not supported in this browser.')
      return
    }

    void this.beginRecording(handlers)
  }

  stop(): void {
    if (!this.recording || !this.recorder) return
    this.recording = false
    this.handlers?.onProcessing?.()
    this.recorder.stop()
  }

  abort(): void {
    this.cancelled = true
    this.recording = false
    if (this.recorder && this.recorder.state !== 'inactive') {
      try {
        this.recorder.stop()
      } catch {
        // Ignore: the recorder may already be shutting down.
      }
    }
    this.releaseStream()
  }

  private async beginRecording(handlers: SpeechHandlers): Promise<void> {
    try {
      const mediaDevices = resolveMediaDevices(this.options)
      const Recorder = resolveRecorder(this.options)
      if (!mediaDevices || !Recorder) {
        handlers.onError('unknown', 'Recording is not supported in this browser.')
        return
      }

      const stream = await mediaDevices.getUserMedia({ audio: true })
      if (this.cancelled) {
        stopTracks(stream)
        return
      }
      this.stream = stream

      const recorder = new Recorder(stream)
      this.recorder = recorder
      this.chunks = []

      recorder.addEventListener('dataavailable', (event) => {
        const data = (event as BlobEvent).data
        if (data && data.size > 0) this.chunks.push(data)
      })
      recorder.addEventListener('stop', () => {
        void this.transcribe()
      })
      recorder.addEventListener('error', () => {
        handlers.onError('unknown', 'Recording failed. Please try again.')
        this.releaseStream()
        handlers.onEnd()
      })

      recorder.start()
      this.recording = true
      handlers.onStart()
    } catch (error) {
      const name = errorName(error)
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        handlers.onError('not-allowed', 'Microphone access was blocked.')
      } else if (name === 'NotFoundError' || name === 'audio-capture') {
        handlers.onError('audio-capture', 'No microphone was found.')
      } else {
        handlers.onError('unknown', 'Could not start recording.')
      }
    }
  }

  private async transcribe(): Promise<void> {
    const handlers = this.handlers
    const chunks = this.chunks
    this.chunks = []
    this.releaseStream()

    if (!handlers) return
    if (this.cancelled) {
      handlers.onEnd()
      return
    }

    const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' })
    const maxBytes = this.options.maxBytes ?? DEFAULT_MAX_BYTES
    if (blob.size === 0) {
      handlers.onError('no-speech', 'I did not hear anything. Please try again.')
      handlers.onEnd()
      return
    }
    if (blob.size > maxBytes) {
      handlers.onError('unknown', 'That recording was too long. Please keep it short.')
      handlers.onEnd()
      return
    }

    try {
      const fetchImpl = this.options.fetchImpl ?? fetch
      const response = await fetchImpl(
        buildEndpoint(this.options.endpoint, this.options.language),
        {
          method: 'POST',
          headers: { 'content-type': blob.type },
          body: blob,
        },
      )

      if (!response.ok) {
        handlers.onError('network', 'The speech service could not transcribe that.')
        handlers.onEnd()
        return
      }

      const payload = (await response.json()) as { text?: unknown }
      const text = typeof payload.text === 'string' ? payload.text.trim() : ''
      if (!text) {
        handlers.onError('no-speech', 'I did not catch that. Please try again.')
        handlers.onEnd()
        return
      }

      handlers.onResult({ transcript: text, isFinal: true, confidence: 1 })
      handlers.onEnd()
    } catch {
      handlers.onError('network', 'Could not reach the speech service.')
      handlers.onEnd()
    }
  }

  private releaseStream(): void {
    if (this.stream) stopTracks(this.stream)
    this.stream = null
    this.recorder = null
    this.recording = false
  }
}

function stopTracks(stream: MediaStream): void {
  for (const track of stream.getTracks()) track.stop()
}
