import { BACKGROUND_COLOR } from './constants'
import { centerOf, normalizeRect, radiiOf } from './geometry'
import type { PaintOperation } from './types'

/** Resolves a stored image data URL to something drawable (or null if not ready). */
export type ImageResolver = (dataUrl: string) => CanvasImageSource | null

/** Draws a single operation onto a 2D context, in document pixel coordinates. */
export function renderOperation(
  ctx: CanvasRenderingContext2D,
  operation: PaintOperation,
  resolveImage?: ImageResolver,
): void {
  if (operation.kind === 'image') {
    const source = resolveImage?.(operation.dataUrl) ?? null
    if (source) {
      ctx.drawImage(source, operation.x, operation.y, operation.width, operation.height)
    }
    return
  }

  if (operation.kind === 'text') {
    ctx.save()
    ctx.translate(operation.x, operation.y)
    if (operation.rotation) {
      ctx.rotate((operation.rotation * Math.PI) / 2)
    }
    ctx.fillStyle = operation.color
    ctx.font = `${operation.fontSize}px ${operation.fontFamily}`
    ctx.textBaseline = 'top'
    ctx.fillText(operation.text, 0, 0)
    ctx.restore()
    return
  }

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = operation.size

  if (operation.kind === 'stroke') {
    const color = operation.tool === 'eraser' ? BACKGROUND_COLOR : operation.color
    ctx.strokeStyle = color
    ctx.fillStyle = color

    if (operation.points.length === 1) {
      const [point] = operation.points
      ctx.beginPath()
      ctx.arc(point.x, point.y, operation.size / 2, 0, Math.PI * 2)
      ctx.fill()
    } else if (operation.points.length > 1) {
      ctx.beginPath()
      ctx.moveTo(operation.points[0].x, operation.points[0].y)
      for (let index = 1; index < operation.points.length; index += 1) {
        const point = operation.points[index]
        ctx.lineTo(point.x, point.y)
      }
      ctx.stroke()
    }
  } else {
    ctx.strokeStyle = operation.color
    const { start, end } = operation

    if (operation.tool === 'line') {
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    } else if (operation.tool === 'rectangle') {
      const rect = normalizeRect(start, end)
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    } else {
      const center = centerOf(start, end)
      const radius = radiiOf(start, end)
      ctx.beginPath()
      ctx.ellipse(center.x, center.y, radius.x, radius.y, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  ctx.restore()
}

export type RenderSceneOptions = {
  width: number
  height: number
  operations: readonly PaintOperation[]
  preview?: PaintOperation | null
  background?: string
  resolveImage?: ImageResolver
}

/**
 * Repaints the whole document: opaque background, committed operations, then an
 * optional live preview operation (the in-progress stroke/shape).
 */
export function renderScene(ctx: CanvasRenderingContext2D, options: RenderSceneOptions): void {
  const {
    width,
    height,
    operations,
    preview = null,
    background = BACKGROUND_COLOR,
    resolveImage,
  } = options

  ctx.save()
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)

  for (const operation of operations) {
    renderOperation(ctx, operation, resolveImage)
  }
  if (preview) {
    renderOperation(ctx, preview, resolveImage)
  }

  ctx.restore()
}
