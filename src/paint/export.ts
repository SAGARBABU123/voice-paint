export type ExportFormat = 'png' | 'jpeg'

const FORMAT_MIME: Record<ExportFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
}

const FORMAT_EXTENSION: Record<ExportFormat, string> = {
  png: 'png',
  jpeg: 'jpg',
}

function canvasToBlob(canvas: HTMLCanvasElement, format: ExportFormat): Promise<Blob> {
  const mime = FORMAT_MIME[format]
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob !== 'function') {
      reject(new Error('Canvas export is not supported in this environment.'))
      return
    }
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error(`Failed to encode the canvas as ${format.toUpperCase()}.`))
    }, mime)
  })
}

/** Keep the PNG export path available for tests and callers.
 *  JPEG/WebP-quality callers should use `exportCanvasAsImage` instead. */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return canvasToBlob(canvas, 'png')
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function exportCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename = 'voice-over-paint.png',
): Promise<void> {
  const blob = await canvasToBlob(canvas, 'png')
  downloadBlob(blob, filename)
}

/** Export as PNG or JPEG with the matching file extension. */
export async function exportCanvasAsImage(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  filename = `voice-over-paint.${FORMAT_EXTENSION[format]}`,
): Promise<void> {
  const blob = await canvasToBlob(canvas, format)
  downloadBlob(blob, filename)
}
