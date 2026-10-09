import type { Rect } from './geometry'
import type { PaintOperation, Point } from './types'

export function normalizeQuarterTurns(turns: number): number {
  if (!Number.isFinite(turns)) return 0
  return ((Math.round(turns) % 4) + 4) % 4
}

/** Document size after rotating by whole quarter-turns. */
export function rotatedSize(
  width: number,
  height: number,
  quarterTurns: number,
): { width: number; height: number } {
  return normalizeQuarterTurns(quarterTurns) % 2 === 0
    ? { width, height }
    : { width: height, height: width }
}

function rotatePoint(point: Point, turns: number, width: number, height: number): Point {
  switch (turns) {
    case 1:
      return { x: height - point.y, y: point.x }
    case 2:
      return { x: width - point.x, y: height - point.y }
    case 3:
      return { x: point.y, y: width - point.x }
    default:
      return { x: point.x, y: point.y }
  }
}

function translatePoint(point: Point, dx: number, dy: number): Point {
  return { x: point.x + dx, y: point.y + dy }
}

export function translateOperations(
  operations: readonly PaintOperation[],
  dx: number,
  dy: number,
): PaintOperation[] {
  return operations.map((operation) => {
    if (operation.kind === 'stroke') {
      return {
        ...operation,
        points: operation.points.map((point) => translatePoint(point, dx, dy)),
      }
    }
    if (operation.kind === 'shape') {
      return {
        ...operation,
        start: translatePoint(operation.start, dx, dy),
        end: translatePoint(operation.end, dx, dy),
      }
    }
    return { ...operation, x: operation.x + dx, y: operation.y + dy }
  })
}

export function scaleOperations(
  operations: readonly PaintOperation[],
  scaleX: number,
  scaleY: number,
): PaintOperation[] {
  const sizeScale = Math.sqrt(scaleX * scaleY)
  return operations.map((operation) => {
    if (operation.kind === 'stroke') {
      return {
        ...operation,
        size: operation.size * sizeScale,
        points: operation.points.map((point) => ({ x: point.x * scaleX, y: point.y * scaleY })),
      }
    }
    if (operation.kind === 'shape') {
      return {
        ...operation,
        size: operation.size * sizeScale,
        start: { x: operation.start.x * scaleX, y: operation.start.y * scaleY },
        end: { x: operation.end.x * scaleX, y: operation.end.y * scaleY },
      }
    }
    return {
      ...operation,
      x: operation.x * scaleX,
      y: operation.y * scaleY,
      width: operation.width * scaleX,
      height: operation.height * scaleY,
    }
  })
}

/** Rotates every operation clockwise within a document of the given size. */
export function rotateOperations(
  operations: readonly PaintOperation[],
  quarterTurns: number,
  width: number,
  height: number,
): PaintOperation[] {
  const turns = normalizeQuarterTurns(quarterTurns)
  if (turns === 0) return [...operations]

  return operations.map((operation) => {
    if (operation.kind === 'stroke') {
      return {
        ...operation,
        points: operation.points.map((point) => rotatePoint(point, turns, width, height)),
      }
    }
    if (operation.kind === 'shape') {
      return {
        ...operation,
        start: rotatePoint(operation.start, turns, width, height),
        end: rotatePoint(operation.end, turns, width, height),
      }
    }
    const first = rotatePoint({ x: operation.x, y: operation.y }, turns, width, height)
    const second = rotatePoint(
      { x: operation.x + operation.width, y: operation.y + operation.height },
      turns,
      width,
      height,
    )
    return {
      ...operation,
      x: Math.min(first.x, second.x),
      y: Math.min(first.y, second.y),
      width: Math.abs(second.x - first.x),
      height: Math.abs(second.y - first.y),
    }
  })
}

/** Keeps only the cropped region, moving its top-left corner to the origin. */
export function cropOperations(
  operations: readonly PaintOperation[],
  rect: Rect,
): PaintOperation[] {
  return translateOperations(operations, -rect.x, -rect.y)
}
