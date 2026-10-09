import { useVoiceCommands } from '../../hooks/useVoiceCommands'
import type { SpeechRecognitionAdapter } from '../../voice/adapters/types'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { VoiceHelp } from './VoiceHelp'

type VoicePanelProps = {
  adapter?: SpeechRecognitionAdapter
}

const STATUS_TEXT: Record<string, string> = {
  unsupported: 'Voice commands are not supported in this browser. Draw manually.',
  starting: 'Starting…',
  listening: 'Listening…',
  transcribing: 'Transcribing…',
  denied: 'Microphone access was blocked. Enable it in your browser, or draw manually.',
  error: 'Something went wrong. You can try again or draw manually.',
  idle: 'Ready. Press Start voice control and speak a command.',
}

export function VoicePanel({ adapter }: VoicePanelProps = {}) {
  const voice = useVoiceCommands(adapter ? { adapter } : {})
  const statusText = STATUS_TEXT[voice.status] ?? voice.status

  return (
    <div className="flex flex-col gap-2 border-t border-neutral-200 px-4 py-2 dark:border-neutral-800">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!voice.supported}
          aria-pressed={voice.isListening}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700"
          onClick={voice.isListening ? voice.stop : voice.start}
        >
          {voice.isListening ? 'Stop voice control' : 'Start voice control'}
        </button>

        <span className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
          {voice.isListening ? (
            <span
              aria-hidden="true"
              className="inline-block size-2 animate-pulse rounded-full bg-red-500"
            />
          ) : null}
          {statusText}
        </span>

        <button
          type="button"
          aria-expanded={voice.helpOpen}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
          onClick={voice.toggleHelp}
        >
          What can I say?
        </button>
      </div>

      {voice.transcript ? (
        <p className="text-sm text-neutral-500">Heard: “{voice.transcript}”</p>
      ) : null}

      <p
        className="min-h-5 text-sm text-neutral-700 dark:text-neutral-300"
        role="status"
        aria-live="polite"
      >
        {voice.message}
      </p>

      {voice.helpOpen ? <VoiceHelp onClose={voice.closeHelp} /> : null}

      {voice.pendingConfirm ? (
        <ConfirmDialog
          title="Clear the canvas?"
          description="This removes the current drawing. Do you want to continue?"
          confirmLabel="Clear"
          onConfirm={() => {
            void voice.confirmPending()
          }}
          onCancel={voice.cancelPending}
        />
      ) : null}
    </div>
  )
}
