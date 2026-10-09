import { expect, test } from '@playwright/test'
import { drawStroke, expectOperationCount, statusBar } from './helpers'

test('restores the drawing after a reload', async ({ page }) => {
  await page.goto('/')

  await drawStroke(page)
  await expectOperationCount(page, 1)
  await expect(statusBar(page)).toContainText('Saved')

  await page.reload()

  await expectOperationCount(page, 1)
})
