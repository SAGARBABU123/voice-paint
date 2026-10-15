import { useMemo, useState } from 'react'
import { cn } from '../components/ui/cn'
import { filterCommands, type AppCommand } from './registry'
import { useCommandContext } from './useCommandContext'

export type CommandPaletteProps = {
  open: boolean
  onClose: () => void
  onToggleShortcuts?: () => void
}

/**
 * ⌘K command palette: type to filter, arrows to move, Enter to run. The dialog
 * mounts only while open, so its query state resets naturally each time.
 */
export function CommandPalette({ open, onClose, onToggleShortcuts }: CommandPaletteProps) {
  if (!open) return null
  return <PaletteDialog onClose={onClose} onToggleShortcuts={onToggleShortcuts} />
}

function PaletteDialog({
  onClose,
  onToggleShortcuts,
}: {
  onClose: () => void
  onToggleShortcuts?: () => void
}) {
  const context = useCommandContext(onToggleShortcuts)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const results = useMemo(() => filterCommands(query), [query])

  const run = (command: AppCommand) => {
    onClose()
    command.run(context)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-surface-950/30 p-4 pt-24 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-surface-200 bg-surface-0 shadow-popover"
      >
        <input
          autoFocus
          value={query}
          aria-label="Search commands"
          placeholder="Type a command…"
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActive((current) => Math.min(current + 1, results.length - 1))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActive((current) => Math.max(current - 1, 0))
            } else if (event.key === 'Enter') {
              event.preventDefault()
              const command = results[active]
              if (command) run(command)
            } else if (event.key === 'Escape') {
              event.preventDefault()
              onClose()
            }
          }}
          className="w-full border-b border-surface-200 bg-surface-0 px-4 py-3 text-14 text-surface-900 outline-none placeholder:text-surface-400"
        />
        <ul role="listbox" aria-label="Commands" className="max-h-80 overflow-y-auto p-1">
          {results.map((command, index) => (
            <li key={command.id}>
              <button
                type="button"
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => run(command)}
                className={cn(
                  'flex w-full items-center justify-between gap-4 rounded-md px-3 py-2 text-left text-13 transition-colors duration-150',
                  index === active ? 'bg-brand-50 text-brand-700' : 'text-surface-700',
                )}
              >
                <span className="truncate">{command.title}</span>
                <span className="shrink-0 text-11 text-surface-400">
                  {command.group}
                  {command.shortcut ? ` · ${command.shortcut}` : ''}
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-13 text-surface-400">No matching commands</li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}
