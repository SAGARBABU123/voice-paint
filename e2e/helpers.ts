import { expect, type Page } from '@playwright/test'

const PROJECT_DATABASE = 'voice-over-paint'
const PROJECT_STORE = 'state'

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

/**
 * Wipes the persisted project (IndexedDB autosave) and reloads, so a test
 * always starts from a truly empty canvas instead of inheriting a drawing the
 * app auto-saved during an earlier test run. Clears the record inside the
 * store rather than deleting the database, which the running app can block.
 */
export async function clearPersistedProject(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(
    async ([databaseName, storeName]) => {
      const request = indexedDB.open(databaseName)
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      try {
        // A freshly-created database may not have the store yet (the app
        // creates it on its first save); nothing to clear in that case.
        if (!Array.from(database.objectStoreNames).includes(storeName)) {
          return
        }
        const transaction = database.transaction(storeName, 'readwrite')
        const store = transaction.objectStore(storeName)
        store.clear()
        await new Promise<void>((resolve, reject) => {
          transaction.oncomplete = () => resolve()
          transaction.onerror = () => reject(transaction.error)
        })
      } finally {
        database.close()
      }
    },
    [PROJECT_DATABASE, PROJECT_STORE] as [string, string],
  )
  await page.reload()
}

/**
 * Polls the evaluated footer text until it contains the given snippet. The
 * footer is an aria-live status region; locator text assertions on it can read
 * a stale screen-reader representation, so we assert on the live DOM text.
 */
export async function expectFooterText(
  page: Page,
  snippet: string,
  timeout = 15_000,
): Promise<void> {
  await expect
    .poll(
      () =>
        page
          .evaluate(() => document.querySelector('footer')?.textContent ?? '')
          .then((text) => text.includes(snippet)),
      { timeout },
    )
    .toBe(true)
}

/** Asserts the operation-count label in the footer. */
export async function expectOperationCount(page: Page, count: number): Promise<void> {
  const label = `${count} operation${count === 1 ? '' : 's'}`
  await expectFooterText(page, label)
}
