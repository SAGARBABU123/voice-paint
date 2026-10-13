import { useEffect, useRef, useState } from 'react'
import { usePaintEngine, usePaintSnapshot } from '../../hooks/PaintProvider'
import { previewDashArray, strokeStyleLabel } from '../../paint/lineStyle'
import { STROKE_STYLES, type StrokeStyle } from '../../paint/types'
import { cn } from '../ui/cn'
import { Icon } from '../ui/Icon'

function StrokePreview({ style, className }: { style: StrokeStyle; className?: string }) {
  return (
    <svg
      width="34"
      height="12"
      viewBox="0 0 34 12"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <line
        x1="2"
        y1="6"
        x2="32"
        y2="6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray={previewDashArray(style)}
      />
    </svg>
  )
}

/**
 * The Pencil tool button doubles as the pen-style menu: clicking Pencil
 * selects the tool and opens the line/pencil style choices (solid, dashed,
 * long dash, dotted, dash-dot, dash-dot-dot) with live stroke previews.
 * Picking a style applies it and stays on the pencil.
 */
export function PenStyleMenu() {
  const engine = usePaintEngine()
  const state = usePaintSnapshot()
  const current = state.strokeStyle
  const active = state.activeTool === 'pencil'
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

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

  const toggle = () => {
    if (!active) engine.setTool('pencil')
    setOpen((value) => !value)
  }

  const pick = (style: StrokeStyle) => {
    engine.setStrokeStyle(style)
    engine.setTool('pencil')
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Pencil"
        title={`Pencil · ${strokeStyleLabel(current)}`}
        onClick={toggle}
        className={cn(
          'inline-flex h-10 items-center gap-2 px-2 text-13 whitespace-nowrap transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
          open || active
            ? 'font-semibold text-brand-700'
            : 'font-medium text-surface-600 hover:text-surface-900',
        )}
      >
        <Icon name="pencil" size={18} />
        Pencil
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            aria-label="Pen style"
            className="absolute left-0 top-full z-50 mt-1 w-48 animate-rise rounded-xl border border-surface-200 bg-surface-0 p-1.5 shadow-popover"
          >
            {STROKE_STYLES.map((style) => (
              <button
                key={style}
                type="button"
                role="option"
                aria-selected={style === current}
                onClick={() => pick(style)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-13 font-medium transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  style === current
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-surface-700 hover:bg-surface-100',
                )}
              >
                <StrokePreview style={style} />
                <span className="min-w-0 flex-1">{strokeStyleLabel(style)}</span>
                {style === current ? (
                  <Icon name="check" size={13} className="text-brand-600" />
                ) : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
