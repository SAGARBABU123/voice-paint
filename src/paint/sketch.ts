import type { Point } from './types'

/**
 * Options shared by the sketch pipeline. `sketchImage` (the browser
 * orchestrator) maps these onto the OpenCV.js and rough.js engines; the pure
 * helpers in this module only use `minLength`, `maxPointsPerLine` and seed
 * math, so they stay unit-testable without a canvas, WASM, or the DOM.
 */
export type SketchOptions = {
  /** Edge sensitivity (0..1, lower = more edges). Default 0.28. */
  threshold?: number
  /** Minimum contour points kept after DP simplification. Default 3. */
  minLength?: number
  /** approxPolyDP tolerance in px (higher = straighter). Default 0.75. */
  epsilon?: number
  /** Maximum points kept per contour (evenly resampled). Default 80. */
  maxPointsPerLine?: number
  /** Hand-drawn roughness passed to rough.js (0 = smooth, 1 = sketchy). Default 0.7. */
  roughness?: number
  /** Fixed seed for reproducible strokes. When unset, derived from the image. */
  seed?: number
  /** Maximum strokes kept from a busy photo. Default 500. */
  maxStrokes?: number
}

/** A traced contour from an image, in pixel space. */
export type SketchContour = {
  points: Point[]
  /** Bounding box in pixel space. */
  box: { x: number; y: number; width: number; height: number }
  /** Area in px² from OpenCV (absolute). */
  area: number
  /** Total polyline length in px. */
  length: number
}

/** Summed segment length of a polyline. */
export function contourLength(points: readonly Point[]): number {
  let total = 0
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]
    const b = points[i]
    total += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return total
}

/**
 * Drops degenerate/fragment contours: too few points after DP simplification
 * (< `minLength`), zero-length, or a degenerate bounding box (single noise
 * pixels that Canny's hysteresis occasionally lets through).
 */
export function filterContours(
  contours: readonly SketchContour[],
  options: Pick<SketchOptions, 'minLength'> = {},
): SketchContour[] {
  const minLength = options.minLength ?? 3
  return contours.filter(
    (contour) =>
      contour.points.length >= minLength &&
      contour.length > 0 &&
      contour.box.width >= 1 &&
      contour.box.height >= 1,
  )
}

/**
 * Safety cap for busy photos: when more than `max` contours survive, the
 * longest contours win (subject structure beats background speckle).
 */
export function limitContours(contours: readonly SketchContour[], max: number): SketchContour[] {
  if (contours.length <= max) return [...contours]
  return [...contours].sort((a, b) => b.length - a.length).slice(0, Math.max(0, max))
}

/**
 * Evenly resamples a polyline to at most `maxPoints`, preserving the first
 * and last points (a stroke's endpoints are its anchors).
 */
export function resampleContour(points: readonly Point[], maxPoints: number): Point[] {
  if (points.length <= maxPoints) return points.map((point) => ({ x: point.x, y: point.y }))
  const step = Math.max(1, maxPoints - 1)
  const span = points.length - 1
  const out: Point[] = []
  for (let k = 0; k < maxPoints; k += 1) {
    const i = Math.round((k * span) / step)
    out.push({ x: points[i].x, y: points[i].y })
  }
  return out
}

/** Orders strokes the way a hand draws them: top-to-bottom, then left-to-right. */
export function sortStrokesLikeHand<T extends { points: readonly Point[] }>(
  items: readonly T[],
): T[] {
  return [...items].sort((a, b) => {
    const ay = a.points[0]?.y ?? 0
    const by = b.points[0]?.y ?? 0
    return ay !== by ? ay - by : (a.points[0]?.x ?? 0) - (b.points[0]?.x ?? 0)
  })
}

/**
 * Classifies a stroke as a strong main contour (longer than 85% of the 75th
 * percentile of the sketch's contour lengths) — those get a heavier pencil
 * touch, the rest fade to feint lines. Mirrors the previous mean-edge-strength
 * behaviour, but works on contour length so it stays engine-agnostic.
 */
export function strokeWidthFor(
  length: number,
  allLengths: readonly number[],
  baseSize: number,
): number {
  const sorted = [...allLengths].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * 0.75)))
  const percentile = sorted[index] ?? 0
  const strong = length >= Math.max(percentile * 0.85, 1)
  return strong ? Math.max(baseSize * 0.85, 1.2) : Math.max(baseSize * 0.45, 0.7)
}

/**
 * Deterministic FNV-1a hash → stable, content-derived random seed.
 * Returns 1 for the empty/zero case because rough.js treats seed 0 as
 * non-deterministic (it falls back to Math.random).
 */
export function hashSeed(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0 || 1
}
