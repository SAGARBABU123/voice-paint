import { BACKGROUND_COLOR } from './constants'
import { centerOf, normalizeRect, radiiOf } from './geometry'
import type { PaintOperation } from './types'

/** Draws a single operation onto a 2D context, in document pixel coordinates. */
export function renderOperation(ctx: CanvasRenderingContext2D, operation: PaintOperation): void {
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

/**
 * Repaints the whole document: opaque background, committed operations, then an
 * optional live preview operation (the in-progress stroke/shape).
 */
export function renderScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  operations: readonly PaintOperation[],
  preview: PaintOperation | null = null,
  background: string = BACKGROUND_COLOR,
): void {
  ctx.save()
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)

  for (const operation of operations) {
    renderOperation(ctx, operation)
  }
  if (preview) {
    renderOperation(ctx, preview)
  }

  ctx.restore()
}
