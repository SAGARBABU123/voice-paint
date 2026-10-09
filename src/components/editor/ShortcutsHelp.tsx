import { SHORTCUTS } from '../../keyboard/shortcuts'

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <section
      role="region"
      aria-label="Keyboard shortcuts"
      className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Keyboard shortcuts</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700"
        >
          Close
        </button>
      </div>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        {SHORTCUTS.map((shortcut) => (
          <div key={shortcut.keys} className="col-span-2 grid grid-cols-subgrid">
            <dt className="font-mono text-neutral-700 dark:text-neutral-300">{shortcut.keys}</dt>
            <dd className="text-neutral-500">{shortcut.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
