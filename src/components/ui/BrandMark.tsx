import { useId } from 'react'
import { cn } from './cn'

type BrandMarkProps = {
  size?: number
  className?: string
}

/**
 * App brand mark: an artist palette drawn in its own colours on a transparent
 * background — no tile or shape. Gradient body with a glossy top-light,
 * white-rimmed paint dots and a thumb-hole, so it reads on any theme and
 * matches the transparent favicon.
 */
export function BrandMark({ size = 40, className }: BrandMarkProps = {}) {
  const bodyId = useId()
  const sheenId = useId()
  const holeMaskId = useId()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id={bodyId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#1c5fde" />
          <stop offset="0.5" stopColor="#2184c8" />
          <stop offset="1" stopColor="#16918f" />
        </linearGradient>
        <radialGradient id={sheenId} cx="0.35" cy="0.28" r="0.78">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <mask id={holeMaskId}>
          <rect width="24" height="24" fill="#fff" />
          <circle cx="17.3" cy="15.2" r="2" fill="#000" />
        </mask>
      </defs>

      {/* Palette body: gradient + glossy top-light, with the thumb-hole */}
      <g mask={`url(#${holeMaskId})`}>
        <circle cx="12" cy="11.6" r="7.4" fill={`url(#${bodyId})`} />
        <circle cx="12" cy="11.6" r="7.4" fill={`url(#${sheenId})`} />
      </g>
      {/* Rim for definition on light/white backgrounds */}
      <circle cx="12" cy="11.6" r="7.35" stroke="rgba(13,38,74,0.16)" strokeWidth="0.7" />
      {/* Thumb-hole */}
      <circle cx="17.3" cy="15.2" r="2" fill="#ffffff" />
      <circle
        cx="17.3"
        cy="15.2"
        r="2.6"
        stroke="rgba(15,47,94,0.14)"
        strokeWidth="0.6"
        fill="none"
      />
      {/* Paint dots, white-rimmed for pop */}
      <circle cx="8.4" cy="9.2" r="1.3" fill="#ffd166" stroke="#fff" strokeWidth="0.55" />
      <circle
        cx="13.4"
        cy="7.3"
        r="1.3"
        fill="#ffffff"
        stroke="rgba(13,38,74,0.12)"
        strokeWidth="0.5"
      />
      <circle cx="18" cy="11.8" r="1.3" fill="#c08dff" stroke="#fff" strokeWidth="0.55" />
      <circle cx="10.2" cy="16.6" r="1.3" fill="#ff8fb0" stroke="#fff" strokeWidth="0.55" />
    </svg>
  )
}
