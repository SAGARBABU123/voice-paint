import { describe, expect, it } from 'vitest'
import { MAX_SHAPES, placeShapes } from './placement'

describe('placeShapes', () => {
  it('centres a single shape', () => {
    expect(placeShapes('center', 1, 960, 720)).toEqual([{ x: 480, y: 360 }])
  })

  it('spreads several shapes in a centred row', () => {
    const points = placeShapes('row', 3, 960, 720)
    expect(points).toHaveLength(3)
    expect(points[0]).toEqual({ x: 40, y: 360 })
    expect(points[2]).toEqual({ x: 920, y: 360 })
  })

  it('places shapes along an edge', () => {
    expect(placeShapes('top', 2, 960, 720)).toEqual([
      { x: 40, y: 40 },
      { x: 920, y: 40 },
    ])
  })

  it('places the four corners', () => {
    expect(placeShapes('corners', 4, 960, 720)).toEqual([
      { x: 40, y: 40 },
      { x: 920, y: 40 },
      { x: 920, y: 680 },
      { x: 40, y: 680 },
    ])
  })

  it('places a count per side around all four sides', () => {
    expect(placeShapes('sides', 2, 960, 720)).toHaveLength(8)
    expect(placeShapes('sides', 3, 960, 720)).toHaveLength(12)
  })

  it('caps the number of shapes', () => {
    expect(placeShapes('row', 999, 960, 720)).toHaveLength(MAX_SHAPES)
    expect(placeShapes('sides', 999, 960, 720)).toHaveLength(MAX_SHAPES)
  })
})
