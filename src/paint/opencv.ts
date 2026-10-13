import type { CV } from '@techstark/opencv-js'

let engine: Promise<CV> | null = null

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  )
}

/** True once the WASM engine has started loading (used for first-use UX hints). */
export function isCvReady(): boolean {
  return engine !== null
}

/**
 * Lazy singleton for the OpenCV.js WASM engine (@techstark/opencv-js v5).
 *
 * The package's UMD build embeds the ~14 MB WASM as base64 inside its own
 * chunk, so the browser only fetches one chunk on first use — no separate
 * .wasm request, and no CORS issues on static hosts like Cloudflare Pages.
 * The chunk is dynamically imported so it never blocks the initial paint.
 *
 * IMPORTANT: the package's default export is a Promise that resolves to the
 * cv namespace. We await it once here; every caller shares the result.
 */
export function loadOpenCv(): Promise<CV> {
  engine ??= import('@techstark/opencv-js').then(async (mod) => {
    const candidate = (mod as { default?: unknown }).default
    if (candidate === undefined) return mod as unknown as CV
    if (isPromiseLike(candidate)) return (await candidate) as CV
    return candidate as CV
  })
  return engine
}
