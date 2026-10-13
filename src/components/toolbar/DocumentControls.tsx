import { useState } from 'react'
import { usePaintEngine, usePaintSnapshot } from '../../hooks/PaintProvider'
import { Icon } from '../ui/Icon'
import { cn } from '../ui/cn'
import { ResizeDialog } from '../ui/ResizeDialog'

const GHOST =
  'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-13 font-medium whitespace-nowrap transition-all duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ' +
  'text-surface-600 hover:bg-surface-100 hover:text-surface-900'

const ACTIVE =
  'border border-brand-200 bg-brand-50 text-brand-700 shadow-soft hover:bg-brand-50 hover:text-brand-700'

export type DocumentControlsProps = {
  cropMode: boolean
  onToggleCrop: () => void
}

export function DocumentControls({ cropMode, onToggleCrop }: DocumentControlsProps) {
  const engine = usePaintEngine()
  const state = usePaintSnapshot()
  const [resizeOpen, setResizeOpen] = useState(false)

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Document">
      <span className="text-11 font-semibold uppercase tracking-[0.08em] text-surface-400">
        Document
      </span>
      <button
        type="button"
        aria-label="Rotate left"
        title="Rotate left"
        className={GHOST}
        onClick={() => engine.rotateDocument(3)}
      >
        <Icon name="rotate-left" size={15} />
      </button>
      <button
        type="button"
        aria-label="Rotate right"
        title="Rotate right"
        className={GHOST}
        onClick={() => engine.rotateDocument(1)}
      >
        <Icon name="rotate-right" size={15} />
      </button>
      <button
        type="button"
        aria-pressed={cropMode}
        title="Crop the document"
        className={cn(GHOST, cropMode && ACTIVE)}
        onClick={onToggleCrop}
      >
        <Icon name="crop" size={15} />
        Crop
      </button>
      <button
        type="button"
        title="Resize the document"
        className={GHOST}
        onClick={() => setResizeOpen(true)}
      >
        <Icon name="resize" size={15} />
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
