import { expect, test } from '@playwright/test'
import {
  clearPersistedProject,
  drawStroke,
  expectFooterText,
  expectOperationCount,
} from './helpers'

test.beforeEach(async ({ page }) => {
  await page.context().route('**/sw.js', (route) => route.abort())
  await clearPersistedProject(page)
})

// History is exercised via the keyboard shortcuts: the tool rail's
// expand-on-hover animation swaps the DOM under the pointer mid-click, so
// direct clicks on the rail's undo/redo buttons are unreliable.
test('draws, then undoes and redoes', async ({ page }) => {
  await expectOperationCount(page, 0)

  await drawStroke(page)
  await expectOperationCount(page, 1)

  await page.keyboard.press('Control+z')
  await expectOperationCount(page, 0)

  await page.keyboard.press('Control+Shift+z')
  await expectOperationCount(page, 1)
})

test('changes tool, colour and size, then exports a PNG', async ({ page }) => {
  // The tool rail starts collapsed; hover to reveal the full kit and let its
  // width animation settle before clicking into it.
  await page.getByRole('toolbar', { name: /more tools/i }).hover()
  await page.waitForTimeout(400)

  // The shape gallery has several -rectangle tools; match the plain one.
  await page.getByRole('button', { name: 'Rectangle', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Rectangle', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expectFooterText(page, 'Rectangle')

  await page.getByLabel('Brush size').evaluate((element) => {
    const input = element as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, '20')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expectFooterText(page, 'Size 20px')

  await page.getByRole('button', { name: 'Select color #ef4444' }).click()
  await expectFooterText(page, 'Color #ef4444')

  await drawStroke(page)
  await expectOperationCount(page, 1)

  // The rail collapses once the mouse leaves it (e.g. during the draw), so
  // re-open it before the export actions.
  await page.getByRole('toolbar', { name: /more tools/i }).hover()
  await page.waitForTimeout(400)

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
