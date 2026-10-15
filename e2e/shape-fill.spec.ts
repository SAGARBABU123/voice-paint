import { expect, test } from '@playwright/test'
import { clearPersistedProject, expectOperationCount } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearPersistedProject(page)
})

test('draws a filled shape when fill is chosen', async ({ page }) => {
  await page.getByRole('toolbar', { name: /more tools/i }).hover()
  await page.getByRole('button', { name: 'Ellipse', exact: true }).click()

  const fill = page.getByRole('button', { name: 'Filled shape' })
  await expect(fill).toBeVisible()
  await fill.click()
  await expect(fill).toHaveAttribute('aria-pressed', 'true')

  const box = await page.getByLabel('Drawing canvas').boundingBox()
  if (!box) throw new Error('Drawing canvas is not visible')
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6, { steps: 5 })
  await page.mouse.up()

  await expectOperationCount(page, 1)
})
