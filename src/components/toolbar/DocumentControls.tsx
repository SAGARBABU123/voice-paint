import { useState } from 'react'
import { usePaintEngine, usePaintSnapshot } from '../../hooks/PaintProvider'
import { ResizeDialog } from '../ui/ResizeDialog'

const CONTROL_CLASS =
  'rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800'

const ACTIVE_CLASS = 'border-blue-500 bg-blue-500 text-white hover:bg-blue-500'

export type DocumentControlsProps = {
  cropMode: boolean
  onToggleCrop: () => void
}

export function DocumentControls({ cropMode, onToggleCrop }: DocumentControlsProps) {
  const engine = usePaintEngine()
  const state = usePaintSnapshot()
  const [resizeOpen, setResizeOpen] = useState(false)

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Document">
      <span className="text-xs font-medium text-neutral-500">Document</span>
      <button
        type="button"
        aria-label="Rotate left"
        title="Rotate left"
        className={CONTROL_CLASS}
        onClick={() => engine.rotateDocument(3)}
      >
        ↺
      </button>
      <button
        type="button"
        aria-label="Rotate right"
        title="Rotate right"
        className={CONTROL_CLASS}
        onClick={() => engine.rotateDocument(1)}
      >
        ↻
      </button>
      <button
        type="button"
        aria-pressed={cropMode}
        title="Crop the document"
        className={cropMode ? `${CONTROL_CLASS} ${ACTIVE_CLASS}` : CONTROL_CLASS}
        onClick={onToggleCrop}
      >
        Crop
      </button>
      <button
        type="button"
        title="Resize the document"
        className={CONTROL_CLASS}
        onClick={() => setResizeOpen(true)}
      >
        Resize
      </button>

      {resizeOpen ? (
        <ResizeDialog
          initialWidth={state.documentWidth}
          initialHeight={state.documentHeight}
          onApply={(width, height) => {
            engine.resizeDocument(width, height)
            setResizeOpen(false)
          }}
          onCancel={() => setResizeOpen(false)}
        />
      ) : null}
    </div>
  )
}
