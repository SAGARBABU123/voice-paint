import type { SpeechHandlers, SpeechRecognitionAdapter, SpeechRecognitionErrorCode } from './types'

type SpeechAlternativeLike = { transcript: string; confidence: number }
type SpeechResultLike = {
  readonly isFinal: boolean
  readonly length: number
  readonly [index: number]: SpeechAlternativeLike
}
type SpeechResultListLike = {
  readonly length: number
  readonly [index: number]: SpeechResultLike
}
type SpeechEventLike = { resultIndex: number; results: SpeechResultListLike }
type SpeechErrorEventLike = { error: string; message: string }

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onresult: ((event: SpeechEventLike) => void) | null
  onerror: ((event: SpeechErrorEventLike) => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

function mapErrorCode(code: string): SpeechRecognitionErrorCode {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
    case 'no-speech':
    case 'audio-capture':
    case 'network':
    case 'aborted':
      return code
    default:
      return 'unknown'
  }
}

/**
 * Web Speech API implementation. All vendor/network variability is contained
 * here so the rest of the app only sees `SpeechRecognitionAdapter`.
 */
export class BrowserSpeechAdapter implements SpeechRecognitionAdapter {
  private recognition: SpeechRecognitionLike | null = null

  isSupported(): boolean {
    return getRecognitionConstructor() !== null
  }

  start(handlers: SpeechHandlers): void {
    const Recognition = getRecognitionConstructor()
    if (!Recognition) {
      handlers.onError('unknown', 'Speech recognition is not supported in this browser.')
      return
    }

    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => handlers.onStart()
    recognition.onend = () => handlers.onEnd()
    recognition.onerror = (event) => {
      handlers.onError(
        mapErrorCode(event.error),
        event.message || 'Speech recognition stopped unexpectedly.',
      )
    }
    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const alternative = result[0]
        if (!alternative) continue
        handlers.onResult({
          transcript: alternative.transcript,
          isFinal: result.isFinal,
          confidence: alternative.confidence,
        })
      }
    }

    this.recognition = recognition
    try {
      recognition.start()
    } catch {
      handlers.onError('unknown', 'Could not start listening. Please try again.')
    }
  }

  stop(): void {
    this.recognition?.stop()
  }

  abort(): void {
    this.recognition?.abort()
  }
}
