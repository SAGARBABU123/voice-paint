import { expect, test } from '@playwright/test'
import { clearPersistedProject, drawStroke, expectOperationCount } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearPersistedProject(page)
})

test('lists steps and jumps back to an earlier state', async ({ page }) => {
  await drawStroke(page)
  await expectOperationCount(page, 1)

  // The right dock is tabbed; History is its own tab.
  await page.getByRole('tab', { name: 'History' }).click()
  const history = page.getByRole('region', { name: 'History' })
  await expect(history).toBeVisible()
  await expect(history.getByRole('button', { name: /Pencil/ })).toBeVisible()

  // Jump back to the empty canvas.
  await history.getByRole('button', { name: /Empty canvas/ }).click()
  await expectOperationCount(page, 0)

  // The step is still there, so we can jump forward again.
  await history.getByRole('button', { name: /Pencil/ }).click()
  await expectOperationCount(page, 1)
})

test('switches dock tabs', async ({ page }) => {
  const voice = page.getByRole('tab', { name: 'Voice' })
  const history = page.getByRole('tab', { name: 'History' })
  await expect(voice).toHaveAttribute('aria-selected', 'true')

  await history.click()
  await expect(history).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('region', { name: 'History' })).toBeVisible()

  await voice.click()
  await expect(page.getByRole('button', { name: 'What can I say?' })).toBeVisible()
})
