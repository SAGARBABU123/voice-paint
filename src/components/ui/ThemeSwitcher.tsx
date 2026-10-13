import { useEffect, useRef, useState } from 'react'
import { applyTheme, currentTheme, THEME_OPTIONS } from '../../design/themesStore'
import { cn } from './cn'
import { Icon } from './Icon'

/**
 * Theme colour picker: one-click cycling through every combo in themes.css.
 * Pure UI — the whole app re-skins via the `[data-theme]` token blocks.
 */
export function ThemeSwitcher() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(currentTheme())
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const select = (id: string) => {
    applyTheme(id)
    setActive(id)
    setOpen(false)
  }

  // Esc closes the popover; focus returns to the toggle.
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const activeTheme =
    THEME_OPTIONS.find((theme) => theme.id === active) ?? THEME_OPTIONS[THEME_OPTIONS.length - 1]

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change theme"
        title="Change colour theme"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-surface-200 bg-surface-0 px-2.5 shadow-soft transition-all duration-150 hover:border-brand-300 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
      >
        <span
          aria-hidden="true"
          className="size-3.5 rounded-full border border-surface-200 shadow-sm"
          style={{ background: activeTheme.swatch }}
        />
        <Icon name="brush" size={14} className="text-surface-600" />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            aria-label="Theme"
            className="absolute right-0 top-full z-50 mt-2 w-44 animate-rise overflow-hidden rounded-xl border border-surface-200 bg-surface-0 p-1.5 shadow-popover"
          >
            {THEME_OPTIONS.map((theme) => (
              <button
                key={theme.id || 'paper'}
                type="button"
                role="option"
                aria-selected={theme.id === active}
                onClick={() => select(theme.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-13 font-medium transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  theme.id === active
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-surface-700 hover:bg-surface-100',
                )}
              >
                <span
                  aria-hidden="true"
                  className="size-4 shrink-0 rounded-full border border-surface-200/80 shadow-sm"
                  style={{ background: theme.swatch }}
                />
                {theme.name}
                {theme.id === active ? (
                  <Icon name="check" size={13} className="ml-auto text-brand-600" />
                ) : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
