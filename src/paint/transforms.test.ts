import { describe, expect, it } from 'vitest'
import {
  cropOperations,
  normalizeQuarterTurns,
  rotateOperations,
  rotatedSize,
  scaleOperations,
  translateOperations,
} from './transforms'
import type { ImageOperation, ShapeOperation, StrokeOperation, TextOperation } from './types'

const stroke: StrokeOperation = {
  id: 's',
  kind: 'stroke',
  tool: 'pencil',
  color: '#111111',
  size: 4,
  points: [
    { x: 0, y: 0 },
    { x: 10, y: 20 },
  ],
}
const shape: ShapeOperation = {
  id: 'h',
  kind: 'shape',
  tool: 'line',
  color: '#111111',
  size: 2,
  start: { x: 0, y: 0 },
  end: { x: 10, y: 0 },
}
const image: ImageOperation = {
  id: 'i',
  kind: 'image',
  x: 10,
  y: 20,
  width: 30,
  height: 40,
  dataUrl: 'data:image/png;base64,AAAA',
}
const text: TextOperation = {
  id: 't',
  kind: 'text',
  x: 10,
  y: 20,
  text: 'Hi',
  color: '#111111',
  fontSize: 24,
  fontFamily: 'sans-serif',
  rotation: 0,
}

describe('normalizeQuarterTurns', () => {
  it('normalizes into 0..3', () => {
    expect(normalizeQuarterTurns(5)).toBe(1)
    expect(normalizeQuarterTurns(-1)).toBe(3)
    expect(normalizeQuarterTurns(4)).toBe(0)
  })

  it('treats non-finite input as no rotation', () => {
    expect(normalizeQuarterTurns(Number.NaN)).toBe(0)
  })
})

describe('rotatedSize', () => {
  it('swaps dimensions only for odd quarter-turns', () => {
    expect(rotatedSize(960, 720, 1)).toEqual({ width: 720, height: 960 })
    expect(rotatedSize(960, 720, 2)).toEqual({ width: 960, height: 720 })
  })
})

describe('translateOperations', () => {
  it('moves strokes, shapes and images', () => {
    const [movedStroke, movedShape, movedImage] = translateOperations([stroke, shape, image], 5, -5)
    if (movedStroke?.kind === 'stroke') expect(movedStroke.points[0]).toEqual({ x: 5, y: -5 })
    if (movedShape?.kind === 'shape') expect(movedShape.end).toEqual({ x: 15, y: -5 })
    if (movedImage?.kind === 'image') {
      expect(movedImage.x).toBe(15)
      expect(movedImage.y).toBe(15)
    }
  })

  it('moves text anchors', () => {
    const [movedText] = translateOperations([text], 5, -5)
    if (movedText?.kind === 'text') {
      expect(movedText).toMatchObject({ x: 15, y: 15 })
    }
  })
})

describe('scaleOperations', () => {
  it('scales coordinates, sizes and image rectangles', () => {
    const [scaledStroke, scaledShape, scaledImage] = scaleOperations(
      [stroke, shape, image],
      0.5,
      0.5,
    )
    if (scaledStroke?.kind === 'stroke') {
      expect(scaledStroke.points[1]).toEqual({ x: 5, y: 10 })
      expect(scaledStroke.size).toBe(2)
    }
    if (scaledShape?.kind === 'shape') {
      expect(scaledShape.end).toEqual({ x: 5, y: 0 })
      expect(scaledShape.size).toBe(1)
    }
    if (scaledImage?.kind === 'image') {
      expect(scaledImage).toMatchObject({ x: 5, y: 10, width: 15, height: 20 })
    }
  })

  it('scales text position and font size', () => {
    const [scaledText] = scaleOperations([text], 0.5, 0.5)
    if (scaledText?.kind === 'text') {
      expect(scaledText).toMatchObject({ x: 5, y: 10, fontSize: 12 })
    }
  })
})

describe('rotateOperations', () => {
  it('rotates points clockwise within the document', () => {
    const [rotated] = rotateOperations([stroke], 1, 960, 720)
    if (rotated?.kind === 'stroke') {
      expect(rotated.points[0]).toEqual({ x: 720, y: 0 })
      expect(rotated.points[1]).toEqual({ x: 700, y: 10 })
    }
  })

  it('rotates image rectangles while keeping them axis-aligned', () => {
    const [rotated] = rotateOperations([image], 1, 960, 720)
    if (rotated?.kind === 'image') {
      expect(rotated).toMatchObject({ x: 660, y: 10, width: 40, height: 30 })
    }
  })

  it('rotates text anchors and adds to their rotation', () => {
    const [rotated] = rotateOperations([text], 1, 960, 720)
    if (rotated?.kind === 'text') {
      expect(rotated).toMatchObject({ x: 700, y: 10, rotation: 1 })
    }
  })

  it('returns a copy when there is no rotation', () => {
    const result = rotateOperations([stroke], 0, 960, 720)
    expect(result).toEqual([stroke])
    expect(result).not.toBe(rotateOperations([stroke], 0, 960, 720))
  })
})

describe('cropOperations', () => {
  it('translates content to the new origin', () => {
    const [cropped] = cropOperations([stroke], { x: 10, y: 20, width: 100, height: 100 })
    if (cropped?.kind === 'stroke') expect(cropped.points[0]).toEqual({ x: -10, y: -20 })
  })
})
