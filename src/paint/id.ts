let counter = 0

/** Stable-ish unique id for operations. Falls back when `crypto.randomUUID` is absent. */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  counter += 1
  return `op-${Date.now().toString(36)}-${counter}`
}
