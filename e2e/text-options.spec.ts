import { expect, test } from '@playwright/test'
import { clearPersistedProject, expectFooterText } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearPersistedProject(page)
})

test('configures the text typeface, bold and italic', async ({ page }) => {
  await page.getByRole('button', { name: 'Text', exact: true }).click()

  const typeface = page.getByLabel('Typeface')
  await expect(typeface).toBeVisible()
  await typeface.selectOption('serif')
  await expect(typeface).toHaveValue('serif')

  const bold = page.getByRole('button', { name: 'Bold' })
  const italic = page.getByRole('button', { name: 'Italic' })
  await expect(bold).toHaveAttribute('aria-pressed', 'false')
  await bold.click()
  await italic.click()
  await expect(bold).toHaveAttribute('aria-pressed', 'true')
  await expect(italic).toHaveAttribute('aria-pressed', 'true')

  // Placing text still commits an operation.
  const box = await page.getByLabel('Drawing canvas').boundingBox()
  if (!box) throw new Error('Drawing canvas is not visible')
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.3)
  const input = page.getByLabel('Text to add')
  await input.fill('Styled')
  await input.press('Enter')
  await expectFooterText(page, '1 operation')
})
