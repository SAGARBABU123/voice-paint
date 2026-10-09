import { usePaintSnapshot } from '../../hooks/PaintProvider'
import type { PersistenceStatus } from '../../hooks/useProjectPersistence'
import { TOOL_LABELS } from '../toolLabels'

const PERSISTENCE_LABEL: Record<PersistenceStatus, string> = {
  loading: 'Restoring…',
  ready: 'Autosave on',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Save failed',
  unavailable: 'Local storage unavailable',
}

type StatusBarProps = {
  persistence?: PersistenceStatus
}

export function StatusBar({ persistence }: StatusBarProps = {}) {
  const state = usePaintSnapshot()
  const operationLabel = `${state.operationCount} operation${state.operationCount === 1 ? '' : 's'}`

  return (
    <footer
      className="flex flex-wrap items-center gap-2 border-t border-neutral-200 px-4 py-2 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400"
      role="status"
      aria-live="polite"
    >
      <span>{TOOL_LABELS[state.activeTool]}</span>
      <span aria-hidden="true">·</span>
      <span>Size {state.brushSize}px</span>
      <span aria-hidden="true">·</span>
      <span>Color {state.color}</span>
      <span aria-hidden="true">·</span>
      <span>{operationLabel}</span>
      {persistence ? (
        <>
          <span aria-hidden="true">·</span>
          <span>{PERSISTENCE_LABEL[persistence]}</span>
        </>
      ) : null}
    </footer>
  )
}
