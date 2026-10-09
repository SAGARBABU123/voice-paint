import { describe, expect, it } from 'vitest'
import {
  centerOf,
  clamp,
  clampRectToBounds,
  containsPoint,
  distance,
  fitContain,
  normalizeRect,
  radiiOf,
} from './geometry'

describe('clamp', () => {
  it('keeps values inside the range', () => {
    expect(clamp(5, 1, 10)).toBe(5)
  })

  it('clamps below the minimum', () => {
    expect(clamp(-3, 1, 10)).toBe(1)
  })

  it('clamps above the maximum', () => {
    expect(clamp(99, 1, 10)).toBe(10)
  })
})

describe('distance', () => {
  it('measures euclidean distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })
})

describe('containsPoint', () => {
  const rect = { x: 10, y: 20, width: 30, height: 40 }

  it('is true inside the rectangle and on its edges', () => {
    expect(containsPoint(rect, { x: 10, y: 20 })).toBe(true)
    expect(containsPoint(rect, { x: 40, y: 60 })).toBe(true)
    expect(containsPoint(rect, { x: 25, y: 40 })).toBe(true)
  })

  it('is false outside the rectangle', () => {
    expect(containsPoint(rect, { x: 9, y: 40 })).toBe(false)
    expect(containsPoint(rect, { x: 41, y: 40 })).toBe(false)
    expect(containsPoint(rect, { x: 25, y: 61 })).toBe(false)
  })
})

describe('normalizeRect', () => {
  it('normalizes a down-right drag', () => {
    expect(normalizeRect({ x: 2, y: 3 }, { x: 10, y: 11 })).toEqual({
      x: 2,
      y: 3,
      width: 8,
      height: 8,
    })
  })

  it('normalizes an up-left drag to the same rectangle', () => {
    expect(normalizeRect({ x: 10, y: 11 }, { x: 2, y: 3 })).toEqual({
      x: 2,
      y: 3,
      width: 8,
      height: 8,
    })
  })
})

describe('centerOf and radiiOf', () => {
  it('derives centre and radii from two corners', () => {
    expect(centerOf({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual({ x: 5, y: 10 })
    expect(radiiOf({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual({ x: 5, y: 10 })
  })
})

describe('fitContain', () => {
  it('scales and centres a wide image inside the box', () => {
    expect(fitContain(400, 200, 960, 720)).toEqual({ x: 0, y: 120, width: 960, height: 480 })
  })

  it('scales and centres a tall image inside the box', () => {
    expect(fitContain(200, 400, 960, 720)).toEqual({ x: 300, y: 0, width: 360, height: 720 })
  })

  it('falls back to the box for a degenerate source', () => {
    expect(fitContain(0, 0, 960, 720)).toEqual({ x: 0, y: 0, width: 960, height: 720 })
  })
})

describe('clampRectToBounds', () => {
  it('clamps a rectangle that starts outside the top-left', () => {
    expect(clampRectToBounds({ x: -10, y: -10, width: 100, height: 100 }, 960, 720)).toEqual({
      x: 0,
      y: 0,
      width: 90,
      height: 90,
    })
  })

  it('clips a rectangle that extends past the bottom-right', () => {
    expect(clampRectToBounds({ x: 900, y: 700, width: 200, height: 200 }, 960, 720)).toEqual({
      x: 900,
      y: 700,
      width: 60,
      height: 20,
    })
  })

  it('returns a zero-size rectangle when fully outside', () => {
    expect(clampRectToBounds({ x: 2000, y: 2000, width: 10, height: 10 }, 960, 720)).toEqual({
      x: 960,
      y: 720,
      width: 0,
      height: 0,
    })
  })
})
