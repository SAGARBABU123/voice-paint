import { useEffect, useRef, useState } from 'react'
import { cn } from '../components/ui/cn'
import { APP_COMMANDS, COMMAND_GROUPS, type CommandGroup } from './registry'
import { useCommandContext } from './useCommandContext'

const MENU_GROUPS: readonly CommandGroup[] = COMMAND_GROUPS.filter((group) => group !== 'Tools')

/** Classic File / Edit / View / Help menu, sharing the command registry. */
export function MenuBar({ onToggleShortcuts }: { onToggleShortcuts?: () => void }) {
  const context = useCommandContext(onToggleShortcuts)
  const [open, setOpen] = useState<CommandGroup | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={ref} className="flex shrink-0 items-center gap-0.5">
      {MENU_GROUPS.map((group) => {
        const items = APP_COMMANDS.filter((command) => command.group === group)
        const isOpen = open === group
        return (
          <div key={group} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : group)}
              className={cn(
                'rounded-md px-2 py-1 text-13 font-medium transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                isOpen
                  ? 'bg-surface-100 text-surface-900'
                  : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
              )}
            >
              {group}
            </button>
            {isOpen ? (
              <div
                role="menu"
                aria-label={`${group} menu`}
                className="absolute left-0 top-full z-40 mt-1 min-w-56 rounded-lg border border-surface-200 bg-surface-0 p-1 shadow-raised"
              >
                {items.map((command) => (
                  <button
                    key={command.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(null)
                      command.run(context)
                    }}
                    className="flex w-full items-center justify-between gap-4 rounded-md px-2.5 py-1.5 text-left text-13 text-surface-700 transition-colors duration-150 hover:bg-surface-100 focus-visible:bg-surface-100 focus-visible:outline-none"
                  >
                    <span className="whitespace-nowrap">{command.title}</span>
                    {command.shortcut ? (
                      <span className="shrink-0 text-11 tabular-nums text-surface-400">
                        {command.shortcut}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
