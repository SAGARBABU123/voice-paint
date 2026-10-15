import type { Rect } from './geometry'

export type ClipboardImage = {
  dataUrl: string
  width: number
  height: number
}

let current: ClipboardImage | null = null

/** In-memory clipboard for copied/cut selections (no system clipboard access). */
export function setClipboardImage(image: ClipboardImage | null): void {
  current = image
}

export function getClipboardImage(): ClipboardImage | null {
  return current
}

/**
 * Extracts a document region from the composited canvas as a PNG data URL.
 * The bounds are clamped to the canvas so an out-of-range marquee is safe.
 */
export function copyRegion(canvas: HTMLCanvasElement, rect: Rect): ClipboardImage | null {
  const x = Math.max(0, Math.floor(rect.x))
  const y = Math.max(0, Math.floor(rect.y))
  const width = Math.max(0, Math.min(canvas.width - x, Math.round(rect.width)))
  const height = Math.max(0, Math.min(canvas.height - y, Math.round(rect.height)))
  if (width < 1 || height < 1) return null

  const out = document.createElement('canvas')
  out.width = width
  out.height = height
  const context = out.getContext('2d')
  if (!context) return null
  context.drawImage(canvas, x, y, width, height, 0, 0, width, height)
  return { dataUrl: out.toDataURL('image/png'), width, height }
}
