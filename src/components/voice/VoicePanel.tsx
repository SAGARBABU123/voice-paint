import { useEffect, useRef } from 'react'
import { useVoiceCommands } from '../../hooks/useVoiceCommands'
import { isEditableTarget } from '../../keyboard/shortcuts'
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

const BUTTON_CLASS =
  'rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700'

export function VoicePanel({ adapter }: VoicePanelProps = {}) {
  const voice = useVoiceCommands(adapter ? { adapter } : {})
  const statusText = STATUS_TEXT[voice.status] ?? voice.status
  const { draft: voiceDraft, runDraft: applyDraft } = voice
  const applyRef = useRef<HTMLButtonElement | null>(null)

  // Focus the Apply button when a draft arrives so Enter applies it.
  useEffect(() => {
    if (voiceDraft) applyRef.current?.focus()
  }, [voiceDraft])

  // Enter anywhere (outside text fields) applies the reviewed draft.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.ctrlKey || event.metaKey || event.altKey) return
      if (isEditableTarget(event.target)) return
      if (voiceDraft) {
        event.preventDefault()
        void applyDraft()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [voiceDraft, applyDraft])

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!voice.supported}
          aria-pressed={voice.isListening}
          className={BUTTON_CLASS}
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
          className={BUTTON_CLASS}
          onClick={voice.toggleHelp}
        >
          What can I say?
        </button>
      </div>

      {voiceDraft ? (
        <div
          role="group"
          aria-label="Pending voice command"
          className="rounded-md border border-blue-500 bg-blue-50 p-3 text-sm dark:border-blue-700 dark:bg-neutral-900"
        >
          <p className="font-medium">Heard: “{voiceDraft.transcript}”</p>
          <p className="mt-1 text-neutral-700 dark:text-neutral-300">
            I will: <span className="font-semibold">{voiceDraft.description}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              ref={applyRef}
              type="button"
              autoFocus
              onClick={() => {
                void applyDraft()
              }}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              Apply (Enter)
            </button>
            <button type="button" className={BUTTON_CLASS} onClick={voice.dismissDraft}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {voice.transcript && !voiceDraft ? (
        <p className="text-sm text-neutral-500">Heard: “{voice.transcript}”</p>
      ) : null}

      <p
        className="min-h-5 text-sm text-neutral-700 dark:text-neutral-300"
        role="status"
        aria-live="polite"
      >
        {voice.message}
      </p>

      <p className="text-xs text-neutral-400">
        Voice is transcribed here first. Review the text, then press <b>Enter</b> to paint it.
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
