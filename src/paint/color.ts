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
