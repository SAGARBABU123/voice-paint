import { expect, test } from '@playwright/test'

test('loads the production build without runtime errors or backend calls', async ({ page }) => {
  const pageErrors: string[] = []
  const externalRequests: string[] = []

  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('request', (request) => {
    const { hostname } = new URL(request.url())
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      externalRequests.push(request.url())
    }
  })

  await page.goto('/')

  await expect(page).toHaveTitle('Voice Over Paint')
  await expect(page.getByRole('heading', { name: /voice over paint/i })).toBeVisible()
  await expect(page.getByLabel('Drawing canvas')).toBeVisible()
  await expect(page.getByRole('toolbar', { name: /drawing tools/i })).toBeVisible()

  expect(pageErrors).toEqual([])
  expect(externalRequests).toEqual([])
})
