import { useCallback, useState } from 'react'
import { clampZoom, fitZoom, MAX_ZOOM, MIN_ZOOM, ZOOM_FACTOR } from '../paint/viewport'

export type UseViewportOptions = {
  documentWidth: number
  documentHeight: number
}

export type Viewport = {
  zoom: number
  canZoomIn: boolean
  canZoomOut: boolean
  setZoom: (value: number) => void
  zoomIn: () => void
  zoomOut: () => void
  actualSize: () => void
  fit: (containerWidth: number, containerHeight: number) => void
}

/** View-only zoom state. It never touches the document or its history. */
export function useViewport({ documentWidth, documentHeight }: UseViewportOptions): Viewport {
  const [zoom, setZoomState] = useState(1)

  const setZoom = useCallback((value: number) => setZoomState(clampZoom(value)), [])
  const zoomIn = useCallback(() => setZoomState((current) => clampZoom(current * ZOOM_FACTOR)), [])
  const zoomOut = useCallback(() => setZoomState((current) => clampZoom(current / ZOOM_FACTOR)), [])
  const actualSize = useCallback(() => setZoomState(1), [])
  const fit = useCallback(
    (containerWidth: number, containerHeight: number) => {
      setZoomState(fitZoom(containerWidth, containerHeight, documentWidth, documentHeight))
    },
    [documentWidth, documentHeight],
  )

  return {
    zoom,
    canZoomIn: zoom < MAX_ZOOM - 1e-6,
    canZoomOut: zoom > MIN_ZOOM + 1e-6,
    setZoom,
    zoomIn,
    zoomOut,
    actualSize,
    fit,
  }
}
