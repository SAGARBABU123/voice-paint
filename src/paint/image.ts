import { fitContain } from './geometry'
import { createId } from './id'
import type { ImageOperation } from './types'

/** Reads a user-selected file into a data URL so it can be drawn and persisted. */
export function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Could not read the file.'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file.'))
    reader.readAsDataURL(file)
  })
}

/** Builds an image operation that is scaled to fit (centred) inside the document. */
export function createImageOperation(
  dataUrl: string,
  sourceWidth: number,
  sourceHeight: number,
  documentWidth: number,
  documentHeight: number,
): ImageOperation {
  const rect = fitContain(sourceWidth, sourceHeight, documentWidth, documentHeight)
  return {
    id: createId(),
    kind: 'image',
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    dataUrl,
  }
}
