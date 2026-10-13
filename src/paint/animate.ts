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

/** Length of a quiet pen-lift pause between strokes, in units of one stroke. */
export const PEN_LIFT_GAP = 0.25

/**
 * Total reveal window (ms) for a batch: one slot per stroke plus a short
 * pen-lift gap between neighbours. Bounded so a traced photo finishes in a
 * lively window instead of dragging on.
 */
export function revealDuration(
  count: number,
  gap = PEN_LIFT_GAP,
  perStrokeMs = 200,
  maxMs = 14_000,
): number {
  const slots = Math.max(0, count) + gap * Math.max(0, count - 1)
  return Math.min(maxMs, Math.max(120, perStrokeMs * slots + 120))
}

/**
 * How far stroke `index` has been revealed at global batch progress (0..1).
 * Strokes draw strictly one after another, with the pen lifting for `gap`
 * between neighbours: stroke 0 finishes, the pen lifts, stroke 1 starts...
 */
export function strokeReveal(
  index: number,
  count: number,
  progress: number,
  gap = PEN_LIFT_GAP,
): number {
  if (count <= 0) return 0
  const spacing = 1 + gap
  const raw = clamp01(progress) * (count + gap * (count - 1)) - index * spacing
  return clamp01(raw)
}

/**
 * Index of the stroke currently being drawn at batch progress, or null when
 * the pen is lifted (before the first stroke, between strokes, after the
 * last). Used to park the pen-cursor on the sheet.
 */
export function activeStrokeIndex(
  count: number,
  progress: number,
  gap = PEN_LIFT_GAP,
): number | null {
  if (count <= 0) return null
  const spacing = 1 + gap
  const total = count + gap * (count - 1)
  const raw = clamp01(progress) * total
  if (raw <= 0 || raw >= total) return null
  const index = Math.min(count - 1, Math.floor(raw / spacing))
  return raw - index * spacing < 1 ? index : null
}

/**
 * The pen's current contact point on a partial stroke: the last point that
 * would be included in `partialOperation(stroke, progress)`. Non-stroke
 * operations have no pen contact.
 */
export function penTip(operation: PaintOperation, progress: number): Point | null {
  if (operation.kind !== 'stroke' || operation.points.length === 0) return null
  const t = clamp01(progress)
  const keep = Math.min(
    operation.points.length,
    Math.max(1, Math.ceil(operation.points.length * t)),
  )
  return operation.points[keep - 1] ?? null
}
