import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { usePaintEngine, usePaintSnapshot } from '../../hooks/PaintProvider'
import { clientToDocumentPoint } from '../../paint/coordinates'
import { distance } from '../../paint/geometry'
import { createId } from '../../paint/id'
import { renderScene } from '../../paint/renderer'
import { isStrokeTool, type PaintOperation, type Point } from '../../paint/types'

const MIN_POINT_DISTANCE = 1

/**
 * The canvas workspace. It owns pointer input mapping and delegates all state
 * to the shared PaintEngine, so toolbar and (later) voice actions share one path.
 */
export function CanvasStage() {
  const engine = usePaintEngine()
  const state = usePaintSnapshot()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const draftRef = useRef<PaintOperation | null>(null)
  const drawingRef = useRef(false)

  const paint = useCallback(() => {
    const context = contextRef.current
    if (!context) return
    renderScene(
      context,
      engine.width,
      engine.height,
      engine.getOperations(),
      draftRef.current,
      engine.background,
    )
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

  useEffect(() => {
    paint()
  }, [paint, state.revision])

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
    } else {
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

  return (
    <canvas
      ref={canvasRef}
      width={engine.width}
      height={engine.height}
      className="h-auto max-w-full cursor-crosshair touch-none rounded-lg border border-neutral-300 bg-white shadow-sm dark:border-neutral-700"
      role="img"
      aria-label="Drawing canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishStroke}
      onPointerCancel={finishStroke}
    />
  )
}
