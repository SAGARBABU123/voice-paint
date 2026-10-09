import { describe, expect, it } from 'vitest'
import { clientToDocumentPoint } from './coordinates'

describe('clientToDocumentPoint', () => {
  it('maps 1:1 when the canvas renders at its native size', () => {
    const rect = { left: 0, top: 0, width: 960, height: 720 }
    expect(clientToDocumentPoint(480, 360, rect, 960, 720)).toEqual({ x: 480, y: 360 })
  })

  it('maps correctly when the canvas is scaled down and offset', () => {
    const rect = { left: 100, top: 50, width: 480, height: 360 }
    expect(clientToDocumentPoint(340, 230, rect, 960, 720)).toEqual({ x: 480, y: 360 })
  })

  it('returns the origin for a zero-sized rect', () => {
    expect(
      clientToDocumentPoint(10, 10, { left: 0, top: 0, width: 0, height: 0 }, 960, 720),
    ).toEqual({ x: 0, y: 0 })
  })
})
