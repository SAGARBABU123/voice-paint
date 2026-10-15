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

  /** The most recently applied entry, without allocating, or undefined. */
  get last(): T | undefined {
    return this.index > 0 ? this.entries[this.index - 1] : undefined
  }

  get appliedCount(): number {
    return this.index
  }

  /** Every entry, including any redo branch beyond the cursor. */
  get all(): readonly T[] {
    return this.entries
  }

  /** The cursor position (number of applied entries). */
  get cursor(): number {
    return this.index
  }

  /** Moves the cursor without discarding the redo branch. */
  jumpTo(index: number): boolean {
    if (!Number.isInteger(index) || index < 0 || index > this.entries.length) return false
    if (index === this.index) return false
    this.index = index
    return true
  }

  /** Replaces the entire entry list, e.g. when loading a saved project. */
  replace(entries: readonly T[]): void {
    this.entries = entries.slice()
    this.index = this.entries.length
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
