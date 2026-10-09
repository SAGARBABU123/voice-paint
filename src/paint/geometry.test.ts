import { describe, expect, it } from 'vitest'
import { centerOf, clamp, distance, normalizeRect, radiiOf } from './geometry'

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
