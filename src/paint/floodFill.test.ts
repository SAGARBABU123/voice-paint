import { describe, expect, it } from 'vitest'
import { floodFill, type PixelBuffer } from './floodFill'
import type { Rgba } from './color'

const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 255 }
const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 255 }
const RED: Rgba = { r: 255, g: 0, b: 0, a: 255 }

function createBuffer(width: number, height: number, fill: Rgba = WHITE): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let index = 0; index < width * height; index += 1) {
    data.set([fill.r, fill.g, fill.b, fill.a], index * 4)
  }
  return { width, height, data }
}

function setPixel(buffer: PixelBuffer, x: number, y: number, color: Rgba): void {
  const offset = (y * buffer.width + x) * 4
  buffer.data.set([color.r, color.g, color.b, color.a], offset)
}

function pixel(buffer: PixelBuffer, x: number, y: number): number[] {
  const offset = (y * buffer.width + x) * 4
  return Array.from(buffer.data.slice(offset, offset + 4))
}

describe('floodFill', () => {
  it('fills a contiguous region and returns its bounding box', () => {
    const buffer = createBuffer(4, 4)
    const bounds = floodFill(buffer, 1, 1, RED)

    expect(bounds).toEqual({ x: 0, y: 0, width: 4, height: 4 })
    expect(pixel(buffer, 0, 0)).toEqual([255, 0, 0, 255])
    expect(pixel(buffer, 3, 3)).toEqual([255, 0, 0, 255])
  })

  it('stops at differently coloured barriers', () => {
    const buffer = createBuffer(5, 3)
    for (let y = 0; y < 3; y += 1) setPixel(buffer, 2, y, BLACK)

    const bounds = floodFill(buffer, 0, 1, RED)

    expect(bounds).toEqual({ x: 0, y: 0, width: 2, height: 3 })
    expect(pixel(buffer, 2, 1)).toEqual([0, 0, 0, 255])
    expect(pixel(buffer, 3, 1)).toEqual([255, 255, 255, 255])
  })

  it('uses four-way connectivity (diagonals do not leak)', () => {
    const buffer = createBuffer(2, 2)
    setPixel(buffer, 1, 1, BLACK)

    const bounds = floodFill(buffer, 0, 0, RED)

    // The two orthogonal neighbours are reached, but the diagonal one is not.
    expect(bounds).toEqual({ x: 0, y: 0, width: 2, height: 2 })
    expect(pixel(buffer, 0, 1)).toEqual([255, 0, 0, 255])
    expect(pixel(buffer, 1, 1)).toEqual([0, 0, 0, 255])
  })

  it('returns null when the seed already matches the fill colour', () => {
    const buffer = createBuffer(3, 3)
    expect(floodFill(buffer, 1, 1, WHITE)).toBeNull()
  })

  it('returns null when the seed is outside the buffer', () => {
    const buffer = createBuffer(3, 3)
    expect(floodFill(buffer, -1, 0, RED)).toBeNull()
    expect(floodFill(buffer, 3, 0, RED)).toBeNull()
    expect(floodFill(buffer, 0, 5, RED)).toBeNull()
  })

  it('matches nearby colours within the tolerance', () => {
    const buffer = createBuffer(3, 1)
    setPixel(buffer, 1, 0, { r: 250, g: 250, b: 250, a: 255 })

    const bounds = floodFill(buffer, 0, 0, RED, 10)

    expect(bounds).toEqual({ x: 0, y: 0, width: 3, height: 1 })
  })

  it('does not match a colour outside the tolerance', () => {
    const buffer = createBuffer(3, 1)
    setPixel(buffer, 1, 0, { r: 200, g: 200, b: 200, a: 255 })

    const bounds = floodFill(buffer, 0, 0, RED, 10)

    expect(bounds).toEqual({ x: 0, y: 0, width: 1, height: 1 })
  })
})
