import { expect, test } from '@playwright/test'
import { drawStroke, expectOperationCount } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('shows a drawing hint before the first stroke', async ({ page }) => {
  await expect(page.getByText(/draw here with the mouse/i)).toBeVisible()
})

test('supports keyboard shortcuts for tools and history', async ({ page }) => {
  await page.keyboard.press('r')
  await expect(page.getByRole('button', { name: 'Rectangle' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.keyboard.press('e')
  await expect(page.getByRole('button', { name: 'Eraser' })).toHaveAttribute('aria-pressed', 'true')

  await page.keyboard.press('p')
  await drawStroke(page)
  await expectOperationCount(page, 1)

  await page.keyboard.press('Control+z')
  await expectOperationCount(page, 0)

  await page.keyboard.press('Control+Shift+z')
  await expectOperationCount(page, 1)
})

test('toggles the shortcuts panel with the ? key', async ({ page }) => {
  await page.keyboard.press('?')
  await expect(page.getByRole('region', { name: 'Keyboard shortcuts' })).toBeVisible()
})

test('shows the voice command help', async ({ page }) => {
  await page.getByRole('button', { name: 'What can I say?' }).click()

  const help = page.getByRole('region', { name: 'Voice command help' })
  await expect(help).toBeVisible()
  await expect(help.getByText('set color to red')).toBeVisible()
})

test('supports keyboard shortcuts for the text, fill, and select tools', async ({ page }) => {
  await page.keyboard.press('t')
  await expect(page.getByRole('button', { name: 'Text', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.keyboard.press('f')
  await expect(page.getByRole('button', { name: 'Fill', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.keyboard.press('m')
  await expect(page.getByRole('button', { name: 'Select', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('traps focus in the resize dialog and restores it on Escape', async ({ page }) => {
  const resizeTrigger = page.getByRole('button', { name: 'Resize', exact: true })
  await resizeTrigger.click()

  const dialog = page.getByRole('dialog', { name: 'Resize document' })
  await expect(dialog).toBeVisible()

  await page.keyboard.press('Shift+Tab')
  expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true)

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(resizeTrigger).toBeFocused()
})
