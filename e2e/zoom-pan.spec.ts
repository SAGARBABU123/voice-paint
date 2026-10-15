import { expect, test } from '@playwright/test'
import { clearPersistedProject, drawStroke, expectOperationCount } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearPersistedProject(page)
})

const canvasWidth = async (page: import('@playwright/test').Page) =>
  (await page.getByLabel('Drawing canvas').boundingBox())?.width ?? 0

test('zooms in, out and back to fit from the status bar', async ({ page }) => {
  const fitWidth = await canvasWidth(page)

  await page.getByRole('button', { name: 'Zoom in' }).click()
  await expect.poll(() => canvasWidth(page)).toBeGreaterThan(fitWidth + 20)

  await page.getByRole('button', { name: 'Zoom out' }).click()
  await page.getByRole('button', { name: 'Fit' }).click()
  await expect.poll(() => canvasWidth(page)).toBeLessThan(fitWidth + 5)
})

test('zooms with the keyboard and the wheel', async ({ page }) => {
  const fitWidth = await canvasWidth(page)
  await page.keyboard.press('Control+=')
  await expect.poll(() => canvasWidth(page)).toBeGreaterThan(fitWidth + 20)
  await page.keyboard.press('Control+0')
  await expect.poll(() => canvasWidth(page)).toBeLessThan(fitWidth + 5)

  // Wheel zoom around the cursor.
  const box = await page.getByLabel('Drawing canvas').boundingBox()
  if (!box) throw new Error('canvas not visible')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.wheel(0, -120)
  await expect.poll(() => canvasWidth(page)).toBeGreaterThan(fitWidth + 20)
})

test('space-drag pans the sheet', async ({ page }) => {
  const before = await page.getByLabel('Drawing canvas').boundingBox()
  if (!before) throw new Error('canvas not visible')
  const cx = before.x + before.width / 2
  const cy = before.y + before.height / 2

  await page.mouse.move(cx, cy)
  await page.keyboard.down('Space')
  await page.mouse.down()
  await page.mouse.move(cx + 90, cy + 50, { steps: 5 })
  await page.mouse.up()
  await page.keyboard.up('Space')

  await expect
    .poll(async () => (await page.getByLabel('Drawing canvas').boundingBox())?.x ?? 0)
    .toBeGreaterThan(before.x + 40)
})

test('drawing still maps to document coordinates when zoomed', async ({ page }) => {
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await drawStroke(page)
  await expectOperationCount(page, 1)
})
