import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

type ResizeDialogProps = {
  initialWidth: number
  initialHeight: number
  onApply: (width: number, height: number) => void
  onCancel: () => void
}

/** Dialog for resizing the document to explicit pixel dimensions. */
export function ResizeDialog({
  initialWidth,
  initialHeight,
  onApply,
  onCancel,
}: ResizeDialogProps) {
  const [width, setWidth] = useState(String(initialWidth))
  const [height, setHeight] = useState(String(initialHeight))
  const widthRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLFormElement>(null)

  useFocusTrap(dialogRef, onCancel)

  useEffect(() => {
    widthRef.current?.focus()
    widthRef.current?.select()
  }, [])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const nextWidth = Math.round(Number(width))
    const nextHeight = Math.round(Number(height))
    if (!Number.isFinite(nextWidth) || !Number.isFinite(nextHeight)) return
    if (nextWidth < 1 || nextHeight < 1) return
    onApply(nextWidth, nextHeight)
  }

  return (
    <>
      <div className="vault-modal__backdrop" aria-hidden="true" />
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resize-title"
        className="vault-modal__dialog max-w-sm"
        onSubmit={handleSubmit}
      >
        <h2 id="resize-title" className="vault-modal__title">
          Resize document
        </h2>
        <p className="vault-modal__body mt-1">
          The drawing is scaled to the new size. This can be undone.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <label
            htmlFor="resize-width"
            className="flex items-center justify-between gap-4 text-sm text-surface-700"
          >
            <span>Width</span>
            <input
              ref={widthRef}
              id="resize-width"
              type="number"
              min={1}
              value={width}
              className="vault-input w-28 text-right tabular-nums"
              onChange={(event) => setWidth(event.target.value)}
            />
          </label>
          <label
            htmlFor="resize-height"
            className="flex items-center justify-between gap-4 text-sm text-surface-700"
          >
            <span>Height</span>
            <input
              id="resize-height"
              type="number"
              min={1}
              value={height}
              className="vault-input w-28 text-right tabular-nums"
              onChange={(event) => setHeight(event.target.value)}
            />
          </label>
        </div>
        <div className="vault-modal__footer">
          <button
            type="button"
            className="vault-btn vault-btn-secondary vault-btn-sm"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button type="submit" className="vault-btn vault-btn-primary vault-btn-sm">
            Apply resize
          </button>
        </div>
      </form>
    </>
  )
}
