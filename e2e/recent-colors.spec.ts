import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('remembers a recently used colour across a reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Select color #ef4444' }).click()

  const recent = page.getByRole('button', { name: 'Use recent color #ef4444' })
  await expect(recent).toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: 'Use recent color #ef4444' })).toBeVisible()
})

test('can clear the recent colours', async ({ page }) => {
  await page.getByRole('button', { name: 'Select color #3b82f6' }).click()
  await expect(page.getByRole('button', { name: 'Use recent color #3b82f6' })).toBeVisible()

  await page.getByRole('button', { name: 'Clear recent colors' }).click()

  await expect(page.getByRole('button', { name: 'Use recent color #3b82f6' })).toHaveCount(0)
})
