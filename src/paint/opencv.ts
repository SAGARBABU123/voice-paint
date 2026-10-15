import type { CV } from '@techstark/opencv-js'
// Load the engine as a plain asset script rather than a module import. The
// package is a UMD bundle whose CommonJS entry exports the ready-Promise as the
// default export; bundlers wrap that in a CJS interop namespace, which then
// throws "Promise.prototype.then called on incompatible receiver" in the
// production build. In a browser the UMD instead assigns `window.cv`, so we
// load it via a script tag and await that (real, unwrapped) Promise.
import opencvScriptUrl from '@techstark/opencv-js/dist/opencv.js?url'

let engine: Promise<CV> | null = null

/** True once the WASM engine has started loading (used for first-use UX hints). */
export function isCvReady(): boolean {
  return engine !== null
}

function globalCv(): unknown {
  return (window as unknown as { cv?: unknown }).cv
}

/**
 * Lazy singleton for the OpenCV.js WASM engine (@techstark/opencv-js v5).
 *
 * The bundle embeds the ~14 MB WASM as base64, so loading it needs only the one
 * asset request (no separate .wasm fetch, no CORS concerns on static hosts).
 * The asset is requested on first use only.
 */
export function loadOpenCv(): Promise<CV> {
  engine ??= new Promise<CV>((resolve, reject) => {
    const alreadyLoaded = globalCv()
    if (alreadyLoaded !== undefined) {
      // The UMD exposes a ready-Promise; resolve through it.
      Promise.resolve(alreadyLoaded as CV).then(resolve, reject)
      return
    }

    const script = document.createElement('script')
    script.src = opencvScriptUrl
    script.async = true
    script.onload = () => {
      const loaded = globalCv()
      if (loaded === undefined) {
        reject(new Error('The OpenCV engine did not initialise.'))
        return
      }
      Promise.resolve(loaded as CV).then(resolve, reject)
    }
    script.onerror = () => reject(new Error('Could not load the OpenCV engine.'))
    document.head.appendChild(script)
  })
  return engine
}
