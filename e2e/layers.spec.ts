import { expect, test } from '@playwright/test'
import { clearPersistedProject, drawStroke, expectOperationCount } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearPersistedProject(page)
  await page.getByRole('tab', { name: 'Layers' }).click()
})

const layer = (page: import('@playwright/test').Page, name: string) =>
  page.getByTestId('layers-list').getByRole('button', { name: `Select ${name}` })

test('adds a layer and draws into it', async ({ page }) => {
  await drawStroke(page)
  await expectOperationCount(page, 1)

  await page.getByRole('button', { name: 'Add layer' }).click()
  await expect(layer(page, 'Layer 2')).toHaveAttribute('aria-current', 'true')

  await drawStroke(page)
  await expectOperationCount(page, 2)

  // Switching back to the first layer keeps its single operation.
  await layer(page, 'Layer 1').click()
  await expect(layer(page, 'Layer 1')).toHaveAttribute('aria-current', 'true')
  await expect(page.getByTestId('layers-list')).toContainText('Layer 1')
})

test('hides a layer and merges it down', async ({ page }) => {
  await drawStroke(page)
  await page.getByRole('button', { name: 'Add layer' }).click()
  await drawStroke(page)

  await page.getByRole('button', { name: 'Hide Layer 2' }).click()
  await expect(page.getByRole('button', { name: 'Show Layer 2' })).toBeVisible()

  // Merge Layer 2 into Layer 1 -> a single layer remains.
  await page.getByRole('button', { name: 'Merge down' }).click()
  await expect(
    page.getByTestId('layers-list').getByRole('button', { name: /Select / }),
  ).toHaveCount(1)
})

test('deleting is disabled with a single layer', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Delete' })).toBeDisabled()
})
