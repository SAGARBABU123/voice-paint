import type { Rgba } from './color'

/** Structurally compatible with `ImageData`, but constructible in tests. */
export type PixelBuffer = {
  width: number
  height: number
  data: Uint8ClampedArray
}

export type FillBounds = { x: number; y: number; width: number; height: number }

function channelsMatch(
  data: Uint8ClampedArray,
  offset: number,
  target: Rgba,
  tolerance: number,
): boolean {
  return (
    Math.abs(data[offset] - target.r) <= tolerance &&
    Math.abs(data[offset + 1] - target.g) <= tolerance &&
    Math.abs(data[offset + 2] - target.b) <= tolerance &&
    Math.abs(data[offset + 3] - target.a) <= tolerance
  )
}

/**
 * Four-way flood fill from a seed pixel, mutating `buffer` in place. Returns the
 * bounding box of the changed region, or null when nothing changes (seed out of
 * bounds, or the region already matches the fill colour).
 */
export function floodFill(
  buffer: PixelBuffer,
  seedX: number,
  seedY: number,
  fill: Rgba,
  tolerance = 0,
): FillBounds | null {
  const { width, height, data } = buffer
  const startX = Math.floor(seedX)
  const startY = Math.floor(seedY)
  if (startX < 0 || startY < 0 || startX >= width || startY >= height) return null

  const seedOffset = (startY * width + startX) * 4
  const target: Rgba = {
    r: data[seedOffset],
    g: data[seedOffset + 1],
    b: data[seedOffset + 2],
    a: data[seedOffset + 3],
  }

  if (target.r === fill.r && target.g === fill.g && target.b === fill.b && target.a === fill.a) {
    return null
  }

  const visited = new Uint8Array(width * height)
  const stack = new Int32Array(width * height)
  let top = 0
  let minX = startX
  let maxX = startX
  let minY = startY
  let maxY = startY
  let changed = false

  const visit = (index: number): void => {
    if (visited[index] === 1) return
    const offset = index * 4
    if (!channelsMatch(data, offset, target, tolerance)) return

    visited[index] = 1
    data[offset] = fill.r
    data[offset + 1] = fill.g
    data[offset + 2] = fill.b
    data[offset + 3] = fill.a
    changed = true

    const x = index % width
    const y = (index - x) / width
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y

    stack[top++] = index
  }

  visit(startY * width + startX)

  while (top > 0) {
    const index = stack[--top]
    const x = index % width
    const y = (index - x) / width
    if (x > 0) visit(index - 1)
    if (x < width - 1) visit(index + 1)
    if (y > 0) visit(index - width)
    if (y < height - 1) visit(index + width)
  }

  if (!changed) return null
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}
