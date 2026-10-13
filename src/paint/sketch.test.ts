import { describe, expect, it } from 'vitest'
import {
  contourLength,
  filterContours,
  hashSeed,
  limitContours,
  resampleContour,
  sortStrokesLikeHand,
  strokeWidthFor,
  type SketchContour,
} from './sketch'
import type { Point } from './types'

const contour = (points: Point[], box?: SketchContour['box']): SketchContour => ({
  points,
  box: box ?? { x: 0, y: 0, width: 5, height: 5 },
  area: 10,
  length: contourLength(points),
})

const pts = (...coords: [number, number][]): Point[] => coords.map(([x, y]) => ({ x, y }))

describe('contour geometry', () => {
  it('sums segment lengths of a polyline', () => {
    expect(contourLength(pts([0, 0], [0, 5], [0, 10]))).toBe(10)
    expect(contourLength(pts([0, 0], [3, 4]))).toBe(5)
    expect(contourLength([])).toBe(0)
  })

  it('resamples a long polyline evenly, keeping its endpoints', () => {
    const line = pts([0, 0], [10, 0], [20, 0], [30, 0], [40, 0])
    const sampled = resampleContour(line, 3)
    expect(sampled).toHaveLength(3)
    expect(sampled[0]).toEqual({ x: 0, y: 0 })
    expect(sampled[sampled.length - 1]).toEqual({ x: 40, y: 0 })
    expect(sampled).toEqual([
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 40, y: 0 },
    ])
  })

  it('copies short polylines untouched', () => {
    const line = pts([1, 1], [2, 2])
    const sampled = resampleContour(line, 80)
    expect(sampled).toEqual(line)
    expect(sampled).not.toBe(line)
  })
})

describe('contour filtering and caps', () => {
  it('drops fragments, degenerate boxes, and zero-length contours', () => {
    const keep = contour(pts([0, 0], [0, 4], [0, 8]))
    const tiny = contour(pts([0, 0], [1, 1]), { x: 0, y: 0, width: 1, height: 1 })
    const degenerate = contour(pts([0, 0], [0, 4], [0, 8]), { x: 0, y: 0, width: 0, height: 4 })
    const zeroLength = contour(pts([2, 2]))
    expect(filterContours([keep, tiny, degenerate, zeroLength])).toEqual([keep])
  })

  it('respects minLength for the point count', () => {
    const short = contour(pts([0, 0], [1, 1], [2, 2]))
    const long = contour(pts([0, 0], [0, 4], [0, 8], [0, 12]))
    expect(filterContours([short, long], { minLength: 4 })).toEqual([long])
  })

  it('keeps the longest contours when over the cap', () => {
    const short = contour(pts([0, 0], [0, 1], [0, 2]))
    const medium = contour(pts([0, 0], [0, 5], [0, 10]))
    const long = contour(pts([0, 0], [0, 9], [0, 18]))
    const capped = limitContours([short, medium, long], 2)
    expect(capped).toHaveLength(2)
    expect(capped[0].length).toBeGreaterThanOrEqual(capped[1].length)
    expect(capped).not.toContain(short)
  })

  it('returns a copy when under the cap', () => {
    const single = contour(pts([0, 0], [0, 5], [0, 10]))
    const result = limitContours([single], 500)
    expect(result).toEqual([single])
    expect(result).not.toBe([single])
  })
})

describe('hand write order and stroke sizing', () => {
  it('orders strokes top-to-bottom, then left-to-right', () => {
    const strokes = [{ points: pts([50, 5]) }, { points: pts([10, 50]) }, { points: pts([20, 5]) }]
    const ordered = sortStrokesLikeHand(strokes)
    expect(ordered.map((s) => s.points[0])).toEqual([
      { x: 20, y: 5 },
      { x: 50, y: 5 },
      { x: 10, y: 50 },
    ])
  })

  it('gives strong contours a heavier pencil touch than feint ones', () => {
    const lengths = [100, 90, 80, 70]
    const strong = strokeWidthFor(105, lengths, 2)
    const feint = strokeWidthFor(10, lengths, 2)
    expect(strong).toBeGreaterThan(feint)
    expect(strong).toBeCloseTo(2 * 0.85, 5)
    expect(feint).toBeCloseTo(2 * 0.45, 5)
  })

  it('keeps a minimum visible width for both classes', () => {
    expect(strokeWidthFor(100, [100], 1.2)).toBe(1.2) // baseSize too small → clamp
    expect(strokeWidthFor(0.1, [100], 1.2)).toBe(0.7)
  })
})

describe('hashSeed', () => {
  it('is deterministic and never zero (rough.js treats 0 as random)', () => {
    expect(hashSeed('same-image')).toBe(hashSeed('same-image'))
    expect(hashSeed('')).toBeGreaterThan(0)
    expect(hashSeed('anything')).toBeGreaterThan(0)
  })

  it('differs for different inputs', () => {
    const seeds = new Set(['photo-a', 'photo-b', 'photo-c', 'photo-d'].map(hashSeed))
    expect(seeds.size).toBe(4)
  })
})
