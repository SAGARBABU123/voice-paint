import { expect, test } from '@playwright/test'
import { expectOperationCount } from './helpers'

// A 1x1 transparent PNG.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

test('imports a PNG image into the document as an undoable operation', async ({ page }) => {
  await page.goto('/')
  await expectOperationCount(page, 0)

  await page.getByLabel('Choose image file').setInputFiles({
    name: 'dot.png',
    mimeType: 'image/png',
    buffer: Buffer.from(PNG_BASE64, 'base64'),
  })

  await expectOperationCount(page, 1)

  await page.getByRole('button', { name: 'Undo' }).click()
  await expectOperationCount(page, 0)
})

test('zooms the view and returns to actual size', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Actual size' }).click()
  await expect(page.getByText('100%')).toBeVisible()

  await page.getByRole('button', { name: 'Zoom in' }).click()
  await expect(page.getByText('125%')).toBeVisible()

  await page.getByRole('button', { name: 'Zoom out' }).click()
  await expect(page.getByText('100%')).toBeVisible()
})
