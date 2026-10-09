const CONTROL_CLASS =
  'rounded-md border border-neutral-300 px-2.5 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700'

export type ViewControlsProps = {
  zoom: number
  canZoomIn: boolean
  canZoomOut: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onActualSize: () => void
}

export function ViewControls({
  zoom,
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  onFit,
  onActualSize,
}: ViewControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="View">
      <button
        type="button"
        aria-label="Zoom out"
        title="Zoom out"
        className={CONTROL_CLASS}
        disabled={!canZoomOut}
        onClick={onZoomOut}
      >
        −
      </button>
      <span aria-live="polite" className="w-14 text-center text-sm tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        aria-label="Zoom in"
        title="Zoom in"
        className={CONTROL_CLASS}
        disabled={!canZoomIn}
        onClick={onZoomIn}
      >
        +
      </button>
      <button type="button" aria-label="Fit to window" className={CONTROL_CLASS} onClick={onFit}>
        Fit
      </button>
      <button
        type="button"
        aria-label="Actual size"
        title="Zoom to 100%"
        className={CONTROL_CLASS}
        onClick={onActualSize}
      >
        1:1
      </button>
    </div>
  )
}
