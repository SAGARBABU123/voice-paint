import type { Point } from './types'

/** Where a voice-drawn shape is placed on the document. */
export type ShapePlacement =
  'center' | 'row' | 'top' | 'bottom' | 'left' | 'right' | 'corners' | 'sides'

export const MAX_SHAPES = 20

/**
 * Deterministic positions for voice-drawn shapes. All coordinates are in
 * document pixels; shapes are inset from the edges by `inset`.
 */
export function placeShapes(
  placement: ShapePlacement,
  count: number,
  width: number,
  height: number,
  inset = 40,
): Point[] {
  const total = Math.min(Math.max(1, Math.round(count)), MAX_SHAPES)
  const points: Point[] = []

  const along = (from: Point, to: Point): Point[] => {
    const steps = Math.max(1, total)
    const result: Point[] = []
    for (let index = 0; index < steps; index += 1) {
      const t = steps === 1 ? 0.5 : index / (steps - 1)
      result.push({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t })
    }
    return result
  }

  switch (placement) {
    case 'top':
      return along({ x: inset, y: inset }, { x: width - inset, y: inset })
    case 'bottom':
      return along({ x: inset, y: height - inset }, { x: width - inset, y: height - inset })
    case 'left':
      return along({ x: inset, y: inset }, { x: inset, y: height - inset })
    case 'right':
      return along({ x: width - inset, y: inset }, { x: width - inset, y: height - inset })
    case 'corners': {
      const count = Math.min(total, 4)
      if (count >= 1) points.push({ x: inset, y: inset })
      if (count >= 2) points.push({ x: width - inset, y: inset })
      if (count >= 3) points.push({ x: width - inset, y: height - inset })
      if (count >= 4) points.push({ x: inset, y: height - inset })
      return points
    }
    case 'sides': {
      // `count` is the number per side; total = 4 * perSide (capped).
      const perSide = Math.min(Math.max(1, Math.round(count)), Math.floor(MAX_SHAPES / 4))
      const side = (from: Point, to: Point): Point[] => {
        const steps = Math.max(1, perSide)
        const result: Point[] = []
        for (let index = 0; index < steps; index += 1) {
          const t = steps === 1 ? 0.5 : index / (steps - 1)
          result.push({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t })
        }
        return result
      }
      return [
        ...side({ x: inset, y: inset }, { x: width - inset, y: inset }),
        ...side({ x: width - inset, y: inset }, { x: width - inset, y: height - inset }),
        ...side({ x: width - inset, y: height - inset }, { x: inset, y: height - inset }),
        ...side({ x: inset, y: height - inset }, { x: inset, y: inset }),
      ]
    }
    case 'center':
      return total === 1
        ? [{ x: width / 2, y: height / 2 }]
        : along({ x: inset, y: height / 2 }, { x: width - inset, y: height / 2 })
    case 'row':
    default:
      return along({ x: inset, y: height / 2 }, { x: width - inset, y: height / 2 })
  }
}
