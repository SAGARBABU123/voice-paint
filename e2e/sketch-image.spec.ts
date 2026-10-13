import { expect, test } from '@playwright/test'
import { deflateSync } from 'node:zlib'

/**
 * End-to-end check for the photo → hand-drawn-strokes feature. Proves the
 * real browser path: lazy-loading the OpenCV WASM chunk (~15 MB) and
 * converting a photo into undoable pencil strokes on the sheet.
 */

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i]
    for (let k = 0; k < 8; k += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([length, typeBuf, data, crc])
}

/** 320×320 white sheet with a black disk and a dark bar (high contrast). */
function contrastPng(width: number, height: number): Buffer {
  const raw = Buffer.alloc((width * 3 + 1) * height)
  const cx = width / 2
  const cy = height / 2
  const radius = 100
  let offset = 0
  for (let y = 0; y < height; y += 1) {
    raw[offset++] = 0 // filter: none
    for (let x = 0; x < width; x += 1) {
      const inDisk = Math.hypot(x - cx, y - cy) <= radius
      const inBar = Math.abs(x - width * 0.75) < 12 && y > 40 && y < height - 40
      const value = inDisk || inBar ? 20 : 245
      raw[offset++] = value
      raw[offset++] = value
      raw[offset++] = value
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

test('sketches an uploaded photo as hand-drawn strokes', async ({ page }) => {
  // The first conversion lazy-loads the ~15 MB OpenCV WASM chunk.
  test.setTimeout(180_000)
  await page.context().route('**/sw.js', (route) => route.abort())
  await page.goto('/')

  const png = { name: 'contrast.png', mimeType: 'image/png', buffer: contrastPng(320, 320) }
  const written = page.getByText('Written by hand')

  // The first upload lazy-loads the ~15 MB OpenCV WASM chunk; be generous with
  // the wait (the default 30 s test timeout is far too short for it).
  await page.setInputFiles('input[aria-label="Choose photo to sketch"]', png)
  await expect(written).toBeVisible({ timeout: 150_000 })
  await expect(page.getByText(/wrote \d+ stroke/)).toBeVisible()

  // The strokes committed as real, undoable history.
  await expect(page.getByTitle('Undo (Ctrl/Cmd+Z)')).toBeEnabled()
})
