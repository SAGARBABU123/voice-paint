import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { usePaintEngine, usePaintSnapshot } from '../../hooks/PaintProvider'
import { useViewport } from '../../hooks/useViewport'
import { clamp01, partialOperation } from '../../paint/animate'
import { clientToDocumentPoint } from '../../paint/coordinates'
import { containsPoint, distance, normalizeRect, type Rect } from '../../paint/geometry'
import { createId } from '../../paint/id'
import { getCachedImage, preloadImages } from '../../paint/imageCache'
import { renderScene, type PreviewItem } from '../../paint/renderer'
import {
  isImageOperation,
  isShapeTool,
  isStrokeTool,
  type PaintOperation,
  type Point,
} from '../../paint/types'
import { ViewControls } from './ViewControls'

const MIN_POINT_DISTANCE = 1
const ACTION_CLASS =
  'rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700'

export type CanvasStageProps = {
  cropMode?: boolean
  onCropComplete?: () => void
}

/**
 * The canvas workspace. It owns pointer input mapping, view zoom, and the crop
 * marquee, and delegates all document state to the shared PaintEngine.
 */
export function CanvasStage({ cropMode = false, onCropComplete }: CanvasStageProps = {}) {
  const engine = usePaintEngine()
  const state = usePaintSnapshot()
  const view = useViewport({ documentWidth: engine.width, documentHeight: engine.height })
  const { fit, zoomIn, zoomOut } = view

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const draftRef = useRef<PaintOperation | null>(null)
  const drawingRef = useRef(false)
  const cropStartRef = useRef<Point | null>(null)
  const selectionStartRef = useRef<Point | null>(null)
  const moveRef = useRef<{ origin: Rect; start: Point } | null>(null)
  // Hand-drawn reveal animation for non-pointer (e.g. voice) operations.
  const extraPreviewRef = useRef<readonly PreviewItem[]>([])
  const prevOpCountRef = useRef<number | null>(null)
  const lastPointerAtRef = useRef(0)
  const animFrameRef = useRef<number | null>(null)
  const [textDraft, setTextDraft] = useState<{ x: number; y: number; value: string } | null>(null)
  const [selection, setSelection] = useState<Rect | null>(null)
  const [draftTool, setDraftTool] = useState(state.activeTool)
  const [crop, setCrop] = useState<{ active: boolean; rect: Rect | null }>({
    active: false,
    rect: null,
  })

  // React's recommended pattern for resetting state when a prop changes.
  if (crop.active !== cropMode) {
    setCrop({ active: cropMode, rect: null })
    setTextDraft(null)
    setSelection(null)
  }
  // A pending text placement only makes sense while the text tool is active.
  if (draftTool !== state.activeTool) {
    setDraftTool(state.activeTool)
    setTextDraft(null)
    setSelection(null)
  }
  const cropRect = crop.active ? crop.rect : null

  const paint = useCallback(() => {
    const context = contextRef.current
    if (!context) return
    const previews = extraPreviewRef.current
    const animating =
      previews.length > 0 ? new Set(previews.map((item) => item.operation.id)) : null
    const operations = animating
      ? engine.getOperations().filter((operation) => !animating.has(operation.id))
      : engine.getOperations()
    renderScene(context, {
      width: engine.width,
      height: engine.height,
      operations,
      preview: previews.length > 0 ? previews : draftRef.current,
      background: engine.background,
      resolveImage: getCachedImage,
    })
  }, [engine])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    contextRef.current = canvas.getContext('2d')
    engine.attachCanvas(canvas)
    paint()
    return () => {
      engine.attachCanvas(null)
      contextRef.current = null
    }
  }, [engine, paint])

  // Reveal each new non-pointer operation like it is being drawn by hand.
  useEffect(() => {
    const ops = engine.getOperations()
    const previous = prevOpCountRef.current
    prevOpCountRef.current = ops.length
    if (previous === null || ops.length <= previous) return

    const delta = ops.slice(previous)
    if (delta.every((operation) => operation.kind === 'stroke')) return
    // Manual actions happen right after pointer activity; voice actions do not.
    if (Date.now() - lastPointerAtRef.current < 500) return

    const duration = 200 * delta.length + 120
    const start = performance.now()
    const schedule = (callback: FrameRequestCallback): number =>
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame(callback)
        : window.setTimeout(() => callback(performance.now() + 16), 16)

    const tick = (now: number) => {
      const progress = clamp01((now - start) / duration)
      const staged = clamp01(progress * delta.length)
      extraPreviewRef.current = delta.map((operation, index) => ({
        operation: partialOperation(operation, clamp01(staged - index)),
        alpha: operation.kind === 'image' ? clamp01(staged - index) : undefined,
      }))
      paint()
      if (progress < 1) {
        animFrameRef.current = schedule(tick)
      } else {
        extraPreviewRef.current = []
        animFrameRef.current = null
        paint()
      }
    }
    animFrameRef.current = schedule(tick)
  }, [engine, paint, state.revision])

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current)
      extraPreviewRef.current = []
    }
  }, [])

  // Decode any newly imported images before repainting.
  useEffect(() => {
    const pending = engine
      .getOperations()
      .filter(isImageOperation)
      .map((operation) => operation.dataUrl)
      .filter((dataUrl) => getCachedImage(dataUrl) === null)

    if (pending.length === 0) {
      paint()
      return
    }

    let cancelled = false
    void preloadImages(pending).then(() => {
      if (!cancelled) paint()
    })
    return () => {
      cancelled = true
    }
  }, [engine, paint, state.revision])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    fit(viewport.clientWidth, viewport.clientHeight)
  }, [fit])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      if (event.deltaY < 0) zoomIn()
      else zoomOut()
    }
    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', handleWheel)
  }, [zoomIn, zoomOut])

  useEffect(() => {
    if (cropMode) return
    cropStartRef.current = null
  }, [cropMode])

  const handleFit = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    fit(viewport.clientWidth, viewport.clientHeight)
  }, [fit])

  const toDocumentPoint = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    return clientToDocumentPoint(
      event.clientX,
      event.clientY,
      canvas.getBoundingClientRect(),
      engine.width,
      engine.height,
    )
  }

  const capturePointer = (pointerId: number) => {
    const canvas = canvasRef.current
    if (canvas && typeof canvas.setPointerCapture === 'function') {
      canvas.setPointerCapture(pointerId)
    }
  }

  const releasePointer = (pointerId: number) => {
    const canvas = canvasRef.current
    if (
      canvas &&
      typeof canvas.releasePointerCapture === 'function' &&
      typeof canvas.hasPointerCapture === 'function' &&
      canvas.hasPointerCapture(pointerId)
    ) {
      canvas.releasePointerCapture(pointerId)
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    lastPointerAtRef.current = Date.now()
    if (event.pointerType === 'mouse' && event.button !== 0) return

    if (cropMode) {
      capturePointer(event.pointerId)
      const point = toDocumentPoint(event)
      cropStartRef.current = point
      setCrop({ active: true, rect: { x: point.x, y: point.y, width: 0, height: 0 } })
      return
    }

    const point = toDocumentPoint(event)
    const { activeTool, color, brushSize } = engine.getSnapshot()

    if (activeTool === 'fill') {
      engine.fillAt(point)
      return
    }

    if (activeTool === 'text') {
      setTextDraft({ x: point.x, y: point.y, value: '' })
      return
    }

    if (activeTool === 'select') {
      capturePointer(event.pointerId)
      if (selection && containsPoint(selection, point)) {
        moveRef.current = { origin: selection, start: point }
      } else {
        selectionStartRef.current = point
        setSelection({ x: point.x, y: point.y, width: 0, height: 0 })
      }
      return
    }

    if (!isStrokeTool(activeTool) && !isShapeTool(activeTool)) return

    capturePointer(event.pointerId)
    drawingRef.current = true
    draftRef.current = isStrokeTool(activeTool)
      ? {
          id: createId(),
          kind: 'stroke',
          tool: activeTool,
          color,
          size: brushSize,
          points: [point],
        }
      : {
          id: createId(),
          kind: 'shape',
          tool: activeTool,
          color,
          size: brushSize,
          start: point,
          end: point,
        }
    paint()
  }

  const commitText = () => {
    const draft = textDraft
    if (!draft) return
    engine.addText(draft.value, { x: draft.x, y: draft.y })
    setTextDraft(null)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    lastPointerAtRef.current = Date.now()
    if (cropMode) {
      const start = cropStartRef.current
      if (!start) return
      setCrop({ active: true, rect: normalizeRect(start, toDocumentPoint(event)) })
      return
    }

    const move = moveRef.current
    if (move) {
      const point = toDocumentPoint(event)
      setSelection({
        ...move.origin,
        x: move.origin.x + (point.x - move.start.x),
        y: move.origin.y + (point.y - move.start.y),
      })
      return
    }

    const selectionStart = selectionStartRef.current
    if (selectionStart) {
      setSelection(normalizeRect(selectionStart, toDocumentPoint(event)))
      return
    }

    if (!drawingRef.current) return
    const draft = draftRef.current
    if (!draft) return

    const point = toDocumentPoint(event)
    if (draft.kind === 'stroke') {
      const previous = draft.points[draft.points.length - 1]
      if (previous && distance(previous, point) < MIN_POINT_DISTANCE) return
      draft.points.push(point)
    } else if (draft.kind === 'shape') {
      draft.end = point
    }
    paint()
  }

  const finishStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    lastPointerAtRef.current = Date.now()
    if (cropMode) {
      cropStartRef.current = null
      releasePointer(event.pointerId)
      return
    }

    const move = moveRef.current
    if (move) {
      moveRef.current = null
      releasePointer(event.pointerId)
      const point = toDocumentPoint(event)
      const dx = point.x - move.start.x
      const dy = point.y - move.start.y
      if (Math.round(dx) !== 0 || Math.round(dy) !== 0) {
        engine.moveSelection(move.origin, dx, dy)
        setSelection({
          ...move.origin,
          x: move.origin.x + dx,
          y: move.origin.y + dy,
        })
      } else {
        setSelection(move.origin)
      }
      return
    }

    if (selectionStartRef.current) {
      selectionStartRef.current = null
      releasePointer(event.pointerId)
      setSelection((current) =>
        current && current.width >= 1 && current.height >= 1 ? current : null,
      )
      return
    }

    if (!drawingRef.current) return
    drawingRef.current = false
    releasePointer(event.pointerId)

    const draft = draftRef.current
    draftRef.current = null
    if (draft) engine.commit(draft)
    paint()
  }

  const applyCrop = () => {
    if (!cropRect || cropRect.width < 1 || cropRect.height < 1) return
    engine.cropDocument(cropRect)
    setCrop({ active: cropMode, rect: null })
    onCropComplete?.()
  }

  const cancelCrop = () => {
    setCrop({ active: cropMode, rect: null })
    onCropComplete?.()
  }

  const displayWidth = Math.max(1, Math.round(engine.width * view.zoom))
  const displayHeight = Math.max(1, Math.round(engine.height * view.zoom))
  const cropReady = cropRect !== null && cropRect.width >= 1 && cropRect.height >= 1

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ViewControls
          zoom={view.zoom}
          canZoomIn={view.canZoomIn}
          canZoomOut={view.canZoomOut}
          onZoomIn={view.zoomIn}
          onZoomOut={view.zoomOut}
          onFit={handleFit}
          onActualSize={view.actualSize}
        />
        {cropMode ? (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Crop">
            <span className="text-sm text-neutral-500">Drag on the canvas to choose an area</span>
            <button
              type="button"
              disabled={!cropReady}
              onClick={applyCrop}
              className={ACTION_CLASS}
            >
              Apply crop
            </button>
            <button type="button" onClick={cancelCrop} className={ACTION_CLASS}>
              Cancel crop
            </button>
          </div>
        ) : null}
        {!cropMode && state.activeTool === 'select' ? (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Selection">
            <span className="text-sm text-neutral-500">
              {selection
                ? 'Drag inside the selection to move it'
                : 'Drag on the canvas to select an area'}
            </span>
            {selection ? (
              <>
                <button
                  type="button"
                  onClick={() => engine.deleteSelection(selection)}
                  className={ACTION_CLASS}
                >
                  Delete
                </button>
                <button type="button" onClick={() => setSelection(null)} className={ACTION_CLASS}>
                  Deselect
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        ref={viewportRef}
        className="relative flex-1 overflow-auto rounded-lg border border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <div className="relative" style={{ width: displayWidth, height: displayHeight }}>
          <canvas
            ref={canvasRef}
            width={engine.width}
            height={engine.height}
            style={{ width: displayWidth, height: displayHeight }}
            className="block cursor-crosshair touch-none bg-white shadow-sm"
            role="img"
            aria-label="Drawing canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishStroke}
            onPointerCancel={finishStroke}
          />

          {cropMode && cropRect ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute border-2 border-blue-500 bg-blue-500/10"
              style={{
                left: cropRect.x * view.zoom,
                top: cropRect.y * view.zoom,
                width: cropRect.width * view.zoom,
                height: cropRect.height * view.zoom,
              }}
            />
          ) : null}

          {!cropMode && selection && state.activeTool === 'select' ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute border-2 border-dashed border-blue-500 bg-blue-500/10"
              style={{
                left: selection.x * view.zoom,
                top: selection.y * view.zoom,
                width: selection.width * view.zoom,
                height: selection.height * view.zoom,
              }}
            />
          ) : null}

          {textDraft ? (
            <div
              className="absolute z-10 flex items-center gap-1 rounded-md border border-blue-500 bg-white p-1 shadow-lg dark:bg-neutral-900"
              style={{ left: textDraft.x * view.zoom, top: textDraft.y * view.zoom }}
            >
              <input
                autoFocus
                type="text"
                aria-label="Text to add"
                placeholder="Type and press Enter"
                value={textDraft.value}
                onChange={(event) => setTextDraft({ ...textDraft, value: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    commitText()
                  } else if (event.key === 'Escape') {
                    event.preventDefault()
                    setTextDraft(null)
                  }
                }}
                className="w-40 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
              <button type="button" onClick={commitText} className={ACTION_CLASS}>
                Place text
              </button>
              <button type="button" onClick={() => setTextDraft(null)} className={ACTION_CLASS}>
                Cancel
              </button>
            </div>
          ) : null}

          {state.operationCount === 0 && !cropMode && state.activeTool !== 'select' ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="rounded bg-white/70 px-3 py-1 text-sm text-neutral-500 dark:bg-neutral-900/70 dark:text-neutral-400">
                Draw here with the mouse, or use the voice button below
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
