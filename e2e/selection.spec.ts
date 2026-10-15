import { expect, test } from '@playwright/test'
import { clearPersistedProject, drawStroke, expectOperationCount } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearPersistedProject(page)
})

async function marquee(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Select', exact: true }).click()
  const box = await page.getByLabel('Drawing canvas').boundingBox()
  if (!box) throw new Error('Drawing canvas is not visible')
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.7, { steps: 6 })
  await page.mouse.up()
}

test('copy and paste adds an operation', async ({ page }) => {
  await drawStroke(page)
  await expectOperationCount(page, 1)

  await marquee(page)
  await page.getByRole('button', { name: 'Copy', exact: true }).click()
  await page.getByRole('button', { name: 'Paste', exact: true }).click()

  await expectOperationCount(page, 2)
})

test('duplicate copies the selection in place', async ({ page }) => {
  await drawStroke(page)
  await marquee(page)

  await page.getByRole('button', { name: 'Duplicate', exact: true }).click()
  await expectOperationCount(page, 2)
})

test('select all then delete clears the drawing', async ({ page }) => {
  await drawStroke(page)
  await expectOperationCount(page, 1)

  await page.getByRole('button', { name: 'Select', exact: true }).click()
  await page.getByRole('button', { name: 'Select all' }).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()

  await expectOperationCount(page, 2) // the delete is itself an undoable op
})

test('cut removes the selection and enables paste', async ({ page }) => {
  await drawStroke(page)
  await marquee(page)

  await page.getByRole('button', { name: 'Cut', exact: true }).click()
  await expectOperationCount(page, 2) // stroke + cut
  await expect(page.getByRole('button', { name: 'Paste', exact: true })).toBeEnabled()
})
