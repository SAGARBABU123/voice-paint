import { expect, test } from '@playwright/test'
import { drawStroke, expectOperationCount, statusBar } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('draws, then undoes and redoes', async ({ page }) => {
  await expectOperationCount(page, 0)

  await drawStroke(page)
  await expectOperationCount(page, 1)

  await page.getByRole('button', { name: 'Undo' }).click()
  await expectOperationCount(page, 0)

  await page.getByRole('button', { name: 'Redo' }).click()
  await expectOperationCount(page, 1)
})

test('changes tool, colour and size, then exports a PNG', async ({ page }) => {
  // The tool rail starts collapsed; hover to reveal the full kit.
  await page.getByRole('toolbar', { name: /more tools/i }).hover()

  await page.getByRole('button', { name: 'Rectangle' }).click()
  await expect(page.getByRole('button', { name: 'Rectangle' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(statusBar(page)).toContainText('Rectangle')

  await page.getByLabel('Brush size').evaluate((element) => {
    const input = element as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, '20')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(statusBar(page)).toContainText('Size 20px')

  await page.getByRole('button', { name: 'Select color #ef4444' }).click()
  await expect(statusBar(page)).toContainText('Color #ef4444')

  await drawStroke(page)
  await expectOperationCount(page, 1)

  // Export is a single entry with a format menu.
  await page.getByRole('button', { name: 'Export' }).click()
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /^png$/i }).click(),
  ])
  expect(download.suggestedFilename()).toBe('voice-over-paint.png')
  expect(await download.path()).toBeTruthy()
})

test('clears only after confirmation', async ({ page }) => {
  await drawStroke(page)
  await expectOperationCount(page, 1)

  await page.getByRole('button', { name: /clear canvas/i }).click()
  const dialog = page.getByRole('alertdialog', { name: /clear the canvas/i })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Clear' }).click()

  await expectOperationCount(page, 0)
})
