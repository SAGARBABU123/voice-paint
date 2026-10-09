import { useEffect, useRef, useState, type FormEvent } from 'react'

type ResizeDialogProps = {
  initialWidth: number
  initialHeight: number
  onApply: (width: number, height: number) => void
  onCancel: () => void
}

const FIELD_CLASS =
  'w-24 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-950'

/** Small dialog for resizing the document to explicit pixel dimensions. */
export function ResizeDialog({
  initialWidth,
  initialHeight,
  onApply,
  onCancel,
}: ResizeDialogProps) {
  const [width, setWidth] = useState(String(initialWidth))
  const [height, setHeight] = useState(String(initialHeight))
  const widthRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    widthRef.current?.focus()
    widthRef.current?.select()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const nextWidth = Math.round(Number(width))
    const nextHeight = Math.round(Number(height))
    if (!Number.isFinite(nextWidth) || !Number.isFinite(nextHeight)) return
    if (nextWidth < 1 || nextHeight < 1) return
    onApply(nextWidth, nextHeight)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="resize-title"
        className="w-full max-w-xs rounded-lg bg-white p-4 shadow-xl dark:bg-neutral-900"
        onSubmit={handleSubmit}
      >
        <h2 id="resize-title" className="text-base font-semibold">
          Resize document
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          The drawing is scaled to the new size. This can be undone.
        </p>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="resize-width">Width</label>
            <input
              ref={widthRef}
              id="resize-width"
              type="number"
              min={1}
              value={width}
              className={FIELD_CLASS}
              onChange={(event) => setWidth(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="resize-height">Height</label>
            <input
              id="resize-height"
              type="number"
              min={1}
              value={height}
              className={FIELD_CLASS}
              onChange={(event) => setHeight(event.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            Apply resize
          </button>
        </div>
      </form>
    </div>
  )
}
