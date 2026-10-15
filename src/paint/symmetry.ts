import { createId } from './id'
import type { PaintOperation, Point } from './types'

export const SYMMETRY_MODES = ['off', 'x', 'y', 'both'] as const
export type Symmetry = (typeof SYMMETRY_MODES)[number]

export function isSymmetry(value: unknown): value is Symmetry {
  return typeof value === 'string' && (SYMMETRY_MODES as readonly string[]).includes(value)
}

type Axis = 'x' | 'y' | 'both'

function mirrorPoint(point: Point, width: number, height: number, axis: Axis): Point {
  const flipX = axis === 'x' || axis === 'both'
  const flipY = axis === 'y' || axis === 'both'
  return {
    x: flipX ? width - point.x : point.x,
    y: flipY ? height - point.y : point.y,
  }
}

function mirrorOnce(
  operation: PaintOperation,
  width: number,
  height: number,
  axis: Axis,
): PaintOperation | null {
  if (operation.kind === 'stroke') {
    return {
      ...operation,
      id: createId(),
      points: operation.points.map((point) => mirrorPoint(point, width, height, axis)),
    }
  }
  if (operation.kind === 'shape') {
    return {
      ...operation,
      id: createId(),
      start: mirrorPoint(operation.start, width, height, axis),
      end: mirrorPoint(operation.end, width, height, axis),
    }
  }
  // Fills, images and text are not mirrored.
  return null
}

/**
 * Mirrored copies of an operation for the given symmetry mode. Returns an empty
 * list for 'off' (or for operations that cannot be mirrored), so callers can
 * commit `[operation, ...mirrorOperation(...)]` as one undoable step.
 */
export function mirrorOperation(
  operation: PaintOperation,
  width: number,
  height: number,
  symmetry: Symmetry,
): PaintOperation[] {
  if (symmetry === 'off') return []
  const axes: Axis[] = symmetry === 'both' ? ['x', 'y', 'both'] : [symmetry]
  return axes
    .map((axis) => mirrorOnce(operation, width, height, axis))
    .filter((mirror): mirror is PaintOperation => mirror !== null)
}
