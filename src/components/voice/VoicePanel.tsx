export function VoicePanel() {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-neutral-200 px-4 py-2 dark:border-neutral-800">
      <button
        type="button"
        disabled
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-60 dark:border-neutral-700"
        aria-label="Start voice control"
      >
        Voice
      </button>
      <span className="text-sm text-neutral-500">Voice support arrives in Milestone 2.</span>
    </div>
  )
}
