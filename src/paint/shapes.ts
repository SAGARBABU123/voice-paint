import { normalizeRect, type Rect } from './geometry'
import type { Point } from './types'

/**
 * All drawable shapes (the MS-Paint "Shapes" gallery). Lines, rectangles and
 * ellipses stay keyboard/voice-reachable; the rest are pointer-first tools.
 */
export const SHAPE_ORDER = [
  'line',
  'rectangle',
  'ellipse',
  'curve',
  'rounded-rectangle',
  'polygon',
  'triangle',
  'right-triangle',
  'diamond',
  'pentagon',
  'hexagon',
  'arrow-up',
  'arrow-right',
  'arrow-down',
  'arrow-left',
  'star-4',
  'star-5',
  'star-6',
  'chat',
  'callout-round',
  'callout-cloud',
  'heart',
  'lightning',
] as const

export type ShapeTool = (typeof SHAPE_ORDER)[number]

export function isShapeTool(tool: string): tool is ShapeTool {
  return (SHAPE_ORDER as readonly string[]).includes(tool)
}

export function centerOf(start: Point, end: Point): Point {
  return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
}

export function radiiOf(start: Point, end: Point): { x: number; y: number } {
  return {
    x: Math.abs(end.x - start.x) / 2,
    y: Math.abs(end.y - start.y) / 2,
  }
}

/** Vertices of a regular polygon inscribed in `outerRadius`. */
export function polygonPoints(
  center: Point,
  outerRadius: number,
  sides: number,
  startAngle = 0,
): Point[] {
  const points: Point[] = []
  for (let index = 0; index < sides; index += 1) {
    const angle = startAngle + (index * 2 * Math.PI) / sides
    points.push({
      x: center.x + Math.cos(angle) * outerRadius,
      y: center.y + Math.sin(angle) * outerRadius,
    })
  }
  return points
}

/** Vertices of an n-pointed star (inner circle is `innerRatio` of outer). */
export function starPoints(
  center: Point,
  outerRadius: number,
  innerRatio: number,
  pointsCount: number,
  startAngle = -Math.PI / 2,
): Point[] {
  const points: Point[] = []
  const total = pointsCount * 2
  for (let index = 0; index < total; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : outerRadius * innerRatio
    const angle = startAngle + (index * Math.PI) / pointsCount
    points.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    })
  }
  return points
}

/** A shape's bounding box from its drag start/end points. */
export function rectFrom(start: Point, end: Point): Rect {
  return normalizeRect(start, end)
}

/** Fill a point route; closes the path when `close` is true. */
export function tracePoints(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  close = true,
): void {
  if (points.length === 0) return
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index].y)
  }
  if (close) ctx.closePath()
}

/** Maps a unit-space point (0..1) into a shape rect. */
function unit(x: number, y: number, rect: Rect): Point {
  return { x: rect.x + x * rect.width, y: rect.y + y * rect.height }
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r)
  } else {
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
  }
  ctx.closePath()
}

/** Draws any supported shape (stroke only) from its drag start/end points. */
export function strokeShape(
  ctx: CanvasRenderingContext2D,
  tool: ShapeTool,
  start: Point,
  end: Point,
  fill = false,
): void {
  // Paint the current path: filled when the shape is filled (closed shapes
  // only), otherwise stroked. Open paths (line/curve) stay stroked.
  const finish = (fillable = true) => {
    if (fill && fillable) ctx.fill()
    else ctx.stroke()
  }

  if (tool === 'line') {
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    finish(false)
    return
  }

  const rect = rectFrom(start, end)
  const { x, y, width: w, height: h } = rect
  if (w < 1 || h < 1) return

  if (tool === 'rectangle') {
    if (fill) {
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      ctx.fill()
    } else {
      ctx.strokeRect(x, y, w, h)
    }
    return
  }

  if (tool === 'ellipse') {
    const center = centerOf(start, end)
    ctx.beginPath()
    ctx.ellipse(center.x, center.y, w / 2, h / 2, 0, 0, Math.PI * 2)
    finish()
    return
  }

  if (tool === 'curve') {
    const mid = centerOf(start, end)
    const dx = end.x - start.x
    const dy = end.y - start.y
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.quadraticCurveTo(mid.x - dy * 0.4, mid.y + dx * 0.4, end.x, end.y)
    finish(false)
    return
  }

  if (tool === 'rounded-rectangle') {
    roundedRectPath(ctx, x, y, w, h, Math.min(w, h) * 0.18)
    finish()
    return
  }

  if (tool === 'polygon') {
    // MS-Paint style polygon: a slightly irregular five-sided shape.
    const center = { x: x + w / 2, y: y + h / 2 }
    const outer = Math.min(w, h) / 2
    const radii = [1, 0.72, 1, 0.72, 1]
    const points = radii.map((r, index) => {
      const angle = (index * 2 * Math.PI) / 5
      return {
        x: center.x + Math.cos(angle) * outer * r,
        y: center.y + Math.sin(angle) * outer * r,
      }
    })
    tracePoints(ctx, points)
    finish()
    return
  }

  if (tool === 'hexagon' || tool === 'pentagon' || tool === 'diamond' || tool === 'triangle') {
    const center = { x: x + w / 2, y: y + h / 2 }
    const outer = Math.min(w, h) / 2
    const config: Record<string, { sides: number; startAngle: number }> = {
      triangle: { sides: 3, startAngle: -Math.PI / 2 },
      diamond: { sides: 4, startAngle: 0 },
      pentagon: { sides: 5, startAngle: -Math.PI / 2 },
      hexagon: { sides: 6, startAngle: 0 },
    }
    tracePoints(ctx, polygonPoints(center, outer, config[tool].sides, config[tool].startAngle))
    finish()
    return
  }

  if (tool === 'right-triangle') {
    tracePoints(ctx, [
      { x, y: y + h },
      { x: x + w, y: y + h },
      { x, y },
    ])
    finish()
    return
  }

  if (tool === 'star-4' || tool === 'star-5' || tool === 'star-6') {
    const center = { x: x + w / 2, y: y + h / 2 }
    const outer = Math.min(w, h) / 2
    const inner: Record<string, number> = { 'star-4': 0.35, 'star-5': 0.42, 'star-6': 0.5 }
    const points = tool === 'star-4' ? 4 : tool === 'star-5' ? 5 : 6
    tracePoints(ctx, starPoints(center, outer, inner[tool], points))
    finish()
    return
  }

  if (
    tool === 'arrow-up' ||
    tool === 'arrow-right' ||
    tool === 'arrow-down' ||
    tool === 'arrow-left'
  ) {
    const s = Math.min(w, h) * 0.62 // head size
    const shaft = Math.max(w, h) - s
    const cyMid = y + h / 2
    const cxMid = x + w / 2
    const points: Point[] =
      tool === 'arrow-right'
        ? [
            { x, y: cyMid - h * 0.28 },
            { x: x + shaft, y: cyMid - h * 0.28 },
            { x: x + shaft, y: cyMid - h * 0.5 },
            { x: x + w, y: cyMid },
            { x: x + shaft, y: cyMid + h * 0.5 },
            { x: x + shaft, y: cyMid + h * 0.28 },
            { x, y: cyMid + h * 0.28 },
          ]
        : tool === 'arrow-left'
          ? [
              { x: x + w, y: cyMid - h * 0.28 },
              { x: x + shaft, y: cyMid - h * 0.28 },
              { x: x + shaft, y: cyMid - h * 0.5 },
              { x, y: cyMid },
              { x: x + shaft, y: cyMid + h * 0.5 },
              { x: x + shaft, y: cyMid + h * 0.28 },
              { x: x + w, y: cyMid + h * 0.28 },
            ]
          : tool === 'arrow-down'
            ? [
                { x: cxMid - w * 0.28, y },
                { x: cxMid - w * 0.28, y: y + shaft },
                { x: cxMid - w * 0.5, y: y + shaft },
                { x: cxMid, y: y + h },
                { x: cxMid + w * 0.5, y: y + shaft },
                { x: cxMid + w * 0.28, y: y + shaft },
                { x: cxMid + w * 0.28, y },
              ]
            : [
                { x: cxMid - w * 0.28, y: y + h },
                { x: cxMid - w * 0.28, y: y + shaft },
                { x: cxMid - w * 0.5, y: y + shaft },
                { x: cxMid, y },
                { x: cxMid + w * 0.5, y: y + shaft },
                { x: cxMid + w * 0.28, y: y + shaft },
                { x: cxMid + w * 0.28, y: y + h },
              ]
    tracePoints(ctx, points)
    finish()
    return
  }

  if (tool === 'chat') {
    roundedRectPath(ctx, x, y, w, h, Math.min(w, h) * 0.22)
    ctx.moveTo(x + w * 0.16, y + h)
    ctx.lineTo(x + w * 0.16, y + h - h * 0.2)
    ctx.lineTo(x + w * 0.04, y + h - h * 0.06)
    ctx.closePath()
    finish()
    return
  }

  if (tool === 'callout-round') {
    const center = { x: x + w / 2, y: y + h * 0.42 }
    ctx.beginPath()
    ctx.ellipse(center.x, center.y, w / 2, h * 0.4, 0, 0, Math.PI * 2)
    ctx.moveTo(x + w * 0.3, y + h * 0.72)
    ctx.lineTo(x + w * 0.22, y + h)
    ctx.lineTo(x + w * 0.5, y + h * 0.86)
    ctx.closePath()
    finish()
    return
  }

  if (tool === 'callout-cloud') {
    ctx.beginPath()
    ctx.moveTo(x + w * 0.34, y + h * 0.66)
    ctx.bezierCurveTo(
      x + w * 0.1,
      y + h * 0.66,
      x + w * 0.1,
      y + h * 0.44,
      x + w * 0.26,
      y + h * 0.42,
    )
    ctx.bezierCurveTo(
      x + w * 0.2,
      y + h * 0.24,
      x + w * 0.42,
      y + h * 0.16,
      x + w * 0.52,
      y + h * 0.26,
    )
    ctx.bezierCurveTo(
      x + w * 0.52,
      y + h * 0.08,
      x + w * 0.82,
      y + h * 0.16,
      x + w * 0.8,
      y + h * 0.36,
    )
    ctx.bezierCurveTo(
      x + w * 1.02,
      y + h * 0.4,
      x + w * 0.98,
      y + h * 0.66,
      x + w * 0.78,
      y + h * 0.66,
    )
    ctx.lineTo(x + w * 0.5, y + h * 0.9)
    ctx.lineTo(x + w * 0.4, y + h * 0.64)
    ctx.closePath()
    finish()
    return
  }

  if (tool === 'heart') {
    ctx.beginPath()
    ctx.moveTo(x + w * 0.5, y + h)
    ctx.bezierCurveTo(
      x + w * 0.42,
      y + h * 0.9,
      x + w * 0.08,
      y + h * 0.72,
      x + w * 0.08,
      y + h * 0.4,
    )
    ctx.bezierCurveTo(
      x + w * 0.08,
      y + h * 0.2,
      x + w * 0.26,
      y + h * 0.08,
      x + w * 0.34,
      y + h * 0.2,
    )
    ctx.bezierCurveTo(
      x + w * 0.42,
      y + h * 0.32,
      x + w * 0.5,
      y + h * 0.5,
      x + w * 0.5,
      y + h * 0.5,
    )
    ctx.bezierCurveTo(
      x + w * 0.5,
      y + h * 0.5,
      x + w * 0.58,
      y + h * 0.32,
      x + w * 0.66,
      y + h * 0.2,
    )
    ctx.bezierCurveTo(
      x + w * 0.74,
      y + h * 0.08,
      x + w * 0.92,
      y + h * 0.2,
      x + w * 0.92,
      y + h * 0.4,
    )
    ctx.bezierCurveTo(x + w * 0.92, y + h * 0.72, x + w * 0.58, y + h * 0.9, x + w * 0.5, y + h)
    ctx.closePath()
    finish()
    return
  }

  if (tool === 'lightning') {
    const raw = [0.56, 0.04, 0.2, 0.56, 0.42, 0.56, 0.34, 0.96, 0.8, 0.36, 0.52, 0.36]
    const pts: Point[] = []
    for (let index = 0; index < raw.length; index += 2) {
      pts.push(unit(raw[index], raw[index + 1], rect))
    }
    tracePoints(ctx, pts)
    finish()
    return
  }

  // Unknown shape ids fall back to a rectangle so nothing silently vanishes.
  ctx.strokeRect(x, y, w, h)
}
