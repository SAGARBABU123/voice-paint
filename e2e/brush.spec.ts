import { expect, test } from '@playwright/test'
import { clearPersistedProject } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearPersistedProject(page)
})

test('exposes brush opacity, smoothing and pressure for the pencil', async ({ page }) => {
  const opacity = page.getByLabel('Opacity')
  const smoothing = page.getByLabel('Smooth')
  const pressure = page.getByRole('button', { name: 'Pen pressure' })
  await expect(opacity).toBeVisible()
  await expect(smoothing).toBeVisible()
  await expect(pressure).toBeVisible()

  await opacity.evaluate((element) => {
    const input = element as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, '40')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(page.getByTestId('brush-opacity-value')).toHaveText('40%')

  await expect(pressure).toHaveAttribute('aria-pressed', 'true')
  await pressure.click()
  await expect(pressure).toHaveAttribute('aria-pressed', 'false')
})

test('hides freehand-only controls for a shape tool', async ({ page }) => {
  await page.getByRole('toolbar', { name: /more tools/i }).hover()
  await page.getByRole('button', { name: 'Rectangle', exact: true }).click()
  await expect(page.getByLabel('Opacity')).toBeVisible()
  await expect(page.getByLabel('Smooth')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Pen pressure' })).toHaveCount(0)
})
