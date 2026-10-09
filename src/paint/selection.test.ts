import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSelectionMask, createSelectionMove } from './selection'

type CanvasSpec = {
  getContext: (contextId: string) => unknown
  toDataURL?: () => string
}

/** Installs a queue of fake canvas elements, one per `document.createElement`. */
function installCanvases(specs: CanvasSpec[]) {
  const originalCreateElement = document.createElement.bind(document)
  let created = 0

  vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
    if (tagName !== 'canvas') return originalCreateElement(tagName)
    const spec = specs[created] ?? specs[specs.length - 1]
    created += 1
    return {
      width: 0,
      height: 0,
      getContext: spec.getContext,
      toDataURL: spec.toDataURL ?? (() => 'data:image/png;base64,CANVAS'),
    } as unknown as HTMLElement
  }) as typeof document.createElement)
}

function sceneContext() {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    save() {},
    restore() {},
    clearRect() {},
    fillRect() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    fill() {},
    arc() {},
    ellipse() {},
    strokeRect() {},
    drawImage() {},
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createSelectionMask', () => {
  it('builds a background-coloured image clamped to the document', () => {
    const context = { fillStyle: '', fillRect: vi.fn() }
    installCanvases([{ getContext: () => context, toDataURL: () => 'data:image/png;base64,MASK' }])

    const mask = createSelectionMask(100, 100, '#abcdef', {
      x: -5,
      y: -5,
      width: 50,
      height: 50,
    })

    expect(mask).toMatchObject({
      kind: 'image',
      x: 0,
      y: 0,
      width: 45,
      height: 45,
      dataUrl: 'data:image/png;base64,MASK',
    })
    expect(context.fillStyle).toBe('#abcdef')
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 1, 1)
  })

  it('returns null for an empty region', () => {
    installCanvases([{ getContext: () => sceneContext() }])
    expect(createSelectionMask(100, 100, '#ffffff', { x: 0, y: 0, width: 0, height: 0 })).toBeNull()
  })
})

describe('createSelectionMove', () => {
  it('returns a mask at the origin and a patch at the destination', () => {
    const patchContext = { drawImage: vi.fn() }
    const maskContext = { fillStyle: '', fillRect: vi.fn() }
    installCanvases([
      { getContext: () => sceneContext(), toDataURL: () => 'data:image/png;base64,SCENE' },
      { getContext: () => patchContext, toDataURL: () => 'data:image/png;base64,PATCH' },
      { getContext: () => maskContext, toDataURL: () => 'data:image/png;base64,MASK' },
    ])

    const move = createSelectionMove(
      [],
      100,
      100,
      '#ffffff',
      { x: 10, y: 20, width: 30, height: 40 },
      5,
      7,
    )

    expect(move?.mask).toMatchObject({ x: 10, y: 20, width: 30, height: 40 })
    expect(move?.patch).toMatchObject({
      x: 15,
      y: 27,
      width: 30,
      height: 40,
      dataUrl: 'data:image/png;base64,PATCH',
    })
    expect(patchContext.drawImage).toHaveBeenCalledTimes(1)
    expect(patchContext.drawImage.mock.calls[0]?.slice(1)).toEqual([10, 20, 30, 40, 0, 0, 30, 40])
  })

  it('returns null for an empty region or a missing context', () => {
    installCanvases([{ getContext: () => null }])
    expect(
      createSelectionMove([], 100, 100, '#ffffff', { x: 0, y: 0, width: 0, height: 0 }, 1, 1),
    ).toBeNull()
    expect(
      createSelectionMove([], 100, 100, '#ffffff', { x: 0, y: 0, width: 10, height: 10 }, 1, 1),
    ).toBeNull()
  })
})
