import { describe, expect, it } from 'vitest'
import { isPaintOperation } from './operations'

const stroke = {
  id: 'a',
  kind: 'stroke',
  tool: 'pencil',
  color: '#111111',
  size: 4,
  points: [{ x: 0, y: 0 }],
}
const shape = {
  id: 'b',
  kind: 'shape',
  tool: 'rectangle',
  color: '#111111',
  size: 4,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
}
const image = {
  id: 'c',
  kind: 'image',
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  dataUrl: 'data:image/png;base64,AAAA',
}
const text = {
  id: 'd',
  kind: 'text',
  x: 5,
  y: 6,
  text: 'hello',
  color: '#111111',
  fontSize: 24,
  fontFamily: 'sans-serif',
  rotation: 0,
}

describe('isPaintOperation', () => {
  it('accepts valid strokes, shapes, images and text', () => {
    expect(isPaintOperation(stroke)).toBe(true)
    expect(isPaintOperation(shape)).toBe(true)
    expect(isPaintOperation(image)).toBe(true)
    expect(isPaintOperation(text)).toBe(true)
  })

  it.each([
    ['null', null],
    ['an empty object', {}],
    ['a bad point', { ...stroke, points: [{ x: 'nope', y: 0 }] }],
    ['an unknown shape tool', { ...shape, tool: 'triangle' }],
    ['an unknown kind', { ...stroke, kind: 'blob' }],
    ['a non-numeric size', { ...stroke, size: 'big' }],
    ['an image without a size', { ...image, width: 'wide' }],
    ['an image with a non-image data URL', { ...image, dataUrl: 'https://example.com/x.png' }],
    ['text without characters', { ...text, text: 42 }],
    ['text without a font family', { ...text, fontFamily: undefined }],
    ['text with a non-numeric font size', { ...text, fontSize: 'big' }],
    ['text with a non-numeric rotation', { ...text, rotation: 'quarter' }],
  ])('rejects %s', (_label, value) => {
    expect(isPaintOperation(value)).toBe(false)
  })
})
