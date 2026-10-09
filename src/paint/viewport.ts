import { clamp } from './geometry'

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4
export const ZOOM_FACTOR = 1.25

export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return 1
  return clamp(value, MIN_ZOOM, MAX_ZOOM)
}

/** Zoom that fits the whole document inside a container, with a little padding. */
export function fitZoom(
  containerWidth: number,
  containerHeight: number,
  documentWidth: number,
  documentHeight: number,
  padding = 24,
): number {
  if (documentWidth <= 0 || documentHeight <= 0) return 1
  const availableWidth = Math.max(containerWidth - padding, 1)
  const availableHeight = Math.max(containerHeight - padding, 1)
  return clampZoom(Math.min(availableWidth / documentWidth, availableHeight / documentHeight))
}
