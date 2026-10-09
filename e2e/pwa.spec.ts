import { expect, test } from '@playwright/test'

test('exposes a web app manifest with icons', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  )

  const response = await page.request.get('/manifest.webmanifest')
  expect(response.ok()).toBe(true)

  const manifest = await response.json()
  expect(manifest.name).toBe('Voice Over Paint')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.length).toBeGreaterThan(0)
})

test('registers the service worker for offline use', async ({ page }) => {
  await page.goto('/')

  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.getRegistrations().then((list) => list.length)),
    )
    .toBe(1)
})
