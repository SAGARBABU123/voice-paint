import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { usePaintEngine, usePaintSnapshot } from '../../hooks/PaintProvider'
import { useViewport } from '../../hooks/useViewport'
import { clientToDocumentPoint } from '../../paint/coordinates'
import { distance } from '../../paint/geometry'
import { createId } from '../../paint/id'
import { getCachedImage, preloadImages } from '../../paint/imageCache'
import { renderScene } from '../../paint/renderer'
import { isImageOperation, isStrokeTool, type PaintOperation, type Point } from '../../paint/types'
import { ViewControls } from './ViewControls'

const MIN_POINT_DISTANCE = 1

/**
 * The canvas workspace. It owns pointer input mapping and view zoom, and
 * delegates all document state to the shared PaintEngine.
 */
export function CanvasStage() {
  const engine = usePaintEngine()
  const state = usePaintSnapshot()
  const view = useViewport({ documentWidth: engine.width, documentHeight: engine.height })
  const { fit, zoomIn, zoomOut } = view

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const draftRef = useRef<PaintOperation | null>(null)
  const drawingRef = useRef(false)

  const paint = useCallback(() => {
    const context = contextRef.current
    if (!context) return
    renderScene(context, {
      width: engine.width,
      height: engine.height,
      operations: engine.getOperations(),
      preview: draftRef.current,
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

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const canvas = canvasRef.current
    if (canvas && typeof canvas.setPointerCapture === 'function') {
      canvas.setPointerCapture(event.pointerId)
    }
    drawingRef.current = true

    const point = toDocumentPoint(event)
    const { activeTool, color, brushSize } = engine.getSnapshot()
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

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
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
    if (!drawingRef.current) return
    drawingRef.current = false

    const canvas = canvasRef.current
    if (
      canvas &&
      typeof canvas.releasePointerCapture === 'function' &&
      typeof canvas.hasPointerCapture === 'function' &&
      canvas.hasPointerCapture(event.pointerId)
    ) {
      canvas.releasePointerCapture(event.pointerId)
    }

    const draft = draftRef.current
    draftRef.current = null
    if (draft) engine.commit(draft)
    paint()
  }

  const displayWidth = Math.max(1, Math.round(engine.width * view.zoom))
  const displayHeight = Math.max(1, Math.round(engine.height * view.zoom))

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <ViewControls
        zoom={view.zoom}
        canZoomIn={view.canZoomIn}
        canZoomOut={view.canZoomOut}
        onZoomIn={view.zoomIn}
        onZoomOut={view.zoomOut}
        onFit={handleFit}
        onActualSize={view.actualSize}
      />

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
          {state.operationCount === 0 ? (
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
