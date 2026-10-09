import { expect, test } from '@playwright/test'

test('rotates the document and updates the canvas dimensions', async ({ page }) => {
  await page.goto('/')
  const canvas = page.getByLabel('Drawing canvas')

  await expect(canvas).toHaveAttribute('width', '960')
  await expect(canvas).toHaveAttribute('height', '720')

  await page.getByRole('button', { name: 'Rotate right' }).click()
  await expect(canvas).toHaveAttribute('width', '720')
  await expect(canvas).toHaveAttribute('height', '960')

  await page.getByRole('button', { name: 'Rotate left' }).click()
  await expect(canvas).toHaveAttribute('width', '960')
  await expect(canvas).toHaveAttribute('height', '720')
})

test('resizes the document via the dialog', async ({ page }) => {
  await page.goto('/')
  const canvas = page.getByLabel('Drawing canvas')

  await page.getByRole('button', { name: 'Resize' }).click()
  await page.getByLabel('Width').fill('480')
  await page.getByLabel('Height').fill('360')
  await page.getByRole('button', { name: 'Apply resize' }).click()

  await expect(canvas).toHaveAttribute('width', '480')
  await expect(canvas).toHaveAttribute('height', '360')
})

test('crops the document from a dragged area', async ({ page }) => {
  await page.goto('/')
  const canvas = page.getByLabel('Drawing canvas')

  await page.getByRole('button', { name: 'Crop' }).click()

  const box = await canvas.boundingBox()
  if (!box) throw new Error('Drawing canvas is not visible')

  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.25)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.75, { steps: 5 })
  await page.mouse.up()

  await page.getByRole('button', { name: 'Apply crop' }).click()

  const width = Number(await canvas.getAttribute('width'))
  const height = Number(await canvas.getAttribute('height'))
  expect(width).toBeGreaterThan(0)
  expect(width).toBeLessThan(960)
  expect(height).toBeGreaterThan(0)
  expect(height).toBeLessThan(720)
})
