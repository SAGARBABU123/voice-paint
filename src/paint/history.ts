/**
 * Undo/redo over a linear list of entries using a cursor.
 *
 * Pushing after an undo discards the redo branch. Only the entries up to the
 * cursor are "applied" and therefore rendered.
 */
export class History<T> {
  private entries: T[] = []
  private index = 0

  get length(): number {
    return this.entries.length
  }

  get canUndo(): boolean {
    return this.index > 0
  }

  get canRedo(): boolean {
    return this.index < this.entries.length
  }

  get applied(): readonly T[] {
    return this.entries.slice(0, this.index)
  }

  get appliedCount(): number {
    return this.index
  }

  push(entry: T): void {
    this.entries = this.entries.slice(0, this.index)
    this.entries.push(entry)
    this.index = this.entries.length
  }

  undo(): boolean {
    if (!this.canUndo) return false
    this.index -= 1
    return true
  }

  redo(): boolean {
    if (!this.canRedo) return false
    this.index += 1
    return true
  }

  clear(): void {
    this.entries = []
    this.index = 0
  }
}
