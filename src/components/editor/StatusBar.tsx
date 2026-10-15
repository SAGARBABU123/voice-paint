import { usePaintSnapshot } from '../../hooks/PaintProvider'
import { useCursorPosition } from '../../hooks/useCursorPosition'
import type { PersistenceStatus } from '../../hooks/useProjectPersistence'
import { Badge, type BadgeVariant } from '../ui/Badge'
import { TOOL_LABELS } from '../toolLabels'

const PERSISTENCE_META: Record<PersistenceStatus, { label: string; variant: BadgeVariant }> = {
  loading: { label: 'Restoring…', variant: 'neutral' },
  ready: { label: 'Autosave on', variant: 'neutral' },
  saving: { label: 'Saving…', variant: 'info' },
  saved: { label: 'Saved', variant: 'success' },
  error: { label: 'Save failed', variant: 'danger' },
  unavailable: { label: 'Local storage unavailable', variant: 'neutral' },
}

type StatusBarProps = {
  persistence?: PersistenceStatus
}

/** App footer — live summary of the drawing state as status chips. */
export function StatusBar({ persistence }: StatusBarProps = {}) {
  const state = usePaintSnapshot()
  const cursor = useCursorPosition()
  const operationLabel = `${state.operationCount} operation${state.operationCount === 1 ? '' : 's'}`
  const persistenceMeta = persistence ? PERSISTENCE_META[persistence] : null
  const cursorLabel = cursor ? `X ${cursor.x} · Y ${cursor.y}` : 'X — · Y —'

  return (
    <footer
      role="status"
      aria-live="polite"
      className="flex h-11 shrink-0 items-center justify-between gap-3 border-t border-surface-200 bg-surface-0 px-6 text-sm text-surface-600"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge variant="brand">{TOOL_LABELS[state.activeTool]}</Badge>
        <Badge>Size {state.brushSize}px</Badge>
        <Badge>
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full border border-surface-300/70"
            style={{ backgroundColor: state.color }}
          />
          Color {state.color}
        </Badge>
        <Badge>{operationLabel}</Badge>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          aria-hidden="true"
          title="Document size"
          className="hidden font-mono text-xs tabular-nums text-surface-400 sm:inline"
        >
          {state.documentWidth} × {state.documentHeight}
        </span>
        <span
          aria-hidden="true"
          title="Pointer position on the canvas"
          className="hidden font-mono text-xs tabular-nums text-surface-400 sm:inline"
        >
          {cursorLabel}
        </span>
        {persistenceMeta ? (
          <Badge variant={persistenceMeta.variant} dot>
            {persistenceMeta.label}
          </Badge>
        ) : null}
        <Badge variant="neutral">v0.1.0</Badge>
      </div>
    </footer>
  )
}
