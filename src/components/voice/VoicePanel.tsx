import { useEffect, useRef } from 'react'
import { useVoiceCommands } from '../../hooks/useVoiceCommands'
import { isEditableTarget } from '../../keyboard/shortcuts'
import type { SpeechRecognitionAdapter } from '../../voice/adapters/types'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { cn } from '../ui/cn'
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
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-15 font-semibold tracking-tight text-surface-900">
          Voice control
        </h2>
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={voice.helpOpen}
          leadingIcon={<Icon name="help" size={15} />}
          onClick={voice.toggleHelp}
        >
          What can I say?
        </Button>
      </div>

      {/* Big circular mic button — the hero control of the voice panel. */}
      <div className="flex justify-center py-2">
        <button
          type="button"
          aria-label={voice.isListening ? 'Stop voice control' : 'Start voice control'}
          aria-pressed={voice.isListening}
          disabled={!voice.supported}
          title={voice.isListening ? 'Stop voice control' : 'Start voice control'}
          onClick={voice.isListening ? voice.stop : voice.start}
          className={cn(
            'relative flex size-20 items-center justify-center rounded-full transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-45',
            voice.isListening
              ? 'bg-danger-600 text-white shadow-[0_10px_26px_rgba(201,79,96,0.45)]'
              : 'vop-gradient-accent text-white shadow-[0_10px_26px_rgba(30,102,214,0.35)]',
            'hover:scale-[1.05] active:scale-95',
          )}
        >
          {voice.isListening ? (
            <span
              aria-hidden="true"
              className="absolute inline-flex size-full animate-ping rounded-full bg-danger-500/30"
            />
          ) : null}
          <Icon name={voice.isListening ? 'stop' : 'mic'} size={30} />
        </button>
      </div>

      <div className="flex min-h-6 items-center gap-2 text-13 text-surface-600">
        {voice.isListening ? (
          <span className="vault-equalizer" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="inline-block size-2 shrink-0 rounded-full bg-surface-300"
          />
        )}
        <span className="min-w-0">{statusText}</span>
      </div>

      {!voice.supported ? (
        <div className="vault-empty">
          <span className="vault-empty__icon">
            <Icon name="mic-off" size={20} />
          </span>
          <p className="vault-empty__title">Voice isn't supported here</p>
          <p className="vault-empty__body">
            This browser doesn't offer speech recognition, so voice commands are unavailable. The
            toolbar, shortcuts, and touch still work normally.
          </p>
        </div>
      ) : null}

      {voiceDraft ? (
        <div
          role="group"
          aria-label="Pending voice command"
          className="rounded-lg border border-brand-200 bg-brand-50 p-3 shadow-inset"
        >
          <p className="text-13 font-medium text-brand-900">
            Heard: &ldquo;{voiceDraft.transcript}&rdquo;
          </p>
          <p className="mt-1 text-13 leading-relaxed text-brand-800">
            I will: <span className="font-semibold">{voiceDraft.description}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              ref={applyRef}
              size="sm"
              autoFocus
              leadingIcon={<Icon name="check" size={15} />}
              onClick={() => {
                void applyDraft()
              }}
            >
              Apply (Enter)
            </Button>
            <Button variant="secondary" size="sm" onClick={voice.dismissDraft}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {voice.transcript && !voiceDraft ? (
        <p className="text-13 text-surface-500">Heard: &ldquo;{voice.transcript}&rdquo;</p>
      ) : null}

      <p
        className="min-h-5 text-13 leading-relaxed text-surface-600"
        role="status"
        aria-live="polite"
      >
        {voice.message}
      </p>

      <p className="text-xs leading-relaxed text-surface-400">
        Voice is transcribed here first. Review the text, then press{' '}
        <kbd className="vault-kbd">Enter</kbd> to paint it.
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
