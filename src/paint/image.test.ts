import { describe, expect, it } from 'vitest'
import { createImageOperation, readFileAsDataUrl } from './image'

describe('readFileAsDataUrl', () => {
  it('reads a file into a data URL', async () => {
    const file = new File(['hello'], 'note.txt', { type: 'text/plain' })
    const result = await readFileAsDataUrl(file)
    expect(result.startsWith('data:text/plain;base64,')).toBe(true)
  })
})

describe('createImageOperation', () => {
  it('fits and centres the image inside the document', () => {
    const operation = createImageOperation('data:image/png;base64,AAAA', 400, 200, 960, 720)

    expect(operation.kind).toBe('image')
    expect(operation.width).toBeCloseTo(960)
    expect(operation.height).toBeCloseTo(480)
    expect(operation.x).toBeCloseTo(0)
    expect(operation.y).toBeCloseTo(120)
  })

  it('does not divide by zero for a degenerate source', () => {
    const operation = createImageOperation('data:image/png;base64,AAAA', 0, 0, 960, 720)
    expect(operation.width).toBe(960)
    expect(operation.height).toBe(720)
  })
})
