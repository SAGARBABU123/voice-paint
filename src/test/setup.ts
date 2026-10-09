import '@testing-library/jest-dom/vitest'

// jsdom does not implement the Canvas 2D API. Components are written to
// tolerate a null context, so return null here instead of emitting noisy
// "HTMLCanvasElement.prototype.getContext is not implemented" errors.
HTMLCanvasElement.prototype.getContext = (() =>
  null) as typeof HTMLCanvasElement.prototype.getContext
