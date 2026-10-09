import type { Point } from './types'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export type Rect = { x: number; y: number; width: number; height: number }

/** True when a point falls inside a rectangle (inclusive of its edges). */
export function containsPoint(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

/** Bounding rectangle between two points, regardless of drag direction. */
export function normalizeRect(start: Point, end: Point): Rect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }
}

export function centerOf(start: Point, end: Point): Point {
  return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
}

export function radiiOf(start: Point, end: Point): Point {
  const rect = normalizeRect(start, end)
  return { x: rect.width / 2, y: rect.height / 2 }
}

/** Scales a source to fit ("contain") inside a box, centred, preserving aspect ratio. */
export function fitContain(
  sourceWidth: number,
  sourceHeight: number,
  boxWidth: number,
  boxHeight: number,
): Rect {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return { x: 0, y: 0, width: boxWidth, height: boxHeight }
  }
  const scale = Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  return { x: (boxWidth - width) / 2, y: (boxHeight - height) / 2, width, height }
}

/** Clamps a rectangle so it lies inside a `width` x `height` document. */
export function clampRectToBounds(rect: Rect, width: number, height: number): Rect {
  const x = clamp(rect.x, 0, width)
  const y = clamp(rect.y, 0, height)
  const maxX = clamp(rect.x + rect.width, 0, width)
  const maxY = clamp(rect.y + rect.height, 0, height)
  return { x, y, width: Math.max(0, maxX - x), height: Math.max(0, maxY - y) }
}
