import { type CSSProperties } from 'react'
import { usePaintEngine, usePaintSnapshot } from '../../hooks/PaintProvider'
import { MAX_BRUSH_SIZE, MAX_FONT_SIZE, MIN_BRUSH_SIZE, MIN_FONT_SIZE } from '../../paint/constants'
import { cn } from '../ui/cn'
import { BrandMark } from '../ui/BrandMark'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { ThemeSwitcher } from '../ui/ThemeSwitcher'
import { TOOL_ICONS, TOOL_LABELS, TOOLS_FREEFORM } from '../toolLabels'
import { PenStyleMenu } from './PenStyleMenu'

export type ToolbarProps = {
  onToggleShortcuts?: () => void
  /** Whether the shortcuts popover is open (keeps aria-expanded honest). */
  shortcutsOpen?: boolean
}

function headerToolClass(active: boolean): string {
  // Flat, no card: bigger icons, tinted text only. Weight also changes on the
  // active tool so state is never communicated by colour alone.
  return cn(
    'inline-flex h-10 items-center gap-2 px-2 text-13 whitespace-nowrap transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
    'hover:bg-transparent hover:opacity-80',
    active ? 'font-semibold text-brand-700' : 'font-medium text-surface-600 hover:text-surface-900',
  )
}

/**
 * Slim app header: brand + the freeform tools (Pencil, Eraser, Text, Fill,
 * Select) beside the title, and theme switcher + shortcuts on the right.
 * Everything else lives in the vertical ToolbarRail beside the canvas.
 */
export function Toolbar({ onToggleShortcuts, shortcutsOpen = false }: ToolbarProps = {}) {
  const engine = usePaintEngine()
  const state = usePaintSnapshot()
  const isTextTool = state.activeTool === 'text'
  const minSize = isTextTool ? MIN_FONT_SIZE : MIN_BRUSH_SIZE
  const maxSize = isTextTool ? MAX_FONT_SIZE : MAX_BRUSH_SIZE
  const currentSize = isTextTool ? state.fontSize : state.brushSize
  const sizeLabel = isTextTool ? 'Font size' : 'Brush size'
  const fillPercent = ((currentSize - minSize) / (maxSize - minSize)) * 100

  return (
    <header className="relative flex h-16 shrink-0 items-center gap-3 border-b border-surface-200 bg-surface-0 px-3 lg:px-5">
      <div className="flex shrink-0 items-center gap-2.5">
        <BrandMark size={40} />
        <div className="min-w-0 leading-tight">
          <h1 className="truncate font-display text-base font-semibold leading-tight tracking-[-0.02em] text-surface-900">
            Voice Over Paint
          </h1>
          <p className="hidden truncate text-xs tracking-[0.01em] text-surface-500 xl:block">
            Draw naturally. Stay in control.
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {/* Pencil hosts the pen-style dropdown. Kept OUTSIDE the scrollable
            strip so its popover is never clipped (overflow-x-auto clips). */}
        <PenStyleMenu />
        <div
          className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto"
          role="toolbar"
          aria-label="Drawing tools"
        >
          {TOOLS_FREEFORM.filter((tool) => tool !== 'pencil').map((tool) => (
            <button
              key={tool}
              type="button"
              aria-pressed={state.activeTool === tool}
              title={TOOL_LABELS[tool]}
              className={headerToolClass(state.activeTool === tool)}
              onClick={() => engine.setTool(tool)}
            >
              <Icon name={TOOL_ICONS[tool]} size={18} />
              {TOOL_LABELS[tool]}
            </button>
          ))}
        </div>
      </div>

      {/* Brush / font size — brush icon + slider + value, no words, no presets. */}
      <div className="flex shrink-0 items-center gap-2 border-l border-surface-200 pl-3 lg:pl-4">
        <label htmlFor="vop-header-size" className="sr-only">
          {sizeLabel}
        </label>
        <Icon name="brush" size={17} className="shrink-0 text-surface-500" aria-hidden="true" />
        <input
          id="vop-header-size"
          type="range"
          min={minSize}
          max={maxSize}
          value={currentSize}
          title={`${sizeLabel} ( - / + )`}
          className="vault-slider w-28 lg:w-36"
          style={{ '--vault-slider-fill': `${fillPercent}%` } as CSSProperties}
          onChange={(event) => {
            const value = Number(event.target.value)
            if (isTextTool) engine.setFontSize(value)
            else engine.setBrushSize(value)
          }}
        />
        <span className="w-9 shrink-0 text-right text-13 font-medium tabular-nums text-surface-700">
          {currentSize}px
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeSwitcher />
        <Button
          variant="ghost"
          size="sm"
          aria-label="Keyboard shortcuts"
          aria-expanded={shortcutsOpen}
          title="Keyboard shortcuts"
          leadingIcon={<Icon name="help" size={18} />}
          onClick={onToggleShortcuts}
        />
      </div>
    </header>
  )
}
