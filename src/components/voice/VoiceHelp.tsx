import { COMMAND_EXAMPLES } from '../../voice/grammar'

export function VoiceHelp({ onClose }: { onClose: () => void }) {
  return (
    <section
      aria-label="Voice command help"
      className="rounded-md border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">What you can say</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700"
        >
          Close
        </button>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2">
        {COMMAND_EXAMPLES.map((example) => (
          <li
            key={example}
            className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            {example}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-neutral-500">
        Browser voice support varies. You can always draw with the mouse, keyboard, or touch.
      </p>
    </section>
  )
}
