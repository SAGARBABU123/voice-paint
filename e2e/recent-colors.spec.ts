import { expect, test, type Page } from '@playwright/test'
import { clearPersistedProject } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearPersistedProject(page)
})

// The colour picker and recents live in the tool rail, which is collapsed
// until hovered; re-expand it after each reload.
function expandRail(page: Page) {
  return page.getByRole('toolbar', { name: /more tools/i }).hover()
}

test('remembers a recently used colour across a reload', async ({ page }) => {
  await expandRail(page)
  await page.getByRole('button', { name: 'Select color #ef4444' }).click()

  const recent = page.getByRole('button', { name: 'Use recent color #ef4444' })
  await expect(recent).toBeVisible()

  await page.reload()
  await expandRail(page)
  await expect(page.getByRole('button', { name: 'Use recent color #ef4444' })).toBeVisible()
})

test('can clear the recent colours', async ({ page }) => {
  await expandRail(page)
  await page.getByRole('button', { name: 'Select color #3b82f6' }).click()
  await expect(page.getByRole('button', { name: 'Use recent color #3b82f6' })).toBeVisible()

  await page.getByRole('button', { name: 'Clear recent colors' }).click()

  await expect(page.getByRole('button', { name: 'Use recent color #3b82f6' })).toHaveCount(0)
})
