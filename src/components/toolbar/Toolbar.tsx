import { usePaintEngine, usePaintSnapshot } from '../../hooks/PaintProvider'
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
  // Tool chip: brand tint when active, neutral otherwise. Weight also changes
  // on the active tool so state is never communicated by colour alone.
  return cn(
    'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-13 whitespace-nowrap transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
    active
      ? 'bg-brand-50 font-semibold text-brand-700'
      : 'font-medium text-surface-600 hover:bg-surface-100 hover:text-surface-900',
  )
}

/**
 * App bar: brand + document identity on the left, the freeform tools in the
 * middle, and app-level actions (theme, shortcuts) on the right. Tool options
 * live in the OptionsBar below it; the rest lives in the ToolbarRail.
 */
export function Toolbar({ onToggleShortcuts, shortcutsOpen = false }: ToolbarProps = {}) {
  const engine = usePaintEngine()
  const state = usePaintSnapshot()

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-surface-200 bg-surface-0 px-3">
      <div className="flex shrink-0 items-center gap-2 border-r border-surface-200 pr-3">
        <BrandMark size={26} />
        <h1 className="hidden whitespace-nowrap font-display text-13 font-semibold tracking-[-0.01em] text-surface-900 sm:block">
          Voice Over Paint
        </h1>
      </div>

      <div className="hidden shrink-0 items-center gap-2 border-r border-surface-200 pr-3 md:flex">
        <span className="text-13 font-medium text-surface-700">Untitled</span>
        <span className="text-12 tabular-nums text-surface-400">
          {state.documentWidth} × {state.documentHeight}
        </span>
      </div>

      <div
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
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
            <Icon name={TOOL_ICONS[tool]} size={17} />
            {TOOL_LABELS[tool]}
          </button>
        ))}
        <PenStyleMenu />
      </div>

      <div className="flex shrink-0 items-center gap-1 border-l border-surface-200 pl-3">
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
