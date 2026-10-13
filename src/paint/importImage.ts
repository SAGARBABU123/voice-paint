import type { PaintEngine } from './engine'
import { createImageOperation, readFileAsDataUrl } from './image'
import { loadImage } from './imageCache'

const ACCEPTED_MIME = new Set(['image/png', 'image/jpeg'])

/**
 * Opens a PNG/JPEG file, decodes it and commits it to the document centred on
 * the page. Shared by the toolbar's Open button and canvas drag-and-drop so
 * both paths behave identically. Returns false when the file cannot be read.
 */
export async function importImageFile(engine: PaintEngine, file: File): Promise<boolean> {
  if (!ACCEPTED_MIME.has(file.type)) return false
  try {
    const dataUrl = await readFileAsDataUrl(file)
    const image = await loadImage(dataUrl)
    const operation = createImageOperation(
      dataUrl,
      image.naturalWidth || image.width,
      image.naturalHeight || image.height,
      engine.width,
      engine.height,
    )
    engine.commit(operation)
    return true
  } catch {
    return false
  }
}
