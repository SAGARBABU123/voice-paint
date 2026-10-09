import {
  BACKGROUND_COLOR,
  DEFAULT_BRUSH_SIZE,
  DEFAULT_COLOR,
  DOCUMENT_HEIGHT,
  DOCUMENT_WIDTH,
  MAX_BRUSH_SIZE,
  MIN_BRUSH_SIZE,
} from './constants'
import { exportCanvasAsPng } from './export'
import { clamp } from './geometry'
import { History } from './history'
import { isPaintTool, type PaintOperation, type PaintTool } from './types'

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/

export type PaintSnapshot = {
  activeTool: PaintTool
  color: string
  brushSize: number
  canUndo: boolean
  canRedo: boolean
  operationCount: number
  revision: number
  documentWidth: number
  documentHeight: number
  background: string
}

export type PaintEngineOptions = {
  width?: number
  height?: number
  color?: string
  brushSize?: number
  background?: string
}

/**
 * Owns the supported drawing state and the operation history. It is framework
 * free and has no knowledge of React. UI components read it through
 * `getSnapshot()` and mutate it through the typed methods below.
 */
export class PaintEngine {
  readonly width: number
  readonly height: number
  readonly background: string

  private activeTool: PaintTool = 'pencil'
  private color: string
  private brushSize: number
  private readonly history = new History<PaintOperation>()
  private readonly listeners = new Set<() => void>()
  private canvas: HTMLCanvasElement | null = null
  private revision = 0
  private snapshot: PaintSnapshot

  constructor(options: PaintEngineOptions = {}) {
    this.width = options.width ?? DOCUMENT_WIDTH
    this.height = options.height ?? DOCUMENT_HEIGHT
    this.background = options.background ?? BACKGROUND_COLOR
    this.color = normalizeColor(options.color) ?? DEFAULT_COLOR
    this.brushSize = clampBrushSize(options.brushSize ?? DEFAULT_BRUSH_SIZE)
    this.snapshot = this.buildSnapshot()
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): PaintSnapshot => this.snapshot

  getOperations(): readonly PaintOperation[] {
    return this.history.applied
  }

  attachCanvas(canvas: HTMLCanvasElement | null): void {
    this.canvas = canvas
  }

  setTool(tool: PaintTool): void {
    if (!isPaintTool(tool) || tool === this.activeTool) return
    this.activeTool = tool
    this.emit()
  }

  setColor(color: string): void {
    const normalized = normalizeColor(color)
    if (!normalized || normalized === this.color) return
    this.color = normalized
    this.emit()
  }

  setBrushSize(size: number): void {
    const next = clampBrushSize(size)
    if (next === this.brushSize) return
    this.brushSize = next
    this.emit()
  }

  commit(operation: PaintOperation): void {
    this.history.push(operation)
    this.emit()
  }

  undo(): boolean {
    if (!this.history.undo()) return false
    this.emit()
    return true
  }

  redo(): boolean {
    if (!this.history.redo()) return false
    this.emit()
    return true
  }

  clear(): void {
    if (this.history.length === 0) return
    this.history.clear()
    this.emit()
  }

  /** Replaces the document with a saved set of operations. */
  loadOperations(operations: readonly PaintOperation[]): void {
    this.history.replace(operations)
    this.emit()
  }

  async exportPng(filename = 'voice-over-paint.png'): Promise<void> {
    if (!this.canvas) throw new Error('Canvas is not attached yet.')
    await exportCanvasAsPng(this.canvas, filename)
  }

  private emit(): void {
    this.revision += 1
    this.snapshot = this.buildSnapshot()
    for (const listener of this.listeners) listener()
  }

  private buildSnapshot(): PaintSnapshot {
    return {
      activeTool: this.activeTool,
      color: this.color,
      brushSize: this.brushSize,
      canUndo: this.history.canUndo,
      canRedo: this.history.canRedo,
      operationCount: this.history.appliedCount,
      revision: this.revision,
      documentWidth: this.width,
      documentHeight: this.height,
      background: this.background,
    }
  }
}

function normalizeColor(value: string | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().toLowerCase()
  return HEX_COLOR.test(trimmed) ? trimmed : null
}

function clampBrushSize(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_BRUSH_SIZE
  return clamp(Math.round(value), MIN_BRUSH_SIZE, MAX_BRUSH_SIZE)
}
