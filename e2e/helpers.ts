import { expect, type Page } from '@playwright/test'

/** Draws a diagonal stroke across the canvas using real pointer input. */
export async function drawStroke(page: Page): Promise<void> {
  const canvas = page.getByLabel('Drawing canvas')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Drawing canvas is not visible')

  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6, { steps: 8 })
  await page.mouse.up()
}

/** The status bar is the app's <footer>; assert on its live summary text. */
export function statusBar(page: Page) {
  return page.locator('footer')
}

export async function expectOperationCount(page: Page, count: number): Promise<void> {
  const label = `${count} operation${count === 1 ? '' : 's'}`
  await expect(statusBar(page)).toContainText(label)
}
