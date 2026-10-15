import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'brush'
  | 'pencil'
  | 'eraser'
  | 'line'
  | 'rectangle'
  | 'ellipse'
  | 'text'
  | 'fill'
  | 'select'
  | 'undo'
  | 'redo'
  | 'curve'
  | 'rounded-rectangle'
  | 'polygon'
  | 'triangle'
  | 'right-triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'arrow-up'
  | 'arrow-right'
  | 'arrow-down'
  | 'arrow-left'
  | 'star-4'
  | 'star-5'
  | 'star-6'
  | 'chat'
  | 'callout-round'
  | 'callout-cloud'
  | 'heart'
  | 'lightning'
  | 'rotate-left'
  | 'rotate-right'
  | 'crop'
  | 'resize'
  | 'image'
  | 'download'
  | 'trash'
  | 'zoom-in'
  | 'zoom-out'
  | 'mic'
  | 'mic-off'
  | 'stop'
  | 'help'
  | 'close'
  | 'check'
  | 'info'
  | 'alert'
  | 'panel'
  | 'eyedropper'

const PATHS: Record<IconName, ReactNode> = {
  brush: (
    <>
      <path d="m14.5 6.5 3 3L7 20l-4 1 1-4Z" />
      <path d="m15 5 4 4" />
      <path d="m13 3 1 1" />
    </>
  ),
  pencil: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  eraser: (
    <>
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </>
  ),
  line: <path d="M5 19 19 5" />,
  rectangle: <rect x="3.5" y="3.5" width="17" height="17" rx="2" />,
  ellipse: <circle cx="12" cy="12" r="8.5" />,
  text: (
    <>
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
    </>
  ),
  fill: (
    <>
      <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
      <path d="m5 2 5 5" />
      <path d="M2 13h15" />
      <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" />
    </>
  ),
  select: <rect x="3.5" y="3.5" width="17" height="17" rx="2" strokeDasharray="4 3" />,
  undo: (
    <>
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </>
  ),
  redo: (
    <>
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </>
  ),
  curve: <path d="M3 17c6-2 9-11 18-9" />,
  'rounded-rectangle': <rect x="3" y="5" width="18" height="14" rx="3" />,
  polygon: <path d="M14.5 3.5 20 8l-1.5 8.5H8L5 11Z" />,
  triangle: <path d="M12 4 21 20H3Z" />,
  'right-triangle': <path d="M5 19 19 19 5 5Z" />,
  diamond: <path d="m12 3 9 9-9 9-9-9Z" />,
  pentagon: <path d="m12 3 9.5 6.9-3.6 11H6.1L2.5 9.9Z" />,
  hexagon: <path d="m12 3 9 5v8l-9 5-9-5V8Z" />,
  'arrow-up': <path d="M12 19V5m0 0-5 5m5-5 5 5" />,
  'arrow-right': <path d="M5 12h14m0 0-5-5m5 5-5 5" />,
  'arrow-down': <path d="M12 5v14m0 0 5-5m-5 5-5-5" />,
  'arrow-left': <path d="M19 12H5m0 0 5-5m-5 5 5 5" />,
  'star-4': <path d="m12 3 2.9 6.1L21 12l-6.1 2.9L12 21l-2.9-6.1L3 12l6.1-2.9Z" />,
  'star-5': <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.9Z" />,
  'star-6': (
    <path d="m12 3 1.9 5 5.3-2.4-2.4 5.3 5 .9-5 1 2.4 5.2-5.3-2.5L12 21l-1.9-5.5-5.3 2.5 2.4-5.2-5-1 5-.9-2.4-5.3 5.3 2.4Z" />
  ),
  chat: <path d="M20 5H4v11h7l4 4v-4h5Z" />,
  'callout-round': (
    <>
      <ellipse cx="12" cy="10.5" rx="9" ry="6.5" />
      <path d="M9 14.5 7 20l4.5-3.2" />
    </>
  ),
  'callout-cloud': (
    <>
      <path d="M8 18a4 4 0 1 1 .6-7.9A4.5 4.5 0 0 1 17.5 9a3.5 3.5 0 0 1-.5 7H8Z" />
      <path d="m9 15.5 6.5 3.5-1.5-3.5" />
    </>
  ),
  heart: (
    <path d="M12 20s-7-4.5-7-10c0-2.8 2.2-4.5 4-4.5 1.5 0 2.6.9 3 2 .4-1.1 1.5-2 3-2 1.8 0 4 1.7 4 4.5 0 5.5-7 10-7 10Z" />
  ),
  lightning: <path d="m13 3-7 10h5l-1 8 7-10h-5Z" />,
  'rotate-left': (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  'rotate-right': (
    <>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </>
  ),
  crop: (
    <>
      <path d="M6 2v14a2 2 0 0 0 2 2h14" />
      <path d="M18 22V8a2 2 0 0 0-2-2H2" />
    </>
  ),
  resize: (
    <>
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
  'zoom-in': (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </>
  ),
  'zoom-out': (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M8 11h6" />
    </>
  ),
  mic: (
    <>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v3" />
    </>
  ),
  'mic-off': (
    <>
      <path d="M9 9v4a3 3 0 0 0 5.12 2.12" />
      <path d="M15 9.34V5a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2" />
      <path d="M19 10v2a7 7 0 0 1-.11 1.23" />
      <path d="M12 19v3" />
      <path d="m2 2 20 20" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  help: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </>
  ),
  close: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </>
  ),
  alert: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  panel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
  eyedropper: (
    <>
      <path d="m2 22 1-1h3l9-9" />
      <path d="M3 21v-3l9-9" />
      <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.9.9a1.5 1.5 0 0 1 0 2.1l-1.6 1.6a1.5 1.5 0 0 1-2.1 0L9.6 8.9a1.5 1.5 0 0 1 0-2.1l1.6-1.6a1.5 1.5 0 0 1 2.1 0Z" />
    </>
  ),
}

export type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName
  /** Pixel size for both dimensions. */
  size?: number
}

/** Inline stroke icons (1.8px, currentColor) — consistent with the Vault kit. */
export function Icon({ name, size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {PATHS[name]}
    </svg>
  )
}
