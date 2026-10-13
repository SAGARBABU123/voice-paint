export type Rgba = { r: number; g: number; b: number; a: number }

/** Parses a 3- or 6-digit hex colour into RGBA (opaque). Falls back to black. */
export function hexToRgba(hex: string): Rgba {
  const normalized = hex.trim().replace('#', '')
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((character) => character + character)
          .join('')
      : normalized

  if (full.length !== 6) return { r: 0, g: 0, b: 0, a: 255 }

  const value = Number.parseInt(full, 16)
  if (!Number.isFinite(value)) return { r: 0, g: 0, b: 0, a: 255 }

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
    a: 255,
  }
}

const clampByte = (value: number): number => Math.max(0, Math.min(255, Math.round(value)))

/**
 * Mixes a hex colour toward a target by `amount` (0..1) — e.g. toward white
 * for a fainter pencil, toward black for a bolder one. Returns #rrggbb.
 */
export function shiftToward(hex: string, targetHex: string, amount: number): string {
  const source = hexToRgba(hex)
  const target = hexToRgba(targetHex)
  const t = Math.max(0, Math.min(1, amount))
  const r = clampByte(source.r + (target.r - source.r) * t)
  const g = clampByte(source.g + (target.g - source.g) * t)
  const b = clampByte(source.b + (target.b - source.b) * t)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
