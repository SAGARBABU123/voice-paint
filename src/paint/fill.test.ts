import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFillOperation } from './fill'

/**
 * Installs fake canvas elements so the rasterise -> flood-fill -> bake pipeline
 * can be exercised without a real Canvas 2D implementation.
 */
function installCanvases(width: number, height: number) {
  const pixels = new Uint8ClampedArray(width * height * 4)
  for (let index = 0; index < width * height; index += 1) {
    pixels.set([255, 255, 255, 255], index * 4)
  }
  const imageData = { width, height, data: pixels }
  const putImageCalls: { x: number; y: number }[] = []

  const sceneContext = {
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
    getImageData: () => imageData,
  }

  const patchContext = {
    putImageData: (_data: unknown, x: number, y: number) => {
      putImageCalls.push({ x, y })
    },
  }

  const originalCreateElement = document.createElement.bind(document)
  let created = 0

  vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
    if (tagName !== 'canvas') return originalCreateElement(tagName)
    created += 1
    if (created === 1) {
      return { width, height, getContext: () => sceneContext } as unknown as HTMLElement
    }
    return {
      width,
      height,
      getContext: () => patchContext,
      toDataURL: () => 'data:image/png;base64,PATCH',
    } as unknown as HTMLElement
  }) as typeof document.createElement)

  return { pixels, putImageCalls }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createFillOperation', () => {
  it('rasterises, fills, and bakes the changed region into an image operation', () => {
    const { pixels, putImageCalls } = installCanvases(4, 4)

    const operation = createFillOperation([], 4, 4, { x: 1, y: 1 }, '#000000')

    expect(operation).toMatchObject({
      kind: 'image',
      x: 0,
      y: 0,
      width: 4,
      height: 4,
      dataUrl: 'data:image/png;base64,PATCH',
    })
    expect(putImageCalls).toHaveLength(1)
    expect(putImageCalls[0].x + 0).toBe(0)
    expect(putImageCalls[0].y + 0).toBe(0)
    expect(Array.from(pixels.slice(0, 4))).toEqual([0, 0, 0, 255])
  })

  it('returns null when the seed already matches the fill colour', () => {
    installCanvases(4, 4)
    expect(createFillOperation([], 4, 4, { x: 0, y: 0 }, '#ffffff')).toBeNull()
  })

  it('returns null when no 2D context is available', () => {
    vi.spyOn(document, 'createElement').mockImplementation((() => ({
      width: 0,
      height: 0,
      getContext: () => null,
    })) as unknown as typeof document.createElement)

    expect(createFillOperation([], 4, 4, { x: 0, y: 0 }, '#000000')).toBeNull()
  })
})
