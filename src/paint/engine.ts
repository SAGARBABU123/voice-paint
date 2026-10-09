import {
  BACKGROUND_COLOR,
  DEFAULT_BRUSH_SIZE,
  DEFAULT_COLOR,
  DEFAULT_FONT_SIZE,
  DOCUMENT_HEIGHT,
  DOCUMENT_WIDTH,
  MAX_BRUSH_SIZE,
  MAX_FONT_SIZE,
  MIN_BRUSH_SIZE,
  MIN_FONT_SIZE,
} from './constants'
import { exportCanvasAsPng } from './export'
import { createFillOperation } from './fill'
import { clamp, clampRectToBounds, type Rect } from './geometry'
import { History } from './history'
import { createTextOperation } from './text'
import { createSelectionMask, createSelectionMove } from './selection'
import {
  normalizeQuarterTurns,
  rotateOperations,
  rotatedSize,
  scaleOperations,
  translateOperations,
} from './transforms'
import { isPaintTool, type PaintOperation, type PaintTool, type Point } from './types'

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/

/** A full, immutable document revision: dimensions plus the operations on it. */
export type DocumentState = {
  width: number
  height: number
  operations: PaintOperation[]
}

export type PaintSnapshot = {
  activeTool: PaintTool
  color: string
  brushSize: number
  fontSize: number
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
  fontSize?: number
  background?: string
}

function positiveInt(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.max(1, Math.round(value))
}

/**
 * Owns the supported document state and the history of document revisions. It
 * is framework free and has no knowledge of React. Every mutation (drawing or
 * a transform) pushes a new revision, so undo/redo is uniform.
 */
export class PaintEngine {
  readonly background: string

  private initial: DocumentState
  private activeTool: PaintTool = 'pencil'
  private color: string
  private brushSize: number
  private fontSize: number
  private readonly history = new History<DocumentState>()
  private readonly listeners = new Set<() => void>()
  private canvas: HTMLCanvasElement | null = null
  private revision = 0
  private snapshot: PaintSnapshot

  constructor(options: PaintEngineOptions = {}) {
    this.background = options.background ?? BACKGROUND_COLOR
    this.initial = {
      width: positiveInt(options.width ?? DOCUMENT_WIDTH, DOCUMENT_WIDTH),
      height: positiveInt(options.height ?? DOCUMENT_HEIGHT, DOCUMENT_HEIGHT),
      operations: [],
    }
    this.color = normalizeColor(options.color) ?? DEFAULT_COLOR
    this.brushSize = clampBrushSize(options.brushSize ?? DEFAULT_BRUSH_SIZE)
    this.fontSize = clampFontSize(options.fontSize ?? DEFAULT_FONT_SIZE)
    this.snapshot = this.buildSnapshot()
  }

  get width(): number {
    return this.current.width
  }

  get height(): number {
    return this.current.height
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): PaintSnapshot => this.snapshot

  getOperations(): readonly PaintOperation[] {
    return this.current.operations
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

  setFontSize(size: number): void {
    const next = clampFontSize(size)
    if (next === this.fontSize) return
    this.fontSize = next
    this.emit()
  }

  /** Places text at a document point, using the active colour and font size. */
  addText(text: string, point: Point): boolean {
    const trimmed = text.trim()
    if (!trimmed) return false
    this.commit(
      createTextOperation({
        text: trimmed,
        x: point.x,
        y: point.y,
        color: this.color,
        fontSize: this.fontSize,
      }),
    )
    return true
  }

  /** Flood-fills from a document point, baked into one undoable image operation. */
  fillAt(point: Point): boolean {
    const current = this.current
    const operation = createFillOperation(
      current.operations,
      current.width,
      current.height,
      point,
      this.color,
    )
    if (!operation) return false
    this.commit(operation)
    return true
  }

  /** Cuts a rectangular region to the background, undoably. */
  deleteSelection(rect: Rect): boolean {
    const current = this.current
    const mask = createSelectionMask(current.width, current.height, this.background, rect)
    if (!mask) return false
    this.pushDocument({
      width: current.width,
      height: current.height,
      operations: [...current.operations, mask],
    })
    return true
  }

  /** Moves a rectangular region by a delta as a single undoable step. */
  moveSelection(rect: Rect, dx: number, dy: number): boolean {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return false
    const offsetX = Math.round(dx)
    const offsetY = Math.round(dy)
    if (offsetX === 0 && offsetY === 0) return false

    const current = this.current
    const move = createSelectionMove(
      current.operations,
      current.width,
      current.height,
      this.background,
      rect,
      offsetX,
      offsetY,
    )
    if (!move) return false
    this.pushDocument({
      width: current.width,
      height: current.height,
      operations: [...current.operations, move.mask, move.patch],
    })
    return true
  }

  commit(operation: PaintOperation): void {
    const current = this.current
    this.pushDocument({
      width: current.width,
      height: current.height,
      operations: [...current.operations, operation],
    })
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
    const current = this.current
    if (current.operations.length === 0) return
    this.pushDocument({ width: current.width, height: current.height, operations: [] })
  }

  /** Replaces the document and resets history, e.g. when restoring a project. */
  loadDocument(width: number, height: number, operations: readonly PaintOperation[]): void {
    this.initial = {
      width: positiveInt(width, DOCUMENT_WIDTH),
      height: positiveInt(height, DOCUMENT_HEIGHT),
      operations: [...operations],
    }
    this.history.clear()
    this.emit()
  }

  /** Rotates the document clockwise by whole quarter-turns. */
  rotateDocument(quarterTurns: number): void {
    const turns = normalizeQuarterTurns(quarterTurns)
    if (turns === 0) return

    const current = this.current
    const size = rotatedSize(current.width, current.height, turns)
    this.pushDocument({
      width: size.width,
      height: size.height,
      operations: rotateOperations(current.operations, turns, current.width, current.height),
    })
  }

  /** Resizes the document, scaling the content to the new dimensions. */
  resizeDocument(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height)) return

    const current = this.current
    const nextWidth = positiveInt(width, current.width)
    const nextHeight = positiveInt(height, current.height)
    if (nextWidth === current.width && nextHeight === current.height) return

    const scaleX = nextWidth / current.width
    const scaleY = nextHeight / current.height
    this.pushDocument({
      width: nextWidth,
      height: nextHeight,
      operations: scaleOperations(current.operations, scaleX, scaleY),
    })
  }

  /** Crops to a rectangle, clamped to the document bounds. */
  cropDocument(rect: Rect): void {
    const current = this.current
    const bounded = clampRectToBounds(rect, current.width, current.height)
    if (bounded.width < 1 || bounded.height < 1) return

    this.pushDocument({
      width: Math.max(1, Math.round(bounded.width)),
      height: Math.max(1, Math.round(bounded.height)),
      operations: translateOperations(current.operations, -bounded.x, -bounded.y),
    })
  }

  async exportPng(filename = 'voice-over-paint.png'): Promise<void> {
    if (!this.canvas) throw new Error('Canvas is not attached yet.')
    await exportCanvasAsPng(this.canvas, filename)
  }

  private get current(): DocumentState {
    return this.history.last ?? this.initial
  }

  private pushDocument(next: DocumentState): void {
    this.history.push(next)
    this.emit()
  }

  private emit(): void {
    this.revision += 1
    this.snapshot = this.buildSnapshot()
    for (const listener of this.listeners) listener()
  }

  private buildSnapshot(): PaintSnapshot {
    const current = this.current
    return {
      activeTool: this.activeTool,
      color: this.color,
      brushSize: this.brushSize,
      fontSize: this.fontSize,
      canUndo: this.history.canUndo,
      canRedo: this.history.canRedo,
      operationCount: current.operations.length,
      revision: this.revision,
      documentWidth: current.width,
      documentHeight: current.height,
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

function clampFontSize(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_FONT_SIZE
  return clamp(Math.round(value), MIN_FONT_SIZE, MAX_FONT_SIZE)
}
