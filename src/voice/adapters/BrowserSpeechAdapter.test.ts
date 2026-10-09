import { afterEach, describe, expect, it, vi } from 'vitest'
import { BrowserSpeechAdapter } from './BrowserSpeechAdapter'
import type { SpeechHandlers } from './types'

class FakeRecognition {
  static instance: FakeRecognition | null = null

  lang = ''
  continuous = false
  interimResults = false
  maxAlternatives = 0
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onresult: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  start = vi.fn()
  stop = vi.fn()
  abort = vi.fn()

  constructor() {
    FakeRecognition.instance = this
  }
}

function installRecognition(): void {
  Object.defineProperty(window, 'SpeechRecognition', {
    value: FakeRecognition,
    configurable: true,
    writable: true,
  })
}

afterEach(() => {
  Reflect.deleteProperty(window, 'SpeechRecognition')
  Reflect.deleteProperty(window, 'webkitSpeechRecognition')
  FakeRecognition.instance = null
})

function makeHandlers(): SpeechHandlers {
  return { onStart: vi.fn(), onResult: vi.fn(), onError: vi.fn(), onEnd: vi.fn() }
}

describe('BrowserSpeechAdapter', () => {
  it('reports unsupported when the API is missing', () => {
    expect(new BrowserSpeechAdapter().isSupported()).toBe(false)
  })

  it('reports an error when start cannot run', () => {
    const handlers = makeHandlers()
    new BrowserSpeechAdapter().start(handlers)
    expect(handlers.onError).toHaveBeenCalledTimes(1)
  })

  it('configures and starts recognition, then reports results', () => {
    installRecognition()
    const adapter = new BrowserSpeechAdapter()
    const handlers = makeHandlers()

    expect(adapter.isSupported()).toBe(true)
    adapter.start(handlers)

    const recognition = FakeRecognition.instance
    expect(recognition).not.toBeNull()
    expect(recognition?.lang).toBe('en-US')
    expect(recognition?.interimResults).toBe(true)
    expect(recognition?.continuous).toBe(false)
    expect(recognition?.maxAlternatives).toBe(1)
    expect(recognition?.start).toHaveBeenCalledTimes(1)

    recognition?.onstart?.()
    expect(handlers.onStart).toHaveBeenCalledTimes(1)

    recognition?.onresult?.({
      resultIndex: 0,
      results: [{ 0: { transcript: 'use pencil', confidence: 0.9 }, length: 1, isFinal: true }],
    })
    expect(handlers.onResult).toHaveBeenCalledWith({
      transcript: 'use pencil',
      isFinal: true,
      confidence: 0.9,
    })

    recognition?.onend?.()
    expect(handlers.onEnd).toHaveBeenCalledTimes(1)
  })

  it('maps vendor error codes, falling back to unknown', () => {
    installRecognition()
    const handlers = makeHandlers()
    new BrowserSpeechAdapter().start(handlers)

    FakeRecognition.instance?.onerror?.({ error: 'not-allowed', message: 'blocked' })
    expect(handlers.onError).toHaveBeenCalledWith('not-allowed', 'blocked')

    FakeRecognition.instance?.onerror?.({ error: 'weird-code', message: '' })
    expect(handlers.onError).toHaveBeenLastCalledWith(
      'unknown',
      'Speech recognition stopped unexpectedly.',
    )
  })

  it('delegates stop and abort to the recognition instance', () => {
    installRecognition()
    const handlers = makeHandlers()
    const adapter = new BrowserSpeechAdapter()
    adapter.start(handlers)

    adapter.stop()
    adapter.abort()

    expect(FakeRecognition.instance?.stop).toHaveBeenCalledTimes(1)
    expect(FakeRecognition.instance?.abort).toHaveBeenCalledTimes(1)
  })
})
