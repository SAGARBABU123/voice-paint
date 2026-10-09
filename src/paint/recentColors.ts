export const MAX_RECENT_COLORS = 8
export const RECENT_COLORS_STORAGE_KEY = 'vop.recentColors'

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

/** True for the 3- or 6-digit hex colours the engine accepts. */
export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value.trim())
}

function normalize(color: string): string {
  return color.trim().toLowerCase()
}

/**
 * Returns a new list with `color` first, de-duplicated and capped. Invalid
 * colours are ignored so untrusted input can never enter the list.
 */
export function addRecentColor(
  list: readonly string[],
  color: string,
  max = MAX_RECENT_COLORS,
): string[] {
  if (!isHexColor(color)) return [...list]
  const normalized = normalize(color)
  const rest = list.map(normalize).filter((entry) => entry !== normalized)
  return [normalized, ...rest].slice(0, max)
}

/** Parses untrusted stored data into a clean, de-duplicated, capped list. */
export function parseRecentColors(value: unknown, max = MAX_RECENT_COLORS): string[] {
  if (!Array.isArray(value)) return []
  const result: string[] = []
  for (const entry of value) {
    if (!isHexColor(entry)) continue
    const normalized = normalize(entry)
    if (result.includes(normalized)) continue
    result.push(normalized)
    if (result.length >= max) break
  }
  return result
}
