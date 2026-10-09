import { describe, expect, it } from 'vitest'
import { clampZoom, fitZoom, MAX_ZOOM, MIN_ZOOM } from './viewport'

describe('clampZoom', () => {
  it('clamps to the supported range', () => {
    expect(clampZoom(0.001)).toBe(MIN_ZOOM)
    expect(clampZoom(100)).toBe(MAX_ZOOM)
    expect(clampZoom(1.5)).toBe(1.5)
  })

  it('falls back to 1 for non-finite input', () => {
    expect(clampZoom(Number.NaN)).toBe(1)
    expect(clampZoom(Number.POSITIVE_INFINITY)).toBe(1)
  })
})

describe('fitZoom', () => {
  it('fits the whole document inside the container', () => {
    // container 1200x600, doc 960x720, padding 24 -> min(1176/960, 576/720) = 0.8
    expect(fitZoom(1200, 600, 960, 720)).toBeCloseTo(0.8, 5)
  })

  it('falls back to 1 for a degenerate document', () => {
    expect(fitZoom(100, 100, 0, 0)).toBe(1)
  })

  it('never returns below the minimum zoom', () => {
    expect(fitZoom(10, 10, 960, 720)).toBe(MIN_ZOOM)
  })
})
