import { createId } from './id'
import { getCachedImage } from './imageCache'
import { clampRectToBounds, type Rect } from './geometry'
import { renderScene } from './renderer'
import type { ImageOperation, PaintOperation } from './types'

/**
 * Rasterises the current document into an offscreen canvas so a rect can be
 * lifted out of it, or masked over. Returns null outside a browser or when the
 * region is empty/out of bounds.
 */
function rasterise(
  operations: readonly PaintOperation[],
  documentWidth: number,
  documentHeight: number,
): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } | null {
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

  return { canvas, context }
}

function boundedSize(rect: Rect, width: number, height: number): Rect | null {
  const bounded = clampRectToBounds(rect, width, height)
  const rounded: Rect = {
    x: Math.round(bounded.x),
    y: Math.round(bounded.y),
    width: Math.round(bounded.width),
    height: Math.round(bounded.height),
  }
  if (rounded.width < 1 || rounded.height < 1) return null
  return rounded
}

/** Builds an opaque, background-coloured image that hides a document region. */
export function createSelectionMask(
  documentWidth: number,
  documentHeight: number,
  background: string,
  rect: Rect,
): ImageOperation | null {
  const region = boundedSize(rect, documentWidth, documentHeight)
  if (!region) return null
  if (typeof document === 'undefined') return null

  const mask = document.createElement('canvas')
  mask.width = 1
  mask.height = 1
  const context = mask.getContext('2d')
  if (!context) return null
  context.fillStyle = background
  context.fillRect(0, 0, 1, 1)

  return {
    id: createId(),
    kind: 'image',
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    dataUrl: mask.toDataURL('image/png'),
  }
}

export type SelectionMove = { mask: ImageOperation; patch: ImageOperation }

/**
 * Lifts a rectangular region and returns the two operations that move it:
 * a mask hiding the original spot, and the lifted patch at its new position.
 * Drawing the mask first keeps the result correct even when source and
 * destination overlap.
 */
export function createSelectionMove(
  operations: readonly PaintOperation[],
  documentWidth: number,
  documentHeight: number,
  background: string,
  rect: Rect,
  dx: number,
  dy: number,
): SelectionMove | null {
  const region = boundedSize(rect, documentWidth, documentHeight)
  if (!region) return null

  const scene = rasterise(operations, documentWidth, documentHeight)
  if (!scene) return null

  const patch = document.createElement('canvas')
  patch.width = region.width
  patch.height = region.height
  const patchContext = patch.getContext('2d')
  if (!patchContext) return null
  patchContext.drawImage(
    scene.canvas,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    region.width,
    region.height,
  )

  const mask = createSelectionMask(documentWidth, documentHeight, background, region)
  if (!mask) return null

  return {
    mask,
    patch: {
      id: createId(),
      kind: 'image',
      x: region.x + dx,
      y: region.y + dy,
      width: region.width,
      height: region.height,
      dataUrl: patch.toDataURL('image/png'),
    },
  }
}
