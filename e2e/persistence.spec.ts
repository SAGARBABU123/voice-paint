import { test } from '@playwright/test'
import { drawStroke, expectFooterText, expectOperationCount } from './helpers'

test('restores the drawing after a reload', async ({ page }) => {
  await page.goto('/')

  await drawStroke(page)
  await expectOperationCount(page, 1)
  await expectFooterText(page, 'Saved')

  await page.reload()

  await expectOperationCount(page, 1)
})
