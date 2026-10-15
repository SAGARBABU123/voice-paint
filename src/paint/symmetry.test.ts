import { describe, expect, it } from 'vitest'
import { mirrorOperation } from './symmetry'
import type { ImageOperation, StrokeOperation } from './types'

const stroke: StrokeOperation = {
  id: 's',
  kind: 'stroke',
  tool: 'pencil',
  color: '#000000',
  size: 4,
  points: [
    { x: 10, y: 20 },
    { x: 30, y: 40 },
  ],
}

const image: ImageOperation = {
  id: 'i',
  kind: 'image',
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  dataUrl: 'data:image/png;base64,',
}

describe('mirrorOperation', () => {
  it('mirrors a stroke across the vertical axis with a new id', () => {
    const [mirror] = mirrorOperation(stroke, 100, 50, 'x')
    expect(mirror.id).not.toBe('s')
    expect(mirror.kind).toBe('stroke')
    if (mirror.kind === 'stroke') {
      expect(mirror.points.map((point) => [point.x, point.y])).toEqual([
        [90, 20],
        [70, 40],
      ])
    }
  })

  it('produces three copies for both axes', () => {
    expect(mirrorOperation(stroke, 100, 50, 'both')).toHaveLength(3)
  })

  it('mirrors across the horizontal axis', () => {
    const [mirror] = mirrorOperation(stroke, 100, 50, 'y')
    if (mirror.kind === 'stroke') {
      expect(mirror.points[0]).toEqual({ x: 10, y: 30 })
    }
  })

  it('returns nothing when off or for non-mirrorable operations', () => {
    expect(mirrorOperation(stroke, 100, 50, 'off')).toHaveLength(0)
    expect(mirrorOperation(image, 100, 50, 'x')).toHaveLength(0)
  })
})
