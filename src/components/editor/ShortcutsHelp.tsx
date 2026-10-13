import { SHORTCUTS } from '../../keyboard/shortcuts'
import { Icon } from '../ui/Icon'

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <section
      role="region"
      aria-label="Keyboard shortcuts"
      className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-surface-200 bg-surface-0 p-5 shadow-popover animate-rise"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-15 font-semibold tracking-tight text-surface-900">
          Keyboard shortcuts
        </h2>
        <button
          type="button"
          aria-label="Close shortcuts"
          onClick={onClose}
          className="inline-flex size-7 items-center justify-center rounded-md text-surface-400 transition-colors duration-150 hover:bg-surface-100 hover:text-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Icon name="close" size={15} />
        </button>
      </div>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2">
        {SHORTCUTS.map((shortcut) => (
          <div key={shortcut.keys} className="col-span-2 grid grid-cols-subgrid items-baseline">
            <dt>
              <kbd className="vault-kbd">{shortcut.keys}</kbd>
            </dt>
            <dd className="min-w-0 text-sm text-surface-600">{shortcut.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
