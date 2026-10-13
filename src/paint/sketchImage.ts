import { createId } from './id'
import { loadImage } from './imageCache'
import { loadOpenCv } from './opencv'
import { renderRoughLines } from './roughSketch'
import {
  contourLength,
  filterContours,
  hashSeed,
  limitContours,
  resampleContour,
  sortStrokesLikeHand,
  strokeWidthFor,
  type SketchContour,
  type SketchOptions,
} from './sketch'
import type { Point, StrokeOperation, StrokeStyle } from './types'

export type SketchImageOptions = SketchOptions & {
  /** Stroke colour. Defaults to a near-black graphite. */
  color?: string
  /** Stroke width base in px. Default 2 (at the downscaled resolution). */
  size?: number
  /** Pen style applied to every sketch stroke. Default 'solid'. */
  style?: StrokeStyle
  /** Longest side of the traced raster (auto-downscales big photos). */
  maxDimension?: number
}

export type SketchImageResult = {
  strokes: StrokeOperation[]
  lineCount: number
  /** Raster dimensions the strokes were traced from (for centring/preview). */
  width: number
  height: number
}

function toStroke(
  points: readonly Point[],
  color: string,
  size: number,
  style: StrokeStyle,
): StrokeOperation {
  return {
    id: createId(),
    kind: 'stroke',
    tool: 'pencil',
    color,
    size,
    style,
    points: points.map((point) => ({ x: point.x, y: point.y })),
  }
}

/** Reads a CV_32SC2 contour Mat (N×1, packed [x,y] pairs) into Points. */
function matToPoints(mat: { rows: number; data32S: Int32Array }): Point[] {
  const data = mat.data32S
  const points: Point[] = []
  for (let i = 0; i < mat.rows; i += 1) {
    points.push({ x: data[i * 2], y: data[i * 2 + 1] })
  }
  return points
}

/**
 * Turns an image file into hand-drawn pencil strokes using the two proper
 * libraries — OpenCV.js for detection and tracing, rough.js for the
 * hand-drawn rendering:
 *
 *   1. decode → downscale → rasterise on a white sheet
 *   2. OpenCV: grayscale → Gaussian blur → Canny (proper edge detector)
 *   3. OpenCV: findContours + approxPolyDP (proper contour tracing/smoothing)
 *   4. rough.js linearPath — authentic hand-drawn wobble (fixed seeds)
 *   5. real, editable StrokeOperations, ordered like writing
 *
 * The OpenCV WASM engine (~14 MB, browser-cached) is lazy-loaded on first
 * call. The pure geometry glue in sketch.ts / roughSketch.ts is unit-tested
 * without the engine; this file needs a real canvas.
 */
export async function sketchImage(
  dataUrl: string,
  options: SketchImageOptions = {},
): Promise<SketchImageResult> {
  const image = await loadImage(dataUrl)
  const maxDimension = options.maxDimension ?? 1200
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height),
  )
  const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale))
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is not available in this browser.')

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  const cv = await loadOpenCv()
  const src = cv.imread(canvas)
  try {
    const gray = new cv.Mat()
    const blurred = new cv.Mat()
    const edges = new cv.Mat()
    const contours = new cv.MatVector()
    const hierarchy = new cv.Mat()
    try {
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
      cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0)

      // Map the user-facing "threshold" (0..1, lower = more edges) onto
      // Canny's hysteresis pair. High stays in a sane band for photos.
      const threshold = options.threshold ?? 0.28
      const high = Math.max(35, Math.min(240, Math.round(255 * (0.18 + 0.82 * threshold))))
      const low = Math.max(15, Math.round(high * 0.4))
      cv.Canny(blurred, edges, low, high)

      cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

      const epsilon = options.epsilon ?? 0.75
      const raw: SketchContour[] = []
      for (let i = 0; i < contours.size(); i += 1) {
        const contour = contours.get(i)
        const approx = new cv.Mat()
        cv.approxPolyDP(contour, approx, epsilon, false)
        const points = matToPoints(approx)
        const rect = cv.boundingRect(contour)
        raw.push({
          points,
          box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          area: Math.abs(cv.contourArea(contour)),
          length: contourLength(points),
        })
        approx.delete()
        contour.delete()
      }
      const candidates = limitContours(filterContours(raw, options), options.maxStrokes ?? 500)

      const color = options.color ?? '#23222b'
      const style = options.style ?? 'solid'
      const baseSize = options.size ?? 2
      const maxPointsPerLine = options.maxPointsPerLine ?? 80
      const roughness = options.roughness ?? 0.7
      const baseSeed = options.seed ?? hashSeed(`${dataUrl}|${color}|${baseSize}`)
      const lengths = candidates.map((contour) => contour.length)

      const made: StrokeOperation[] = []
      for (let i = 0; i < candidates.length; i += 1) {
        const contour = candidates[i]
        const sampled = resampleContour(contour.points, maxPointsPerLine)
        const [drawn] = renderRoughLines([sampled], {
          roughness,
          seed: baseSeed,
          strokeWidth: Math.max(1, Math.min(4, Math.round(baseSize / 2))),
          maxPointsPerLine,
        })
        const size = strokeWidthFor(contour.length, lengths, baseSize)
        made.push(toStroke(drawn, color, size, style))
      }

      // Write like a hand: top-to-bottom, then left-to-right.
      const strokes = sortStrokesLikeHand(made)
      return {
        strokes,
        lineCount: strokes.length,
        width,
        height,
      }
    } finally {
      contours.delete()
      hierarchy.delete()
      edges.delete()
      blurred.delete()
      gray.delete()
    }
  } finally {
    src.delete()
  }
}
