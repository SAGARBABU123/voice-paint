import type { Point } from './types'

export type RectLike = { left: number; top: number; width: number; height: number }

/**
 * Maps client (CSS/viewport) coordinates to document pixel coordinates.
 *
 * This is the single mapping used for mouse, touch, and pen input, and it
 * absorbs CSS scaling and high-DPI displays because it is relative to the
 * element's rendered rect rather than the backing store size.
 */
export function clientToDocumentPoint(
  clientX: number,
  clientY: number,
  rect: RectLike,
  documentWidth: number,
  documentHeight: number,
): Point {
  if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 }
  return {
    x: ((clientX - rect.left) / rect.width) * documentWidth,
    y: ((clientY - rect.top) / rect.height) * documentHeight,
  }
}
