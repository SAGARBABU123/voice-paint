import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { usePaintEngine, usePaintSnapshot } from '../../hooks/PaintProvider'
import { getCursorPositionStore } from '../../hooks/useCursorPosition'
import { getViewportStore } from '../../hooks/useViewport'
import { isEditableTarget } from '../../keyboard/shortcuts'
import {
  activeStrokeIndex,
  clamp01,
  partialOperation,
  penTip,
  revealDuration,
  strokeReveal,
} from '../../paint/animate'
import { clientToDocumentPoint } from '../../paint/coordinates'
import { copyRegion, getClipboardImage, setClipboardImage } from '../../paint/clipboard'
import { containsPoint, distance, normalizeRect, type Rect } from '../../paint/geometry'
import { createId } from '../../paint/id'
import { getCachedImage, preloadImages } from '../../paint/imageCache'
import { importImageFile } from '../../paint/importImage'
import { renderScene, type PreviewItem } from '../../paint/renderer'
import {
  isImageOperation,
  isShapeTool,
  isStrokeTool,
  type PaintOperation,
  type Point,
} from '../../paint/types'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Icon } from '../ui/Icon'
import { useToast } from '../ui/useToast'

const MIN_POINT_DISTANCE = 1

function normalizeDirection(x: number, y: number): Point {
  const length = Math.hypot(x, y)
  return length > 1e-6 ? { x: x / length, y: y / length } : { x: 1, y: 0 }
}

/**
 * Small pencil glyph painted on the sheet while a batch is being revealed:
 * the graphite tip sits on the point currently being written and the body
 * tilts along the pen's travel direction, sized to the active brush.
 */
function drawPenCursor(
  context: CanvasRenderingContext2D,
  tip: Point,
  direction: Point,
  brushSize: number,
): void {
  const height = Math.max(9, Math.min(20, brushSize * 6))
  const length = height * 1.7
  const half = height / 2

  context.save()
  context.translate(tip.x, tip.y)
  // The tip points along travel; rotate the glyph so the lead meets the sheet.
  context.rotate(Math.atan2(direction.y, direction.x))

  // Graphite lead, narrow at the contact point.
  context.beginPath()
  context.moveTo(0, 0)
  context.lineTo(length * 0.3, -half * 0.55)
  context.lineTo(length * 0.3, half * 0.55)
  context.closePath()
  context.fillStyle = '#1f1d26'
  context.fill()

  // Wooden body in a warm tone with a flat rear end.
  context.beginPath()
  context.moveTo(length * 0.3, -half * 0.55)
  context.lineTo(length * 0.72, -half * 0.62)
  context.lineTo(length, -half * 0.42)
  context.lineTo(length, half * 0.42)
  context.lineTo(length * 0.72, half * 0.62)
  context.lineTo(length * 0.3, half * 0.55)
  context.closePath()
  context.fillStyle = '#e8e0cc'
  context.fill()
  context.strokeStyle = 'rgba(20, 18, 26, 0.35)'
  context.lineWidth = Math.max(1, height / 12)
  context.stroke()

  // Soft contact dot so the writing point reads clearly on any background.
  context.beginPath()
  context.arc(0, 0, Math.max(1.2, height / 12), 0, Math.PI * 2)
  context.fillStyle = 'rgba(31, 29, 38, 0.4)'
  context.fill()

  context.restore()
}

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
  const toast = useToast()
  // Permanent fit-to-width: the sheet always spans the playground's full
  // width and never zooms in/out on its own.
  const [scale, setScale] = useState(1)
  // User zoom (multiplier over the fit scale) and pan offset in CSS px.
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const draftRef = useRef<PaintOperation | null>(null)
  const drawingRef = useRef(false)
  // True while a shape is being drag-drawn with Shift held (straight/square).
  const shiftLockRef = useRef(false)
  const cropStartRef = useRef<Point | null>(null)
  const selectionStartRef = useRef<Point | null>(null)
  const moveRef = useRef<{ origin: Rect; start: Point } | null>(null)
  // Hand-drawn reveal animation for non-pointer (e.g. voice) operations.
  const extraPreviewRef = useRef<readonly PreviewItem[]>([])
  // A pen whose tip sits on the sheet at the point currently being written.
  const penTipRef = useRef<{ point: Point; direction: Point } | null>(null)
  const prevOpCountRef = useRef<number | null>(null)
  const lastPointerAtRef = useRef(0)
  const animFrameRef = useRef<number | null>(null)
  // Space-drag / middle-drag panning.
  const spaceDownRef = useRef(false)
  const panGestureRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const [textDraft, setTextDraft] = useState<{ x: number; y: number; value: string } | null>(null)
  const [selection, setSelection] = useState<Rect | null>(null)
  const [draftTool, setDraftTool] = useState(state.activeTool)
  const [crop, setCrop] = useState<{ active: boolean; rect: Rect | null }>({
    active: false,
    rect: null,
  })
  const [hover, setHover] = useState<Point | null>(null)
  const [draggingFile, setDraggingFile] = useState(false)
  // True while Space is held (pan affordance cursor).
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [hasClipboard, setHasClipboard] = useState(() => getClipboardImage() !== null)
  // Clear lives on the sheet's corner, so its confirmation dialog lives here too.
  const [confirmClear, setConfirmClear] = useState(false)

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
    // Keep a selection made for the select tool (e.g. Ctrl+A); clear it when
    // leaving the tool so stale marquees never linger.
    if (state.activeTool !== 'select') setSelection(null)
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
    const pen = penTipRef.current
    if (pen) drawPenCursor(context, pen.point, pen.direction, engine.getSnapshot().brushSize)
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
    // A sketch/voice batch of strokes is "written" stroke by stroke. Only a
    // single stroke just drawn by the pointer skips the animation (it was
    // already drawn live). Multi-stroke batches — e.g. a traced photo — are
    // always worth the reveal, no matter how recently the sheet was touched.
    if (
      delta.length === 1 &&
      delta[0]?.kind === 'stroke' &&
      Date.now() - lastPointerAtRef.current < 500
    ) {
      return
    }

    // A newer batch supersedes any reveal still in flight.
    if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current)

    // Long batches (e.g. a traced photo) draw stroke-by-stroke like a hand,
    // with a short pen-lift pause between lines, finishing in a lively window.
    const duration = revealDuration(delta.length)
    const start = performance.now()
    const schedule = (callback: FrameRequestCallback): number =>
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame(callback)
        : window.setTimeout(() => callback(performance.now() + 16), 16)

    const tick = (now: number) => {
      const progress = clamp01((now - start) / duration)
      const activeIndex = activeStrokeIndex(delta.length, progress)
      extraPreviewRef.current = delta.map((operation, index) => {
        const reveal = strokeReveal(index, delta.length, progress)
        return {
          operation: partialOperation(operation, reveal),
          alpha: operation.kind === 'image' ? reveal : undefined,
        }
      })

      // Park a pen on the sheet at the point currently being written. During
      // a lift gap the pen is mid-air, so it disappears until the next line.
      if (activeIndex !== null) {
        const operation = delta[activeIndex]
        const reveal = strokeReveal(activeIndex, delta.length, progress)
        if (operation) {
          const point = penTip(operation, reveal)
          const previousPoint =
            operation.kind === 'stroke'
              ? operation.points[Math.max(0, Math.ceil(operation.points.length * reveal) - 2)]
              : point
          if (point) {
            const direction = previousPoint
              ? normalizeDirection(point.x - previousPoint.x, point.y - previousPoint.y)
              : { x: 1, y: 0 }
            penTipRef.current = { point, direction }
          }
        }
      } else {
        penTipRef.current = null
      }
      paint()
      if (progress < 1) {
        animFrameRef.current = schedule(tick)
      } else {
        extraPreviewRef.current = []
        penTipRef.current = null
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
      penTipRef.current = null
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

  // The canvas IS the playground: plain white sheet covering the whole div.
  // Fit the whole sheet inside the workspace with a small margin, so the user
  // always sees the entire canvas (a paint app shows the full artboard).
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const compute = () => {
      const margin = 48
      const width = Math.max(1, viewport.clientWidth - margin)
      const height = Math.max(1, viewport.clientHeight - margin)
      setScale(Math.max(0.05, Math.min(width / engine.width, height / engine.height)))
    }
    compute()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(compute) : null
    observer?.observe(viewport)
    window.addEventListener('resize', compute)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', compute)
    }
  }, [engine])

  // --- View zoom & pan ---------------------------------------------------
  const viewScale = scale * zoom
  const clampZoom = useCallback(
    (next: number) => {
      const min = 0.1 / scale
      const max = 64 / scale
      return Math.max(min, Math.min(max, next))
    },
    [scale],
  )

  const zoomAround = useCallback(
    (factor: number, clientX: number, clientY: number) => {
      const viewport = viewportRef.current
      if (!viewport) return
      setZoom((current) => {
        const next = clampZoom(current * factor)
        const applied = next / current
        const rect = viewport.getBoundingClientRect()
        const vx = rect.left + rect.width / 2
        const vy = rect.top + rect.height / 2
        // Keep the point under the cursor fixed while the sheet scales.
        setPan((p) => ({
          x: applied * p.x + (1 - applied) * (clientX - vx),
          y: applied * p.y + (1 - applied) * (clientY - vy),
        }))
        return next
      })
    },
    [clampZoom],
  )
  const zoomAroundRef = useRef(zoomAround)
  useEffect(() => {
    zoomAroundRef.current = zoomAround
  }, [zoomAround])

  const zoomBy = useCallback(
    (factor: number) => {
      const rect = viewportRef.current?.getBoundingClientRect()
      if (rect) zoomAround(factor, rect.left + rect.width / 2, rect.top + rect.height / 2)
    },
    [zoomAround],
  )

  const fitView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const actualSize = useCallback(() => {
    setZoom((current) => {
      const next = clampZoom(1 / scale)
      const applied = next / current
      setPan((p) => ({ x: applied * p.x, y: applied * p.y }))
      return next
    })
  }, [clampZoom, scale])

  // Publish the zoom level for the status bar and expose the zoom commands.
  useEffect(() => {
    getViewportStore().setSnapshot({
      percent: Math.round(viewScale * 100),
      canZoomIn: viewScale < 64 - 1e-6,
      canZoomOut: viewScale > 0.1 + 1e-6,
    })
  }, [viewScale])

  useEffect(() => {
    return getViewportStore().registerCommands({
      zoomIn: () => zoomBy(1.25),
      zoomOut: () => zoomBy(1 / 1.25),
      fit: fitView,
      actualSize,
    })
  }, [zoomBy, fitView, actualSize])

  // Wheel zooms around the cursor (non-passive so we can prevent the default).
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      zoomAroundRef.current(event.deltaY < 0 ? 1.1 : 1 / 1.1, event.clientX, event.clientY)
    }
    viewport.addEventListener('wheel', onWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', onWheel)
  }, [])

  // Space-drag panning + zoom keyboard shortcuts.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return
      if (event.code === 'Space' && !event.repeat) {
        spaceDownRef.current = true
        setSpaceHeld(true)
        return
      }
      if (!event.ctrlKey && !event.metaKey) return
      if (event.key === '0') {
        event.preventDefault()
        fitView()
      } else if (event.key === '1') {
        event.preventDefault()
        actualSize()
      } else if (event.key === '=' || event.key === '+') {
        event.preventDefault()
        zoomBy(1.25)
      } else if (event.key === '-') {
        event.preventDefault()
        zoomBy(1 / 1.25)
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        spaceDownRef.current = false
        setSpaceHeld(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [actualSize, fitView, zoomBy])

  useEffect(() => {
    if (cropMode) return
    cropStartRef.current = null
  }, [cropMode])

  const handleDragEnter = (event: ReactDragEvent) => {
    if (event.dataTransfer.types.includes('Files')) setDraggingFile(true)
  }

  const handleDragOver = (event: ReactDragEvent) => {
    if (event.dataTransfer.types.includes('Files')) event.preventDefault()
  }

  const handleDragLeave = (event: ReactDragEvent) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setDraggingFile(false)
    }
  }

  const handleDrop = (event: ReactDragEvent) => {
    event.preventDefault()
    setDraggingFile(false)
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    void importImageFile(engine, file).then((ok) => {
      if (!ok) {
        toast.show({
          title: 'Could not open that image',
          description: 'Please choose a PNG or JPEG file.',
          variant: 'error',
        })
      }
    })
  }

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

  /** Reads the composited pixel colour at a document point (eyedropper). */
  const sampleColorAt = (point: Point): string | null => {
    const context = contextRef.current
    if (!context) return null
    const x = Math.floor(point.x)
    const y = Math.floor(point.y)
    if (x < 0 || y < 0 || x >= engine.width || y >= engine.height) return null
    const [r, g, b] = context.getImageData(x, y, 1, 1).data
    const hex = (value: number) => value.toString(16).padStart(2, '0')
    return `#${hex(r)}${hex(g)}${hex(b)}`
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
    // Space-drag (or middle-drag) pans the view instead of drawing.
    if (spaceDownRef.current || (event.pointerType === 'mouse' && event.button === 1)) {
      event.preventDefault()
      capturePointer(event.pointerId)
      panGestureRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: pan.x,
        originY: pan.y,
      }
      return
    }
    if (event.pointerType === 'mouse' && event.button !== 0) return

    // Eyedropper: the tool, or Alt-click with any tool, samples the canvas.
    if (state.activeTool === 'eyedropper' || event.altKey) {
      const sampled = sampleColorAt(toDocumentPoint(event))
      if (sampled) engine.setColor(sampled)
      return
    }

    if (cropMode) {
      capturePointer(event.pointerId)
      const point = toDocumentPoint(event)
      cropStartRef.current = point
      setCrop({ active: true, rect: { x: point.x, y: point.y, width: 0, height: 0 } })
      return
    }

    const point = toDocumentPoint(event)
    const { activeTool, color, brushSize, strokeStyle } = engine.getSnapshot()

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
    // Lock to straight lines / perfect shapes for the whole gesture.
    shiftLockRef.current = event.shiftKey
    draftRef.current = isStrokeTool(activeTool)
      ? {
          id: createId(),
          kind: 'stroke',
          tool: activeTool,
          color,
          size: brushSize,
          style: strokeStyle,
          points: [point],
        }
      : {
          id: createId(),
          kind: 'shape',
          tool: activeTool,
          color,
          size: brushSize,
          style: strokeStyle,
          fill: state.shapeFill,
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
    const gesture = panGestureRef.current
    if (gesture) {
      setPan({
        x: gesture.originX + (event.clientX - gesture.startX),
        y: gesture.originY + (event.clientY - gesture.startY),
      })
      return
    }
    // Live X/Y read-out for the status bar + the brush-size cursor ring.
    const hoverPoint = toDocumentPoint(event)
    getCursorPositionStore().set({ x: Math.round(hoverPoint.x), y: Math.round(hoverPoint.y) })
    setHover(hoverPoint)
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
      if (shiftLockRef.current) {
        const dx = point.x - draft.start.x
        const dy = point.y - draft.start.y
        if (draft.tool === 'line') {
          const length = Math.hypot(dx, dy)
          if (length >= 0.001) {
            const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4)
            draft.end = {
              x: draft.start.x + Math.cos(angle) * length,
              y: draft.start.y + Math.sin(angle) * length,
            }
          }
        } else {
          // Perfect square / circle, keeping drag direction.
          const side = Math.max(Math.abs(dx), Math.abs(dy))
          draft.end = {
            x: draft.start.x + Math.sign(dx) * side,
            y: draft.start.y + Math.sign(dy) * side,
          }
        }
      } else {
        draft.end = point
      }
    }
    paint()
  }

  const finishStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    lastPointerAtRef.current = Date.now()
    const gesture = panGestureRef.current
    if (gesture) {
      panGestureRef.current = null
      releasePointer(event.pointerId)
      return
    }
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
    shiftLockRef.current = false
    releasePointer(event.pointerId)

    const draft = draftRef.current
    draftRef.current = null
    if (draft) engine.commit(draft)
    paint()
  }

  const applyCrop = useCallback(() => {
    if (!cropRect || cropRect.width < 1 || cropRect.height < 1) return
    engine.cropDocument(cropRect)
    setCrop({ active: cropMode, rect: null })
    onCropComplete?.()
  }, [cropRect, cropMode, engine, onCropComplete])

  const cancelCrop = useCallback(() => {
    setCrop({ active: cropMode, rect: null })
    onCropComplete?.()
  }, [cropMode, onCropComplete])

  // Canvas-level keys: Delete/Backspace removes a selection, Escape deselects
  // or cancels crop mode. Text inputs keep their own handlers (guarded by
  // isEditableTarget).
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return

      if (cropMode) {
        if (event.key === 'Escape') {
          event.preventDefault()
          cancelCrop()
        }
        return
      }

      if (state.activeTool !== 'select') return

      if (event.key === 'Escape') {
        setSelection(null)
        return
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selection && selection.width >= 1 && selection.height >= 1) {
          event.preventDefault()
          engine.deleteSelection(selection)
          setSelection(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cropMode, state.activeTool, selection, engine, cancelCrop])

  // --- Selection clipboard (copy / cut / paste / duplicate / select all) ----
  const copySelection = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !selection) return false
    const clip = copyRegion(canvas, selection)
    if (!clip) return false
    setClipboardImage(clip)
    setHasClipboard(true)
    return true
  }, [selection])

  const cutSelection = useCallback(() => {
    if (!selection) return
    if (copySelection()) {
      engine.deleteSelection(selection)
      setSelection(null)
    }
  }, [copySelection, engine, selection])

  const pasteClipboard = useCallback(() => {
    const clip = getClipboardImage()
    if (!clip) return
    const x = selection ? Math.round(selection.x) + 16 : Math.round((engine.width - clip.width) / 2)
    const y = selection
      ? Math.round(selection.y) + 16
      : Math.round((engine.height - clip.height) / 2)
    engine.pasteImage(clip.dataUrl, clip.width, clip.height, x, y)
    setSelection({ x, y, width: clip.width, height: clip.height })
  }, [engine, selection])

  const duplicateSelection = useCallback(() => {
    if (copySelection()) pasteClipboard()
  }, [copySelection, pasteClipboard])

  const selectAll = useCallback(() => {
    engine.setTool('select')
    setSelection({ x: 0, y: 0, width: engine.width, height: engine.height })
  }, [engine])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return
      if (!event.ctrlKey && !event.metaKey) return
      const key = event.key.toLowerCase()
      if (key === 'a') {
        event.preventDefault()
        selectAll()
      } else if (key === 'c') {
        if (copySelection()) event.preventDefault()
      } else if (key === 'x') {
        event.preventDefault()
        cutSelection()
      } else if (key === 'v') {
        event.preventDefault()
        pasteClipboard()
      } else if (key === 'd') {
        event.preventDefault()
        duplicateSelection()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [copySelection, cutSelection, pasteClipboard, duplicateSelection, selectAll])

  const displayWidth = Math.max(1, Math.round(engine.width * viewScale))
  const displayHeight = Math.max(1, Math.round(engine.height * viewScale))
  const cropReady = cropRect !== null && cropRect.width >= 1 && cropRect.height >= 1
  // Brush-size cursor ring (Krita/MS-Paint pattern) for stroke tools.
  const showBrushRing =
    hover !== null && !cropMode && (state.activeTool === 'pencil' || state.activeTool === 'eraser')
  const brushRingSize = Math.max(3, Math.round(state.brushSize * viewScale))

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex min-h-9 flex-wrap items-center justify-end gap-2">
        {cropMode ? (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Crop">
            <span className="text-sm text-surface-500">Drag on the canvas to choose an area</span>
            <Button size="sm" disabled={!cropReady} onClick={applyCrop}>
              Apply crop
            </Button>
            <Button variant="secondary" size="sm" onClick={cancelCrop}>
              Cancel crop
            </Button>
          </div>
        ) : null}
        {!cropMode && state.activeTool === 'select' ? (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Selection">
            <span className="text-sm text-surface-500">
              {selection
                ? 'Drag inside the selection to move it'
                : 'Drag on the canvas to select an area'}
            </span>
            <Button variant="secondary" size="sm" onClick={selectAll}>
              Select all
            </Button>
            <Button variant="secondary" size="sm" disabled={!hasClipboard} onClick={pasteClipboard}>
              Paste
            </Button>
            {selection ? (
              <>
                <Button variant="secondary" size="sm" onClick={copySelection}>
                  Copy
                </Button>
                <Button variant="secondary" size="sm" onClick={cutSelection}>
                  Cut
                </Button>
                <Button variant="secondary" size="sm" onClick={duplicateSelection}>
                  Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="vault-btn-ghost-danger"
                  onClick={() => {
                    engine.deleteSelection(selection)
                    setSelection(null)
                  }}
                >
                  Delete
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setSelection(null)}>
                  Deselect
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={viewportRef}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`absolute inset-0 flex overflow-hidden bg-surface-200 ${
            spaceHeld ? 'cursor-grab' : ''
          }`}
        >
          <div
            className="relative m-auto block shadow-raised ring-1 ring-surface-300/70"
            style={{
              width: displayWidth,
              height: displayHeight,
              transform: `translate(${pan.x}px, ${pan.y}px)`,
            }}
          >
            <canvas
              ref={canvasRef}
              width={engine.width}
              height={engine.height}
              style={{ width: displayWidth, height: displayHeight }}
              className="block cursor-default touch-none bg-surface-0"
              role="img"
              aria-label="Drawing canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishStroke}
              onPointerCancel={finishStroke}
              onPointerLeave={() => {
                getCursorPositionStore().set(null)
                setHover(null)
              }}
            />

            {showBrushRing ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute z-20 rounded-full border-[1.5px] border-black/40"
                style={{
                  left: hover.x * viewScale - brushRingSize / 2,
                  top: hover.y * viewScale - brushRingSize / 2,
                  width: brushRingSize,
                  height: brushRingSize,
                }}
              />
            ) : null}

            {cropMode && cropRect ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute rounded-sm border-2 border-brand-500 bg-brand-500/10"
                style={{
                  left: cropRect.x * viewScale,
                  top: cropRect.y * viewScale,
                  width: cropRect.width * viewScale,
                  height: cropRect.height * viewScale,
                }}
              />
            ) : null}

            {!cropMode && selection && state.activeTool === 'select' ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute rounded-sm border-2 border-dashed border-brand-500 bg-brand-500/10"
                style={{
                  left: selection.x * viewScale,
                  top: selection.y * viewScale,
                  width: selection.width * viewScale,
                  height: selection.height * viewScale,
                }}
              />
            ) : null}

            {textDraft ? (
              <div
                className="absolute z-10 flex items-center gap-1.5 rounded-lg border border-brand-200 bg-surface-0 p-1.5 shadow-raised"
                style={{ left: textDraft.x * viewScale, top: textDraft.y * viewScale }}
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
                  className="vault-input vault-input--sm w-44"
                />
                <Button size="sm" onClick={commitText}>
                  Place text
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setTextDraft(null)}>
                  Cancel
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Always centred in the visible playground (never moves). */}
        {state.operationCount === 0 && !cropMode && state.activeTool !== 'select' ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex max-w-xs flex-col items-center gap-2.5 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700 shadow-soft">
                <Icon name="brush" size={22} />
              </span>
              <p className="font-display text-15 font-semibold tracking-tight text-surface-700">
                Your canvas is ready
              </p>
              <p className="text-13 leading-relaxed text-surface-500">
                Draw here with the mouse, or use the voice button to paint with your voice.
              </p>
            </div>
          </div>
        ) : null}

        {/* Clear — neutral icon-only chip pinned to the sheet's corner. */}
        <div className="absolute right-2 top-2 z-30 flex items-center gap-1 rounded-lg border border-surface-200/80 bg-surface-0/90 p-1 shadow-soft backdrop-blur-sm">
          <Button
            variant="ghost"
            size="xs"
            aria-label="Clear canvas"
            title="Clear canvas"
            disabled={state.operationCount === 0}
            onClick={() => setConfirmClear(true)}
          >
            <Icon name="trash" size={14} />
          </Button>
        </div>

        {/* Drop target feedback — an image needs a moment to decode, so the
            overlay confirms the file will land on the document. */}
        {draggingFile ? (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-brand-500/10">
            <div className="flex items-center gap-2 rounded-lg border border-brand-300 bg-surface-0 px-4 py-2.5 text-sm font-medium text-brand-800 shadow-raised">
              <Icon name="image" size={16} />
              Drop PNG or JPEG to add it
            </div>
          </div>
        ) : null}
      </div>

      {confirmClear ? (
        <ConfirmDialog
          title="Clear the canvas?"
          description="This removes the current drawing. Do you want to continue?"
          confirmLabel="Clear"
          onConfirm={() => {
            engine.clear()
            setConfirmClear(false)
          }}
          onCancel={() => setConfirmClear(false)}
        />
      ) : null}
    </div>
  )
}
