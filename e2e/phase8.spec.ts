import { expect, test, type Page } from '@playwright/test'
import { drawStroke, expectOperationCount } from './helpers'

async function canvasBox(page: Page) {
  const box = await page.getByLabel('Drawing canvas').boundingBox()
  if (!box) throw new Error('Drawing canvas is not visible')
  return box
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('places text with the text tool', async ({ page }) => {
  await page.getByRole('button', { name: 'Text', exact: true }).click()

  const box = await canvasBox(page)
  await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.25)

  const input = page.getByLabel('Text to add')
  await expect(input).toBeVisible()
  await input.fill('Hello canvas')
  await input.press('Enter')

  await expectOperationCount(page, 1)
  await expect(input).toHaveCount(0)

  await page.getByRole('button', { name: 'Undo' }).click()
  await expectOperationCount(page, 0)
})

test('flood-fills from a click and undoes it', async ({ page }) => {
  await page.getByRole('button', { name: 'Fill', exact: true }).click()

  const box = await canvasBox(page)
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5)

  await expectOperationCount(page, 1)

  await page.getByRole('button', { name: 'Undo' }).click()
  await expectOperationCount(page, 0)
})

test('selects a region and moves it as one undoable step', async ({ page }) => {
  await drawStroke(page)
  await expectOperationCount(page, 1)

  await page.getByRole('button', { name: 'Select', exact: true }).click()
  const box = await canvasBox(page)

  // Marquee around the stroke.
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.7, { steps: 6 })
  await page.mouse.up()
  await expect(page.getByRole('button', { name: 'Deselect' })).toBeVisible()

  // Drag from inside the selection to move it.
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.45)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.55, { steps: 6 })
  await page.mouse.up()

  // The stroke plus the mask and patch added by the move.
  await expectOperationCount(page, 3)

  await page.getByRole('button', { name: 'Undo' }).click()
  await expectOperationCount(page, 1)
})
