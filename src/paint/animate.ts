import type { PaintOperation, Point } from './types'

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function lerpPoint(start: Point, end: Point, t: number): Point {
  return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t }
}

/**
 * A partially-revealed copy of an operation, for drawing shapes like a hand:
 * lines/shapes grow from their start, text appears letter by letter, and
 * strokes reveal along their points. Image operations (e.g. a fill) are faded
 * in with `alpha` by the caller instead.
 */
export function partialOperation(operation: PaintOperation, progress: number): PaintOperation {
  const t = clamp01(progress)

  if (operation.kind === 'shape') {
    return { ...operation, end: lerpPoint(operation.start, operation.end, t) }
  }
  if (operation.kind === 'stroke') {
    const keep = Math.max(1, Math.ceil(operation.points.length * t))
    return { ...operation, points: operation.points.slice(0, keep) }
  }
  if (operation.kind === 'text') {
    const keep = Math.ceil(operation.text.length * t)
    return { ...operation, text: operation.text.slice(0, keep) }
  }
  return operation
}
