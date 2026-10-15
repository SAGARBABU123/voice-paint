import { expect, test } from '@playwright/test'
import { clearPersistedProject, drawStroke, expectOperationCount } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearPersistedProject(page)
})

test('lists steps and jumps back to an earlier state', async ({ page }) => {
  await drawStroke(page)
  await expectOperationCount(page, 1)

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
