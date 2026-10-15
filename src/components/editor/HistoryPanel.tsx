import { usePaintEngine, usePaintSnapshot } from '../../hooks/PaintProvider'
import type { DocumentState } from '../../paint/engine'
import { TOOL_LABELS } from '../toolLabels'
import { cn } from '../ui/cn'

/** A short, human label for the step that produced this document state. */
function describe(entry: DocumentState, previous: DocumentState | undefined): string {
  const last = entry.operations[entry.operations.length - 1]
  if (!last) return 'Empty canvas'
  if (previous && entry.operations.length <= previous.operations.length) return 'Change'
  if (last.kind === 'stroke' || last.kind === 'shape') return TOOL_LABELS[last.tool]
  if (last.kind === 'text') return 'Text'
  return 'Image'
}

/**
 * Undo history as a jump-to-state list (Photoshop-style). The engine keeps the
 * linear entry list; this panel only reads it and moves the cursor.
 */
export function HistoryPanel() {
  const engine = usePaintEngine()
  const snapshot = usePaintSnapshot()
  const entries = engine.getHistoryEntries()
  const index = engine.getHistoryIndex()

  const rows = [
    { at: 0, label: 'Empty canvas' },
    ...entries.map((entry, position) => ({
      at: position + 1,
      label: describe(entry, entries[position - 1]),
    })),
  ]

  return (
    <section aria-label="History" className="flex flex-col gap-1.5 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-13 font-semibold tracking-tight text-surface-900">
          History
        </h2>
        <span className="text-11 tabular-nums text-surface-400">
          {snapshot.operationCount} op{snapshot.operationCount === 1 ? '' : 's'}
        </span>
      </div>
      <ol className="flex flex-col" data-testid="history-list">
        {rows.map((row) => {
          const current = row.at === index
          return (
            <li key={row.at}>
              <button
                type="button"
                aria-current={current ? 'step' : undefined}
                onClick={() => engine.jumpToHistory(row.at)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-12 transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  current
                    ? 'bg-brand-50 font-semibold text-brand-700'
                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
                )}
              >
                <span className="w-5 shrink-0 text-right tabular-nums text-surface-400">
                  {row.at}
                </span>
                <span className="truncate">{row.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
