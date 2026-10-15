import { expect, test } from '@playwright/test'
import { clearPersistedProject, drawStroke, expectFooterText } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearPersistedProject(page)
})

const strokeMidpoint = async (page: import('@playwright/test').Page) => {
  const box = await page.getByLabel('Drawing canvas').boundingBox()
  if (!box) throw new Error('Drawing canvas is not visible')
  // drawStroke runs from (0.2,0.3) to (0.6,0.6); the midpoint is on the line.
  return { x: box.x + box.width * 0.4, y: box.y + box.height * 0.45 }
}

test('the eyedropper samples a colour from the canvas', async ({ page }) => {
  await drawStroke(page) // drawn in the default #111111
  await page.getByRole('toolbar', { name: /more tools/i }).hover()
  await page.getByRole('button', { name: 'Select color #3b82f6' }).click()
  await expectFooterText(page, 'Color #3b82f6')

  await page.getByRole('button', { name: 'Eyedropper', exact: true }).click()
  const point = await strokeMidpoint(page)
  await page.mouse.click(point.x, point.y)

  await expectFooterText(page, 'Color #111111')
})

test('alt-click samples with any tool', async ({ page }) => {
  await drawStroke(page)
  await page.getByRole('toolbar', { name: /more tools/i }).hover()
  await page.getByRole('button', { name: 'Select color #ef4444' }).click()
  await expectFooterText(page, 'Color #ef4444')

  const point = await strokeMidpoint(page)
  await page.keyboard.down('Alt')
  await page.mouse.click(point.x, point.y)
  await page.keyboard.up('Alt')

  await expectFooterText(page, 'Color #111111')
})

test('shows a fill-tolerance control for the fill tool', async ({ page }) => {
  await page.getByRole('button', { name: 'Fill', exact: true }).click()
  const tolerance = page.getByLabel('Tolerance')
  await expect(tolerance).toBeVisible()

  await tolerance.evaluate((element) => {
    const input = element as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, '48')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })

  await expect(page.getByTestId('fill-tolerance-value')).toHaveText('48')
})
