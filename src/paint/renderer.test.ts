import { describe, expect, it } from 'vitest'
import { BACKGROUND_COLOR } from './constants'
import { renderOperation, renderScene } from './renderer'
import type { ImageOperation, ShapeOperation, StrokeOperation } from './types'

type Call = { method: string; args: unknown[] }

function createFakeContext() {
  const calls: Call[] = []
  const record =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push({ method, args })
    }

  const context = {
    calls,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    save: record('save'),
    restore: record('restore'),
    clearRect: record('clearRect'),
    fillRect: record('fillRect'),
    beginPath: record('beginPath'),
    moveTo: record('moveTo'),
    lineTo: record('lineTo'),
    stroke: record('stroke'),
    fill: record('fill'),
    arc: record('arc'),
    ellipse: record('ellipse'),
    strokeRect: record('strokeRect'),
    drawImage: record('drawImage'),
  }

  return context as unknown as CanvasRenderingContext2D & { calls: Call[]; strokeStyle: string }
}

function pencil(points: StrokeOperation['points']): StrokeOperation {
  return { id: 's', kind: 'stroke', tool: 'pencil', color: '#ff0000', size: 4, points }
}

function shape(tool: ShapeOperation['tool']): ShapeOperation {
  return {
    id: 'sh',
    kind: 'shape',
    tool,
    color: '#0000ff',
    size: 2,
    start: { x: 0, y: 0 },
    end: { x: 20, y: 40 },
  }
}

const IMAGE_OPERATION: ImageOperation = {
  id: 'img',
  kind: 'image',
  x: 10,
  y: 20,
  width: 30,
  height: 40,
  dataUrl: 'data:image/png;base64,AAAA',
}

function methods(ctx: { calls: Call[] }): string[] {
  return ctx.calls.map((call) => call.method)
}

describe('renderOperation — strokes and shapes', () => {
  it('draws a multi-point pencil stroke as a path', () => {
    const ctx = createFakeContext()
    renderOperation(
      ctx,
      pencil([
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        { x: 10, y: 10 },
      ]),
    )
    expect(methods(ctx)).toContain('moveTo')
    expect(methods(ctx)).toContain('lineTo')
    expect(methods(ctx)).toContain('stroke')
    expect(ctx.strokeStyle).toBe('#ff0000')
  })

  it('draws a single-point pencil stroke as a filled dot', () => {
    const ctx = createFakeContext()
    renderOperation(ctx, pencil([{ x: 3, y: 4 }]))
    expect(methods(ctx)).toContain('arc')
    expect(methods(ctx)).toContain('fill')
    expect(ctx.calls.find((call) => call.method === 'arc')?.args.slice(0, 3)).toEqual([3, 4, 2])
  })

  it('paints the eraser with the background colour', () => {
    const ctx = createFakeContext()
    renderOperation(ctx, {
      ...pencil([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ]),
      tool: 'eraser',
    })
    expect(ctx.strokeStyle).toBe(BACKGROUND_COLOR)
  })

  it('draws a line from start to end', () => {
    const ctx = createFakeContext()
    renderOperation(ctx, shape('line'))
    expect(ctx.calls.find((call) => call.method === 'moveTo')?.args).toEqual([0, 0])
    expect(ctx.calls.find((call) => call.method === 'lineTo')?.args).toEqual([20, 40])
  })

  it('draws a rectangle normalized from the two corners', () => {
    const ctx = createFakeContext()
    renderOperation(ctx, shape('rectangle'))
    expect(ctx.calls.find((call) => call.method === 'strokeRect')?.args).toEqual([0, 0, 20, 40])
  })

  it('draws an ellipse from the centre and radii', () => {
    const ctx = createFakeContext()
    renderOperation(ctx, shape('ellipse'))
    expect(ctx.calls.find((call) => call.method === 'ellipse')?.args.slice(0, 5)).toEqual([
      10, 20, 10, 20, 0,
    ])
  })
})

describe('renderOperation — image', () => {
  it('draws a decoded image at its placed rectangle', () => {
    const ctx = createFakeContext()
    const source = { tag: 'img' } as unknown as CanvasImageSource

    renderOperation(ctx, IMAGE_OPERATION, (dataUrl) =>
      dataUrl === IMAGE_OPERATION.dataUrl ? source : null,
    )

    expect(ctx.calls.find((call) => call.method === 'drawImage')?.args).toEqual([
      source,
      10,
      20,
      30,
      40,
    ])
  })

  it('skips the image when it is not decoded yet', () => {
    const ctx = createFakeContext()
    renderOperation(ctx, IMAGE_OPERATION, () => null)
    expect(methods(ctx)).not.toContain('drawImage')
  })
})

describe('renderScene', () => {
  it('clears, paints the background, then renders operations and preview', () => {
    const ctx = createFakeContext()
    renderScene(ctx, {
      width: 100,
      height: 50,
      operations: [shape('line')],
      preview: shape('ellipse'),
    })

    const clearIndex = methods(ctx).indexOf('clearRect')
    const fillIndex = methods(ctx).indexOf('fillRect')
    expect(clearIndex).toBeGreaterThanOrEqual(0)
    expect(clearIndex).toBeLessThan(fillIndex)
    expect(ctx.calls[clearIndex].args).toEqual([0, 0, 100, 50])
    expect(ctx.calls[fillIndex].args).toEqual([0, 0, 100, 50])
    expect(methods(ctx)).toContain('ellipse')
  })

  it('renders images when a resolver is supplied', () => {
    const ctx = createFakeContext()
    const source = {} as unknown as CanvasImageSource
    renderScene(ctx, {
      width: 10,
      height: 10,
      operations: [IMAGE_OPERATION],
      resolveImage: () => source,
    })
    expect(methods(ctx)).toContain('drawImage')
  })

  it('renders without a preview', () => {
    const ctx = createFakeContext()
    renderScene(ctx, { width: 10, height: 10, operations: [] })
    expect(methods(ctx)).not.toContain('ellipse')
    expect(methods(ctx)).not.toContain('stroke')
  })
})
