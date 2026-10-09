export type SpeechRecognitionStatus =
  'unsupported' | 'idle' | 'starting' | 'listening' | 'denied' | 'error'

export type SpeechRecognitionErrorCode =
  | 'not-allowed'
  | 'service-not-allowed'
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'aborted'
  | 'unknown'

export type SpeechResult = {
  transcript: string
  isFinal: boolean
  confidence: number
}

export type SpeechHandlers = {
  onStart: () => void
  onResult: (result: SpeechResult) => void
  onError: (code: SpeechRecognitionErrorCode, message: string) => void
  onEnd: () => void
}

/**
 * Captures speech and reports lifecycle/results only. It must never touch the
 * canvas or the paint engine — that is the dispatcher's job.
 */
export interface SpeechRecognitionAdapter {
  isSupported(): boolean
  start(handlers: SpeechHandlers): void
  stop(): void
  abort(): void
}
