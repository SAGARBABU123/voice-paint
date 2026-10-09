import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SpeechHandlers } from './types'
import { WhisperSpeechAdapter } from './WhisperSpeechAdapter'

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = []

  state: RecordingState = 'inactive'
  private readonly listeners = new Map<string, Array<(event: unknown) => void>>()

  constructor() {
    FakeMediaRecorder.instances.push(this)
  }

  addEventListener(type: string, listener: (event: unknown) => void): void {
    const list = this.listeners.get(type) ?? []
    list.push(listener)
    this.listeners.set(type, list)
  }

  start(): void {
    this.state = 'recording'
  }

  stop(): void {
    this.state = 'inactive'
    this.emit('dataavailable', { data: new Blob(['audio-bytes'], { type: 'audio/webm' }) })
    this.emit('stop', {})
  }

  private emit(type: string, event: unknown): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event)
  }
}

function fakeStream(): MediaStream {
  return { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream
}

function fakeResponse(text: string, ok = true): Response {
  return { ok, status: ok ? 200 : 500, json: async () => ({ text }) } as unknown as Response
}

const ENDPOINT = 'https://worker.example/transcribe'

function makeHandlers() {
  return {
    onStart: vi.fn(),
    onResult: vi.fn(),
    onError: vi.fn(),
    onEnd: vi.fn(),
    onProcessing: vi.fn(),
  } satisfies SpeechHandlers
}

function setup(overrides: Partial<ConstructorParameters<typeof WhisperSpeechAdapter>[0]> = {}) {
  const getUserMedia = vi.fn().mockResolvedValue(fakeStream())
  const fetchImpl = vi.fn().mockResolvedValue(fakeResponse('draw a circle'))
  const adapter = new WhisperSpeechAdapter({
    endpoint: ENDPOINT,
    language: 'te',
    fetchImpl: fetchImpl as unknown as typeof fetch,
    mediaDevices: { getUserMedia } as unknown as MediaDevices,
    MediaRecorderImpl: FakeMediaRecorder as unknown as typeof MediaRecorder,
    ...overrides,
  })
  return { adapter, getUserMedia, fetchImpl }
}

afterEach(() => {
  FakeMediaRecorder.instances = []
})

describe('WhisperSpeechAdapter', () => {
  it('reports support only when an endpoint and recording are available', () => {
    expect(setup().adapter.isSupported()).toBe(true)
    expect(setup({ endpoint: '' }).adapter.isSupported()).toBe(false)
    expect(
      setup({ MediaRecorderImpl: undefined, mediaDevices: undefined }).adapter.isSupported(),
    ).toBe(false)
  })

  it('records, uploads, and returns a final transcript', async () => {
    const { adapter, fetchImpl } = setup()
    const handlers = makeHandlers()

    adapter.start(handlers)
    await vi.waitFor(() => expect(handlers.onStart).toHaveBeenCalledTimes(1))

    adapter.stop()
    expect(handlers.onProcessing).toHaveBeenCalledTimes(1)

    await vi.waitFor(() =>
      expect(handlers.onResult).toHaveBeenCalledWith({
        transcript: 'draw a circle',
        isFinal: true,
        confidence: 1,
      }),
    )
    expect(handlers.onEnd).toHaveBeenCalledTimes(1)

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${ENDPOINT}?language=te`)
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(Blob)
  })

  it('omits the language hint when none is configured', async () => {
    const { adapter, fetchImpl } = setup({ language: undefined })
    const handlers = makeHandlers()

    adapter.start(handlers)
    await vi.waitFor(() => expect(handlers.onStart).toHaveBeenCalled())
    adapter.stop()

    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1))
    expect(fetchImpl.mock.calls[0][0]).toBe(ENDPOINT)
  })

  it('reports a blocked microphone without uploading', async () => {
    const { adapter, getUserMedia, fetchImpl } = setup()
    getUserMedia.mockRejectedValue(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }))
    const handlers = makeHandlers()

    adapter.start(handlers)

    await vi.waitFor(() =>
      expect(handlers.onError).toHaveBeenCalledWith('not-allowed', expect.any(String)),
    )
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('reports a missing microphone', async () => {
    const { adapter, getUserMedia } = setup()
    getUserMedia.mockRejectedValue(Object.assign(new Error('none'), { name: 'NotFoundError' }))
    const handlers = makeHandlers()

    adapter.start(handlers)

    await vi.waitFor(() =>
      expect(handlers.onError).toHaveBeenCalledWith('audio-capture', expect.any(String)),
    )
  })

  it('reports a failed upload', async () => {
    const { adapter, fetchImpl } = setup()
    fetchImpl.mockResolvedValue(fakeResponse('', false))
    const handlers = makeHandlers()

    adapter.start(handlers)
    await vi.waitFor(() => expect(handlers.onStart).toHaveBeenCalled())
    adapter.stop()

    await vi.waitFor(() =>
      expect(handlers.onError).toHaveBeenCalledWith('network', expect.any(String)),
    )
    expect(handlers.onEnd).toHaveBeenCalled()
  })

  it('reports empty transcripts as no speech', async () => {
    const { adapter, fetchImpl } = setup()
    fetchImpl.mockResolvedValue(fakeResponse('   '))
    const handlers = makeHandlers()

    adapter.start(handlers)
    await vi.waitFor(() => expect(handlers.onStart).toHaveBeenCalled())
    adapter.stop()

    await vi.waitFor(() =>
      expect(handlers.onError).toHaveBeenCalledWith('no-speech', expect.any(String)),
    )
    expect(handlers.onResult).not.toHaveBeenCalled()
  })

  it('does not upload after abort', async () => {
    const { adapter, fetchImpl } = setup()
    const handlers = makeHandlers()

    adapter.start(handlers)
    await vi.waitFor(() => expect(handlers.onStart).toHaveBeenCalled())

    adapter.abort()

    await vi.waitFor(() => expect(handlers.onEnd).toHaveBeenCalled())
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(handlers.onResult).not.toHaveBeenCalled()
  })
})
