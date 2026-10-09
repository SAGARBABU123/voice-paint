const cache = new Map<string, HTMLImageElement>()
const inFlight = new Map<string, Promise<HTMLImageElement>>()

/** Returns an already-decoded image, or null if it has not been loaded yet. */
export function getCachedImage(dataUrl: string): HTMLImageElement | null {
  return cache.get(dataUrl) ?? null
}

/** Decodes a data URL into an HTMLImageElement, deduplicating concurrent loads. */
export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  const cached = cache.get(dataUrl)
  if (cached) return Promise.resolve(cached)

  const pending = inFlight.get(dataUrl)
  if (pending) return pending

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      cache.set(dataUrl, image)
      inFlight.delete(dataUrl)
      resolve(image)
    }
    image.onerror = () => {
      inFlight.delete(dataUrl)
      reject(new Error('Could not decode the image.'))
    }
    image.src = dataUrl
  })

  inFlight.set(dataUrl, promise)
  return promise
}

/** Loads every URL, ignoring individual failures so one bad image can't block a repaint. */
export async function preloadImages(dataUrls: readonly string[]): Promise<void> {
  await Promise.all(
    dataUrls.map((dataUrl) =>
      loadImage(dataUrl).then(
        () => undefined,
        () => undefined,
      ),
    ),
  )
}

/** Test helper: drops all cached images. */
export function clearImageCache(): void {
  cache.clear()
  inFlight.clear()
}
