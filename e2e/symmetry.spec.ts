import { test } from '@playwright/test'
import { clearPersistedProject, drawStroke, expectOperationCount } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearPersistedProject(page)
})

test('mirror drawing commits the stroke and its mirror', async ({ page }) => {
  await page.getByRole('button', { name: 'Mirror horizontally' }).click()
  await drawStroke(page)
  await expectOperationCount(page, 2)
})

test('symmetry off draws a single stroke', async ({ page }) => {
  await page.getByRole('button', { name: 'Mirror both axes' }).click()
  await page.getByRole('button', { name: 'No symmetry' }).click()
  await drawStroke(page)
  await expectOperationCount(page, 1)
})
