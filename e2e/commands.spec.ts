import { expect, test } from '@playwright/test'
import { clearPersistedProject } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearPersistedProject(page)
})

const canvasWidth = async (page: import('@playwright/test').Page) =>
  (await page.getByLabel('Drawing canvas').boundingBox())?.width ?? 0

test('the menu bar runs view commands', async ({ page }) => {
  const before = await canvasWidth(page)

  await page.getByRole('button', { name: 'View' }).click()
  await page.getByRole('menuitem', { name: 'Zoom in' }).click()

  await expect.poll(() => canvasWidth(page)).toBeGreaterThan(before + 20)
})

test('the command palette runs a tool with the keyboard', async ({ page }) => {
  await page.keyboard.press('Control+k')
  const dialog = page.getByRole('dialog', { name: 'Command palette' })
  await expect(dialog).toBeVisible()

  await page.getByLabel('Search commands').fill('eraser')
  await page.getByRole('option', { name: /Eraser/ }).click()

  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Eraser', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
