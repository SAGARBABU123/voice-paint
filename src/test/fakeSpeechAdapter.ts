import { vi } from 'vitest'
import type {
  SpeechHandlers,
  SpeechRecognitionAdapter,
  SpeechRecognitionErrorCode,
} from '../voice/adapters/types'

export type FakeSpeechAdapter = {
  adapter: SpeechRecognitionAdapter
  emitResult: (transcript: string, isFinal?: boolean, confidence?: number) => void
  emitError: (code: SpeechRecognitionErrorCode, message?: string) => void
  emitEnd: () => void
  emitProcessing: () => void
  isStarted: () => boolean
}

/** Deterministic stand-in for the Web Speech API in tests. */
export function createFakeSpeechAdapter(supported = true): FakeSpeechAdapter {
  let handlers: SpeechHandlers | null = null

  const adapter: SpeechRecognitionAdapter = {
    isSupported: () => supported,
    start: (next) => {
      handlers = next
      next.onStart()
    },
    stop: vi.fn(),
    abort: vi.fn(),
  }

  return {
    adapter,
    emitResult: (transcript, isFinal = true, confidence = 1) => {
      handlers?.onResult({ transcript, isFinal, confidence })
    },
    emitError: (code, message = 'speech error') => {
      handlers?.onError(code, message)
    },
    emitEnd: () => {
      handlers?.onEnd()
    },
    emitProcessing: () => {
      handlers?.onProcessing?.()
    },
    isStarted: () => handlers !== null,
  }
}
