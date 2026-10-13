import { expect, test } from '@playwright/test'
import { clearPersistedProject, expectOperationCount } from './helpers'

// A 1x1 transparent PNG.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

test('imports a PNG image into the document as an undoable operation', async ({ page }) => {
  await clearPersistedProject(page)
  await expectOperationCount(page, 0)

  await page.getByLabel('Choose image file').setInputFiles({
    name: 'dot.png',
    mimeType: 'image/png',
    buffer: Buffer.from(PNG_BASE64, 'base64'),
  })

  await expectOperationCount(page, 1)

  await page.keyboard.press('Control+z')
  await expectOperationCount(page, 0)
})

// Zoom controls were removed in the design-system refresh: the sheet is
// permanently fit-to-width (it spans the workspace and refits on resize).
test('keeps the sheet fitted to the workspace width across resizes', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 720 })
  await clearPersistedProject(page)

  const canvas = page.getByLabel('Drawing canvas')
  const before = await canvas.boundingBox()
  if (!before) throw new Error('Drawing canvas is not visible')

  await page.setViewportSize({ width: 1280, height: 800 })
  await expect
    .poll(async () => (await canvas.boundingBox())?.width ?? 0, { timeout: 5000 })
    .toBeGreaterThan(before.width + 100)
})
