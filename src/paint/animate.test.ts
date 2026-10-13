import { describe, expect, it } from 'vitest'
import {
  activeStrokeIndex,
  clamp01,
  partialOperation,
  penTip,
  revealDuration,
  strokeReveal,
} from './animate'
import type { ImageOperation, ShapeOperation, StrokeOperation, TextOperation } from './types'

const shape: ShapeOperation = {
  id: 's',
  kind: 'shape',
  tool: 'ellipse',
  color: '#111111',
  size: 4,
  start: { x: 0, y: 0 },
  end: { x: 20, y: 40 },
}
const stroke: StrokeOperation = {
  id: 'p',
  kind: 'stroke',
  tool: 'pencil',
  color: '#111111',
  size: 4,
  points: [
    { x: 0, y: 0 },
    { x: 5, y: 5 },
    { x: 10, y: 10 },
    { x: 15, y: 15 },
  ],
}
const text: TextOperation = {
  id: 't',
  kind: 'text',
  x: 0,
  y: 0,
  text: 'hello',
  color: '#111111',
  fontSize: 24,
  fontFamily: 'sans-serif',
  rotation: 0,
}
const image: ImageOperation = {
  id: 'i',
  kind: 'image',
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  dataUrl: 'data:image/png;base64,AAAA',
}

describe('clamp01', () => {
  it('clamps to the 0..1 range', () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(0.5)).toBe(0.5)
    expect(clamp01(2)).toBe(1)
    expect(clamp01(Number.NaN)).toBe(0)
  })
})

describe('partialOperation', () => {
  it('grows a shape from its start point', () => {
    expect(partialOperation(shape, 0.5)).toMatchObject({ end: { x: 10, y: 20 } })
    expect(partialOperation(shape, 1)).toMatchObject({ end: { x: 20, y: 40 } })
  })

  it('reveals a stroke along its points', () => {
    const partial = partialOperation(stroke, 0.5)
    if (partial.kind === 'stroke') expect(partial.points).toHaveLength(2)
  })

  it('reveals text by characters', () => {
    expect(partialOperation(text, 0.6)).toMatchObject({ text: 'hel' })
  })

  it('leaves image operations for the caller to fade in', () => {
    expect(partialOperation(image, 0.4)).toBe(image)
  })
})

describe('reveal scheduling', () => {
  it('draws strokes one after another with a pen-lift gap', () => {
    // count=2, gap=0.25: stroke 0 draws in [0, 1/2.25), pen lifts in the
    // gap, then stroke 1 draws in [1.25/2.25, 1].
    expect(strokeReveal(0, 2, 0.12)).toBeGreaterThan(0)
    expect(strokeReveal(0, 2, 0.12)).toBeLessThan(1) // stroke 0 mid-draw
    expect(strokeReveal(1, 2, 0.12)).toBe(0) // stroke 1 not started yet
    expect(strokeReveal(0, 2, 0.5)).toBe(1) // stroke 0 done, pen lifting
    expect(strokeReveal(1, 2, 0.5)).toBe(0)
    expect(strokeReveal(1, 2, 0.7)).toBeGreaterThan(0)
    expect(strokeReveal(1, 2, 0.7)).toBeLessThan(1)
    expect(strokeReveal(1, 2, 1)).toBe(1)
  })

  it('never draws more than one stroke at the same instant', () => {
    for (let p = 0; p <= 1; p += 0.02) {
      const midDraw = [0, 1, 2].filter((i) => {
        const reveal = strokeReveal(i, 3, p)
        return reveal > 0 && reveal < 1
      })
      expect(midDraw.length).toBeLessThanOrEqual(1)
    }
  })

  it('reports the stroke currently being written (pen on the sheet)', () => {
    expect(activeStrokeIndex(3, 0)).toBeNull() // before anything
    expect(activeStrokeIndex(3, 1)).toBeNull() // all done
    expect(activeStrokeIndex(3, 0.1)).toBe(0)
    // Gap after stroke 0 finishes → pen lifted → null.
    const strokeZeroEnd = 1 / (3 + 0.25 * 2)
    expect(activeStrokeIndex(3, strokeZeroEnd + 1e-6)).toBeNull()
    expect(activeStrokeIndex(3, 0.6)).toBe(1)
    expect(activeStrokeIndex(3, 1)).toBeNull()
  })

  it('bounds the batch window so a big sketch still finishes lively', () => {
    expect(revealDuration(1)).toBe(320)
    expect(revealDuration(2)).toBeCloseTo(200 * (2 + 0.25) + 120, 5)
    expect(revealDuration(1_000)).toBe(14_000)
    expect(revealDuration(0)).toBe(120)
  })

  it('returns the pen contact point on a partial stroke', () => {
    expect(penTip(stroke, 0)).toEqual({ x: 0, y: 0 })
    expect(penTip(stroke, 1)).toEqual({ x: 15, y: 15 })
    const mid = penTip(stroke, 0.5)
    expect(mid).toEqual({ x: 5, y: 5 }) // keep = ceil(4 * 0.5) = 2 → points[1]
    expect(penTip(stroke, 0.4)).toEqual({ x: 5, y: 5 })
    expect(penTip(shape, 0.5)).toBeNull() // no pen contact on a shape
    expect(penTip(image, 0.5)).toBeNull()
  })
})
