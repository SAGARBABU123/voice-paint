import { hexToRgba } from './color'
import { floodFill } from './floodFill'
import { getCachedImage } from './imageCache'
import { createId } from './id'
import { renderScene } from './renderer'
import type { ImageOperation, PaintOperation, Point } from './types'

/**
 * Rasterises the current document, flood-fills from a seed, and returns the
 * changed region as an image operation. Baking the result keeps replay and
 * persistence fast, and makes the fill a normal, undoable operation.
 *
 * Returns null outside a browser or when the fill changes nothing.
 */
export function createFillOperation(
  operations: readonly PaintOperation[],
  documentWidth: number,
  documentHeight: number,
  seed: Point,
  color: string,
): ImageOperation | null {
  if (typeof document === 'undefined') return null

  const canvas = document.createElement('canvas')
  canvas.width = documentWidth
  canvas.height = documentHeight
  const context = canvas.getContext('2d')
  if (!context) return null

  renderScene(context, {
    width: documentWidth,
    height: documentHeight,
    operations,
    resolveImage: getCachedImage,
  })

  const imageData = context.getImageData(0, 0, documentWidth, documentHeight)
  const bounds = floodFill(imageData, seed.x, seed.y, hexToRgba(color))
  if (!bounds) return null

  const patch = document.createElement('canvas')
  patch.width = bounds.width
  patch.height = bounds.height
  const patchContext = patch.getContext('2d')
  if (!patchContext) return null

  patchContext.putImageData(imageData, -bounds.x, -bounds.y)

  return {
    id: createId(),
    kind: 'image',
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    dataUrl: patch.toDataURL('image/png'),
  }
}
