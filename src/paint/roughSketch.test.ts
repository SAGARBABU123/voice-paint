import { describe, expect, it } from 'vitest'
import { opsToPolyline, renderRoughLines, type RoughOp } from './roughSketch'
import type { Point } from './types'

const pts = (...coords: [number, number][]): Point[] => coords.map(([x, y]) => ({ x, y }))

const toLine = (points: Point[]): string => JSON.stringify(points)

describe('opsToPolyline', () => {
  it('keeps move/lineTo points 1:1', () => {
    const out = opsToPolyline(
      [
        { op: 'move', data: [1, 2] },
        { op: 'lineTo', data: [3, 4] },
        { op: 'lineTo', data: [5, 6] },
      ],
      100,
    )
    expect(out).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
      { x: 5, y: 6 },
    ])
  })

  it('samples cubic beziers into polyline points', () => {
    const out = opsToPolyline(
      [
        { op: 'move', data: [0, 0] },
        { op: 'bcurveTo', data: [10, 0, 20, 0, 30, 0] },
      ] satisfies RoughOp[],
      100,
    )
    expect(out.length).toBeGreaterThan(3)
    expect(out[0]).toEqual({ x: 0, y: 0 })
    expect(out[out.length - 1]).toEqual({ x: 30, y: 0 })
    // The curve lies on the straight control axis: no runaway points.
    const yOffAxis = out.filter((p) => Math.abs(p.y) > 1e-9)
    expect(yOffAxis).toHaveLength(0)
  })

  it('caps output to the requested limit', () => {
    const ops: Array<{ op: 'move' | 'bcurveTo'; data: number[] }> = [
      { op: 'move', data: [0, 0] },
      ...Array.from({ length: 40 }, (_, k): { op: 'bcurveTo'; data: number[] } => ({
        op: 'bcurveTo',
        data: [k, 0, k + 1, 0, k + 2, 0],
      })),
    ]
    expect(opsToPolyline(ops, 10).length).toBeLessThanOrEqual(10)
    expect(opsToPolyline(ops, 10).length).toBeGreaterThanOrEqual(2)
  })

  it('samples quadratic beziers too', () => {
    const out = opsToPolyline(
      [
        { op: 'move', data: [0, 0] },
        { op: 'qcurveTo', data: [5, 5, 10, 0] },
      ] satisfies RoughOp[],
      100,
    )
    expect(out[out.length - 1]).toEqual({ x: 10, y: 0 })
    expect(out.some((point) => point.y > 1)).toBe(true) // bulge through the control point
  })
})

describe('renderRoughLines (rough.js)', () => {
  const source = pts([10, 10], [40, 12], [70, 10], [100, 16], [130, 10])

  it('is deterministic: same seed, same strokes', () => {
    const a = renderRoughLines([source], { seed: 42, roughness: 0.7 })
    const b = renderRoughLines([source], { seed: 42, roughness: 0.7 })
    expect(toLine(a[0])).toBe(toLine(b[0]))
  })

  it('produces different geometry for a different seed', () => {
    const a = renderRoughLines([source], { seed: 42, roughness: 0.7 })
    const b = renderRoughLines([source], { seed: 43, roughness: 0.7 })
    expect(toLine(a[0])).not.toBe(toLine(b[0]))
  })

  it('stays deterministic even for a zero or absent seed (guarded against rough.js randomness)', () => {
    // rough.js uses Math.random for seed 0 — our guard maps it to a fixed seed,
    // so repeated calls must agree (and absent seeds use a fixed default).
    const a = renderRoughLines([source], { seed: 0 })
    const b = renderRoughLines([source], { seed: 0 })
    const c = renderRoughLines([source], {})
    const d = renderRoughLines([source], {})
    expect(toLine(a[0])).toBe(toLine(b[0]))
    expect(toLine(c[0])).toBe(toLine(d[0]))
  })

  it('adds hand-drawn wobble: roughness changes the drawn path', () => {
    const smooth = renderRoughLines([source], { roughness: 0 })
    const sketchy = renderRoughLines([source], { roughness: 0.9 })
    expect(toLine(smooth[0])).not.toBe(toLine(sketchy[0]))
  })

  it('keeps the sketch near the source contour (no runaway strokes)', () => {
    const drawn = renderRoughLines([source], { seed: 42, roughness: 0.7 })[0]
    // Endpoints must land back on the source polyline within rough.js's
    // bounded randomness (~2-3 px at default maxRandomnessOffset).
    expect(Math.abs(drawn[0].x - source[0].x)).toBeLessThan(6)
    expect(Math.abs(drawn[0].y - source[0].y)).toBeLessThan(6)
    expect(Math.abs(drawn[drawn.length - 1].x - source[source.length - 1].x)).toBeLessThan(6)
    expect(Math.abs(drawn[drawn.length - 1].y - source[source.length - 1].y)).toBeLessThan(6)

    // Interior points hug the source polyline: measure perpendicular distance
    // to the nearest source segment (rough.js bounds wobble to a few px).
    const distanceToSegment = (point: Point, a: Point, b: Point): number => {
      const dx = b.x - a.x
      const dy = b.y - a.y
      const lengthSq = dx * dx + dy * dy
      if (lengthSq === 0) return Math.hypot(point.x - a.x, point.y - a.y)
      const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq))
      return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy))
    }
    for (const point of drawn) {
      const nearest = Math.min(
        ...source.slice(0, -1).map((_, i) => distanceToSegment(point, source[i], source[i + 1])),
      )
      expect(nearest).toBeLessThan(6)
    }
  })

  it('caps each rendered stroke (double-pass + bezier inflation guard)', () => {
    const long = pts(
      ...Array.from({ length: 120 }, (_, k) => [k * 2, 10 + (k % 3)] as [number, number]),
    )
    const [drawn] = renderRoughLines([long], { seed: 7, maxPointsPerLine: 80 })
    expect(drawn.length).toBeLessThanOrEqual(80 * 3)
    expect(drawn.length).toBeGreaterThanOrEqual(2)
  })

  it('renders each contour as its own stroke', () => {
    const out = renderRoughLines([source, source.map((p) => ({ x: p.x + 200, y: p.y }))], {
      seed: 42,
    })
    expect(out).toHaveLength(2)
    expect(toLine(out[0])).not.toBe(toLine(out[1])) // different seed per stroke
  })
})
