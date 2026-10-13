import rough from 'roughjs'
import { hashSeed, resampleContour } from './sketch'
import type { Point } from './types'

export type RoughSketchOptions = {
  /** rough.js roughness (0 = smooth, higher = sketchier). Default 0.7. */
  roughness?: number
  /** Base random seed; a per-stroke seed is derived deterministically. */
  seed?: number
  /** Stroke width in px passed to rough (`maxRandomnessOffset` scaling). */
  strokeWidth?: number
  /** Maximum contour points fed to rough (final strokes are capped at 3× this). */
  maxPointsPerLine?: number
}

export type RoughOp = { op: 'move' | 'lineTo' | 'bcurveTo' | 'qcurveTo'; data: number[] }

/** Samples per cubic/quadratic bezier segment while flattening rough ops. */
const CURVE_STEPS = 6

/** rough.js treats seed 0 as "use Math.random" — keep our own seeds > 0. */
function guardedSeed(seed: number | undefined): number {
  return typeof seed === 'number' && seed > 0 ? seed : 1
}

/**
 * Flattens a rough.js op list (move / lineTo / qcurveTo / bcurveTo) into a
 * single polyline, sampling beziers at CURVE_STEPS intervals. rough.js emits
 * a move + bcurveTo pair per input segment and draws each line twice (primary
 * + slightly offset pass), which is exactly the "pencil double-stroke" look —
 * the flattened result carries that authentic hand-drawn geometry.
 */
export function opsToPolyline(ops: readonly RoughOp[], limit: number): Point[] {
  const out: Point[] = []
  for (const op of ops) {
    const data = op.data
    switch (op.op) {
      case 'move':
      case 'lineTo': {
        out.push({ x: data[0], y: data[1] })
        break
      }
      case 'qcurveTo': {
        // Quadratic bezier: control (d0,d1), end (d2,d3).
        const start = out[out.length - 1]
        if (!start) break
        for (let step = 1; step <= CURVE_STEPS; step += 1) {
          const t = step / CURVE_STEPS
          const u = 1 - t
          out.push({
            x: u * u * start.x + 2 * u * t * data[0] + t * t * data[2],
            y: u * u * start.y + 2 * u * t * data[1] + t * t * data[3],
          })
        }
        break
      }
      case 'bcurveTo': {
        // Cubic bezier: cp1 (d0,d1), cp2 (d2,d3), end (d4,d5).
        const start = out[out.length - 1]
        if (!start) break
        for (let step = 1; step <= CURVE_STEPS; step += 1) {
          const t = step / CURVE_STEPS
          const u = 1 - t
          out.push({
            x:
              u * u * u * start.x +
              3 * u * u * t * data[0] +
              3 * u * t * t * data[2] +
              t * t * t * data[4],
            y:
              u * u * u * start.y +
              3 * u * u * t * data[1] +
              3 * u * t * t * data[3] +
              t * t * t * data[5],
          })
        }
        break
      }
      default:
        break
    }
  }
  return resampleContour(out, Math.max(2, limit))
}

/**
 * Renders each contour through rough.js `linearPath` with a deterministic
 * per-stroke seed (base seed + index). Same input + options ⇒ identical
 * output, so re-sketching the same image reproduces the same strokes.
 */
export function renderRoughLines(
  contours: readonly (readonly Point[])[],
  options: RoughSketchOptions = {},
): Point[][] {
  const generator = rough.generator()
  const roughness = options.roughness ?? 0.7
  const strokeWidth = options.strokeWidth ?? 2
  const baseSeed = options.seed ?? 1
  const maxPointsPerLine = options.maxPointsPerLine ?? 80
  // Safety net: the double-pass + bezier sampling inflates point counts, so
  // cap the flattened stroke at 3× the input budget (keep strokes light).
  const limit = Math.max(2, maxPointsPerLine * 3)

  return contours.map((points, index) => {
    const seed = guardedSeed(hashSeed(`${baseSeed}:${index}`))
    const drawable = generator.linearPath(
      points.map((point) => [point.x, point.y]),
      { roughness, seed, strokeWidth },
    )
    const ops = drawable.sets.flatMap((set) => set.ops) as unknown as RoughOp[]
    return opsToPolyline(ops, limit)
  })
}
