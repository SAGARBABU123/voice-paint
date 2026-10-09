import { useCallback, useState } from 'react'
import { TOOL_LABELS } from '../components/toolLabels'
import { BrowserSpeechAdapter } from '../voice/adapters/BrowserSpeechAdapter'
import { WhisperSpeechAdapter } from '../voice/adapters/WhisperSpeechAdapter'
import type { SpeechRecognitionAdapter, SpeechRecognitionStatus } from '../voice/adapters/types'
import { dispatchCommands, executeCommand } from '../voice/dispatcher'
import { parseCommand } from '../voice/parser'
import type { PaintCommand } from '../voice/types'
import { validateCommands } from '../voice/validator'
import { usePaintEngine } from './PaintProvider'

export type UseVoiceCommandsOptions = {
  adapter?: SpeechRecognitionAdapter
}

/**
 * Chooses the speech engine. When `VITE_WHISPER_ENDPOINT` is set the app uses
 * the Whisper Worker (needed for Telugu); otherwise it falls back to the
 * browser Web Speech API.
 */
function createDefaultAdapter(): SpeechRecognitionAdapter {
  const endpoint = import.meta.env.VITE_WHISPER_ENDPOINT as string | undefined
  if (endpoint) {
    return new WhisperSpeechAdapter({
      endpoint,
      language: import.meta.env.VITE_WHISPER_LANGUAGE as string | undefined,
    })
  }
  return new BrowserSpeechAdapter()
}

/**
 * Final transcripts below this confidence are not executed. Some browsers
 * report 0 when they have no confidence estimate, in which case we accept the
 * result rather than blocking the user.
 */
const MIN_CONFIDENCE = 0.5

export type VoiceCommandController = {
  supported: boolean
  status: SpeechRecognitionStatus
  isListening: boolean
  transcript: string
  message: string
  pendingConfirm: PaintCommand | null
  helpOpen: boolean
  start: () => void
  stop: () => void
  confirmPending: () => Promise<void>
  cancelPending: () => void
  toggleHelp: () => void
  closeHelp: () => void
}

function describeCommand(command: PaintCommand): string {
  switch (command.type) {
    case 'tool.select':
      return `Selected ${TOOL_LABELS[command.tool]}`
    case 'shape.draw':
      return `Drew ${TOOL_LABELS[command.tool]}`
    case 'canvas.fill':
      return 'Filled the shape'
    case 'color.set':
      return `Colour set to ${command.color}`
    case 'brush.size.set':
      return `Brush size set to ${command.size}`
    case 'brush.size.adjust':
      return command.direction === 'larger' ? 'Brush size increased' : 'Brush size decreased'
    case 'history.undo':
      return 'Undone'
    case 'history.redo':
      return 'Redone'
    case 'canvas.clear':
      return 'Canvas cleared'
    case 'canvas.export':
      return 'Exported as PNG'
    case 'help.open':
      return 'Showing voice commands'
  }
}

function describeCommands(commands: readonly PaintCommand[]): string {
  return commands.map(describeCommand).join(' · ')
}

/**
 * Wires the speech adapter through parser -> validator -> dispatcher and into
 * the shared PaintEngine. Only final transcripts are executed; interim results
 * are shown but never dispatched. Destructive commands await confirmation.
 */
export function useVoiceCommands(options: UseVoiceCommandsOptions = {}): VoiceCommandController {
  const engine = usePaintEngine()
  const [adapter] = useState<SpeechRecognitionAdapter>(
    () => options.adapter ?? createDefaultAdapter(),
  )
  const supported = adapter.isSupported()

  const [status, setStatus] = useState<SpeechRecognitionStatus>(supported ? 'idle' : 'unsupported')
  const [transcript, setTranscript] = useState('')
  const [message, setMessage] = useState('')
  const [pendingConfirm, setPendingConfirm] = useState<PaintCommand | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  const runCommands = useCallback(
    async (commands: PaintCommand[]) => {
      const result = await dispatchCommands(engine, commands, {
        onHelp: () => setHelpOpen(true),
        onError: (text) => setMessage(text),
      })

      if (result.pending.length > 0) {
        setPendingConfirm(result.pending[0])
        setMessage('Say or select Confirm to clear the canvas.')
        return
      }
      if (result.executed.length > 0) {
        setMessage(describeCommands(result.executed))
      }
    },
    [engine],
  )

  const handleFinalTranscript = useCallback(
    (text: string) => {
      const parsed = parseCommand(text)
      if (!parsed.ok) {
        setMessage(parsed.message)
        return
      }

      const validation = validateCommands(parsed.commands)
      if (!validation.ok) {
        setMessage(validation.message)
        return
      }

      void runCommands(validation.commands)
    },
    [runCommands],
  )

  const start = useCallback(() => {
    if (!supported) {
      setMessage('Voice commands are not supported in this browser.')
      return
    }
    if (status === 'listening' || status === 'starting' || status === 'transcribing') return

    setStatus('starting')
    setMessage('')
    adapter.start({
      onStart: () => setStatus('listening'),
      onResult: (result) => {
        setTranscript(result.transcript)
        if (!result.isFinal) return
        if (result.confidence > 0 && result.confidence < MIN_CONFIDENCE) {
          setMessage(`I am not sure I heard that ("${result.transcript}"). Please try again.`)
          return
        }
        handleFinalTranscript(result.transcript)
      },
      onError: (code, text) => {
        setStatus(code === 'not-allowed' || code === 'service-not-allowed' ? 'denied' : 'error')
        setMessage(text)
      },
      onProcessing: () => setStatus('transcribing'),
      onEnd: () =>
        setStatus((current) =>
          current === 'listening' || current === 'starting' || current === 'transcribing'
            ? 'idle'
            : current,
        ),
    })
  }, [adapter, handleFinalTranscript, status, supported])

  const stop = useCallback(() => {
    adapter.stop()
    // Whisper reports 'transcribing' synchronously from stop(); keep it.
    setStatus((current) => (current === 'transcribing' ? current : 'idle'))
  }, [adapter])

  const confirmPending = useCallback(async () => {
    const command = pendingConfirm
    setPendingConfirm(null)
    if (!command) return
    await executeCommand(engine, command)
    setMessage(describeCommand(command))
  }, [engine, pendingConfirm])

  const cancelPending = useCallback(() => {
    setPendingConfirm(null)
    setMessage('Clear cancelled.')
  }, [])

  const toggleHelp = useCallback(() => setHelpOpen((open) => !open), [])
  const closeHelp = useCallback(() => setHelpOpen(false), [])

  return {
    supported,
    status,
    isListening: status === 'listening',
    transcript,
    message,
    pendingConfirm,
    helpOpen,
    start,
    stop,
    confirmPending,
    cancelPending,
    toggleHelp,
    closeHelp,
  }
}
