import { describe, expect, it } from 'vitest'
import { clamp01, partialOperation } from './animate'
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
