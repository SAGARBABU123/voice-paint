import { COMMAND_EXAMPLES } from '../../voice/grammar'
import { Icon } from '../ui/Icon'

export function VoiceHelp({ onClose }: { onClose: () => void }) {
  return (
    <section
      aria-label="Voice command help"
      className="rounded-lg border border-surface-200 bg-surface-50 p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-13 font-semibold text-surface-800">What you can say</h3>
        <button
          type="button"
          aria-label="Close voice help"
          onClick={onClose}
          className="inline-flex size-6 items-center justify-center rounded-md text-surface-400 transition-colors duration-150 hover:bg-surface-100 hover:text-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Icon name="close" size={13} />
        </button>
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-1.5">
        {COMMAND_EXAMPLES.map((example) => (
          <li
            key={example}
            className="rounded-md border border-surface-200 bg-surface-0 px-2 py-1 font-mono text-xs text-surface-700 shadow-sm"
          >
            {example}
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-xs leading-relaxed text-surface-500">
        Browser voice support varies. You can always draw with the mouse, keyboard, or touch.
      </p>
    </section>
  )
}
