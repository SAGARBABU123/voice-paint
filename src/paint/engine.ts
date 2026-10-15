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
import { exportCanvasAsImage, exportCanvasAsPng } from './export'
import { createFillOperation } from './fill'
import { clamp, clampRectToBounds, type Rect } from './geometry'
import { History } from './history'
import { createId } from './id'
import {
  activeLayer,
  clampLayerOpacity,
  createLayer,
  layerById,
  mapLayerOperations,
  totalOperations,
  withLayerOperations,
  type Layer,
} from './layers'
import { placeShapes, type ShapePlacement } from './placement'
import { isSymmetry, type Symmetry } from './symmetry'
import { DEFAULT_FONT_FAMILY, createTextOperation, isFontFamily, type FontFamily } from './text'
import { createSelectionMask, createSelectionMove } from './selection'
import {
  isSketchDetail,
  isSketchStyle,
  isSketchWeight,
  type SketchDetail,
  type SketchStyle,
  type SketchWeight,
} from './sketchStyles'
import {
  normalizeQuarterTurns,
  rotateOperations,
  rotatedSize,
  scaleOperations,
  translateOperations,
} from './transforms'
import {
  isPaintTool,
  isStrokeStyle,
  type PaintOperation,
  type PaintTool,
  type Point,
  type ShapeTool,
  type StrokeStyle,
} from './types'

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/

/** A full, immutable document revision: dimensions plus its layers. */
export type DocumentState = {
  width: number
  height: number
  layers: Layer[]
  activeLayerId: string
}

/** Lightweight layer info for the snapshot (no operation payloads). */
export type LayerSummary = {
  id: string
  name: string
  visible: boolean
  opacity: number
  operationCount: number
}

export type PaintSnapshot = {
  activeTool: PaintTool
  color: string
  brushSize: number
  fontSize: number
  fillTolerance: number
  shapeFill: boolean
  brushOpacity: number
  brushPressure: boolean
  brushSmoothing: number
  fontFamily: string
  fontBold: boolean
  fontItalic: boolean
  symmetry: Symmetry
  strokeStyle: StrokeStyle
  sketchStyle: SketchStyle
  sketchWeight: SketchWeight
  sketchDetail: SketchDetail
  canUndo: boolean
  canRedo: boolean
  operationCount: number
  layers: LayerSummary[]
  activeLayerId: string
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
  private strokeStyle: StrokeStyle = 'solid'
  private sketchStyle: SketchStyle = 'pencil'
  private sketchWeight: SketchWeight = 'normal'
  private sketchDetail: SketchDetail = 'normal'
  private fillTolerance = 0
  private shapeFill = false
  private brushOpacity = 1
  private brushPressure = true
  private brushSmoothing = 0
  private fontFamily: FontFamily = DEFAULT_FONT_FAMILY
  private fontBold = false
  private fontItalic = false
  private symmetry: Symmetry = 'off'
  private readonly history = new History<DocumentState>()
  private readonly listeners = new Set<() => void>()
  private canvas: HTMLCanvasElement | null = null
  private revision = 0
  private snapshot: PaintSnapshot

  constructor(options: PaintEngineOptions = {}) {
    this.background = options.background ?? BACKGROUND_COLOR
    const firstLayer = createLayer('Layer 1')
    this.initial = {
      width: positiveInt(options.width ?? DOCUMENT_WIDTH, DOCUMENT_WIDTH),
      height: positiveInt(options.height ?? DOCUMENT_HEIGHT, DOCUMENT_HEIGHT),
      layers: [firstLayer],
      activeLayerId: firstLayer.id,
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

  /** Operations on the active layer (the tools' drawing target). */
  getOperations(): readonly PaintOperation[] {
    return this.activeOperations()
  }

  /** All layers, bottom-most first. */
  getLayers(): readonly Layer[] {
    return this.current.layers
  }

  getActiveLayerId(): string {
    return this.current.activeLayerId
  }

  private activeOperations(): readonly PaintOperation[] {
    const current = this.current
    return activeLayer(current.layers, current.activeLayerId).operations
  }

  /** Pushes a new document revision with the active layer's ops replaced. */
  private pushActiveOperations(operations: readonly PaintOperation[]): void {
    const current = this.current
    this.pushDocument({
      width: current.width,
      height: current.height,
      layers: withLayerOperations(current.layers, current.activeLayerId, operations),
      activeLayerId: current.activeLayerId,
    })
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

  /** Brush opacity 0.05..1 (applies to new strokes). */
  setBrushOpacity(value: number): void {
    const next = Math.max(0.05, Math.min(1, value))
    if (next === this.brushOpacity) return
    this.brushOpacity = next
    this.emit()
  }

  /** Whether pen pressure varies the stroke width. */
  setBrushPressure(enabled: boolean): void {
    if (enabled === this.brushPressure) return
    this.brushPressure = enabled
    this.emit()
  }

  /** Freehand smoothing/stabilisation 0..0.9 (higher = steadier). */
  setBrushSmoothing(value: number): void {
    const next = Math.max(0, Math.min(0.9, value))
    if (next === this.brushSmoothing) return
    this.brushSmoothing = next
    this.emit()
  }

  setFontSize(size: number): void {
    const next = clampFontSize(size)
    if (next === this.fontSize) return
    this.fontSize = next
    this.emit()
  }

  setFontFamily(family: string): void {
    if (!isFontFamily(family) || family === this.fontFamily) return
    this.fontFamily = family
    this.emit()
  }

  setFontBold(bold: boolean): void {
    if (bold === this.fontBold) return
    this.fontBold = bold
    this.emit()
  }

  setSymmetry(mode: Symmetry): void {
    if (!isSymmetry(mode) || mode === this.symmetry) return
    this.symmetry = mode
    this.emit()
  }

  setFontItalic(italic: boolean): void {
    if (italic === this.fontItalic) return
    this.fontItalic = italic
    this.emit()
  }

  setStrokeStyle(style: StrokeStyle): void {
    if (!isStrokeStyle(style) || style === this.strokeStyle) return
    this.strokeStyle = style
    this.emit()
  }

  /** Selects the pencil the next photo sketch is drawn with. */
  setSketchStyle(style: SketchStyle): void {
    if (!isSketchStyle(style) || style === this.sketchStyle) return
    this.sketchStyle = style
    this.emit()
  }

  /** Sets how heavy the next photo sketch reads (lighter/normal/darker). */
  setSketchWeight(weight: SketchWeight): void {
    if (!isSketchWeight(weight) || weight === this.sketchWeight) return
    this.sketchWeight = weight
    this.emit()
  }

  /** Sets how much detail the next photo sketch keeps (simpler/normal/more). */
  setSketchDetail(detail: SketchDetail): void {
    if (!isSketchDetail(detail) || detail === this.sketchDetail) return
    this.sketchDetail = detail
    this.emit()
  }

  /** Whether new shapes are filled (true) or outlined (false). */
  setShapeFill(fill: boolean): void {
    if (fill === this.shapeFill) return
    this.shapeFill = fill
    this.emit()
  }

  /** Flood-fill colour tolerance (0–255); higher fills across similar colours. */
  setFillTolerance(value: number): void {
    const next = Math.max(0, Math.min(255, Math.round(value)))
    if (next === this.fillTolerance) return
    this.fillTolerance = next
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
        fontFamily: this.fontFamily,
        fontWeight: this.fontBold ? 700 : 400,
        fontStyle: this.fontItalic ? 'italic' : 'normal',
      }),
    )
    return true
  }

  /** Flood-fills from a document point, baked into one undoable image operation. */
  fillAt(point: Point): boolean {
    const current = this.current
    const operation = createFillOperation(
      this.activeOperations(),
      current.width,
      current.height,
      point,
      this.color,
      this.fillTolerance,
    )
    if (!operation) return false
    this.commit(operation)
    return true
  }

  /** Pastes a raster (e.g. a copied/cut selection) at a document position. */
  pasteImage(dataUrl: string, width: number, height: number, x: number, y: number): boolean {
    if (!dataUrl || width <= 0 || height <= 0) return false
    this.commit({ id: createId(), kind: 'image', x, y, width, height, dataUrl })
    return true
  }

  /**
   * Draws one shape centred in the document using the active colour and width.
   * Used by voice commands, which have no pointer position to place a shape.
   */
  drawShape(tool: ShapeTool): void {
    this.drawShapes(tool, 1, 'center')
  }

  /**
   * Draws `count` shapes at deterministic positions for voice commands:
   * default centre, along an edge, in the corners, or around all sides.
   */
  drawShapes(tool: ShapeTool, count = 1, placement: ShapePlacement = 'center'): void {
    const current = this.current
    const n = Math.max(1, Math.round(count) || 1)
    const basis = Math.min(current.width, current.height)
    const size =
      n === 1 ? Math.max(24, basis * 0.4) : Math.max(16, basis / (2 * Math.max(n, 2) + 2))
    const half = size / 2
    const points = placeShapes(placement, n, current.width, current.height)

    for (const point of points) {
      const start: Point =
        tool === 'line'
          ? { x: point.x - half, y: point.y }
          : { x: point.x - half, y: point.y - half }
      const end: Point =
        tool === 'line'
          ? { x: point.x + half, y: point.y }
          : { x: point.x + half, y: point.y + half }
      this.commit({
        id: createId(),
        kind: 'shape',
        tool,
        color: this.color,
        size: this.brushSize,
        start,
        end,
        fill: this.shapeFill,
      })
    }
  }

  /** Cuts a rectangular region to the background, undoably. */
  deleteSelection(rect: Rect): boolean {
    const current = this.current
    const mask = createSelectionMask(current.width, current.height, this.background, rect)
    if (!mask) return false
    this.pushActiveOperations([...this.activeOperations(), mask])
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
      this.activeOperations(),
      current.width,
      current.height,
      this.background,
      rect,
      offsetX,
      offsetY,
    )
    if (!move) return false
    this.pushActiveOperations([...this.activeOperations(), move.mask, move.patch])
    return true
  }

  commit(operation: PaintOperation): void {
    this.pushActiveOperations([...this.activeOperations(), operation])
  }

  /** Commits a batch of operations as ONE undoable step (e.g. a sketch). */
  commitOperations(operations: readonly PaintOperation[]): void {
    if (operations.length === 0) return
    this.pushActiveOperations([...this.activeOperations(), ...operations])
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

  /** Full history list (oldest first) for the History panel. */
  getHistoryEntries(): readonly DocumentState[] {
    return this.history.all
  }

  /** Cursor position within the history list. */
  getHistoryIndex(): number {
    return this.history.cursor
  }

  /** Jumps to a history state without discarding the redo branch. */
  jumpToHistory(index: number): void {
    if (this.history.jumpTo(index)) this.emit()
  }

  /** Clears the active layer (the whole canvas when it is the only layer). */
  clear(): void {
    if (this.activeOperations().length === 0) return
    this.pushActiveOperations([])
  }

  /** Replaces the document with a single layer (legacy/simple load). */
  loadDocument(width: number, height: number, operations: readonly PaintOperation[]): void {
    const layer = createLayer('Layer 1')
    layer.operations = [...operations]
    this.loadLayers(width, height, [layer], layer.id)
  }

  /** Replaces the document (all layers) and resets history. */
  loadLayers(
    width: number,
    height: number,
    layers: readonly Layer[],
    activeLayerId?: string,
  ): void {
    const safeLayers =
      layers.length > 0
        ? layers.map((layer) => ({ ...layer, operations: [...layer.operations] }))
        : [createLayer('Layer 1')]
    const active =
      activeLayerId && layerById(safeLayers, activeLayerId)
        ? activeLayerId
        : safeLayers[safeLayers.length - 1].id
    this.initial = {
      width: positiveInt(width, DOCUMENT_WIDTH),
      height: positiveInt(height, DOCUMENT_HEIGHT),
      layers: safeLayers,
      activeLayerId: active,
    }
    this.history.clear()
    this.emit()
  }

  /** Adds a new empty layer above the active one and selects it. */
  addLayer(): void {
    const current = this.current
    const layer = createLayer(`Layer ${current.layers.length + 1}`)
    this.pushDocument({
      ...current,
      layers: [...current.layers, layer],
      activeLayerId: layer.id,
    })
  }

  selectLayer(id: string): void {
    const current = this.current
    if (!layerById(current.layers, id) || current.activeLayerId === id) return
    this.pushDocument({ ...current, activeLayerId: id })
  }

  setLayerVisible(id: string, visible: boolean): void {
    const current = this.current
    if (!layerById(current.layers, id)) return
    this.pushDocument({
      ...current,
      layers: current.layers.map((layer) => (layer.id === id ? { ...layer, visible } : layer)),
    })
  }

  setLayerOpacity(id: string, opacity: number): void {
    const current = this.current
    if (!layerById(current.layers, id)) return
    const value = clampLayerOpacity(opacity)
    this.pushDocument({
      ...current,
      layers: current.layers.map((layer) =>
        layer.id === id ? { ...layer, opacity: value } : layer,
      ),
    })
  }

  renameLayer(id: string, name: string): void {
    const current = this.current
    const trimmed = name.trim()
    if (!trimmed || !layerById(current.layers, id)) return
    this.pushDocument({
      ...current,
      layers: current.layers.map((layer) =>
        layer.id === id ? { ...layer, name: trimmed.slice(0, 60) } : layer,
      ),
    })
  }

  /** Moves a layer up (+1) or down (-1) in the stack. */
  moveLayer(id: string, direction: -1 | 1): void {
    const current = this.current
    const index = current.layers.findIndex((layer) => layer.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= current.layers.length) return
    const layers = [...current.layers]
    const [layer] = layers.splice(index, 1)
    layers.splice(target, 0, layer)
    this.pushDocument({ ...current, layers })
  }

  /** Deletes a layer (keeps at least one). */
  deleteLayer(id: string): void {
    const current = this.current
    if (current.layers.length <= 1) return
    const index = current.layers.findIndex((layer) => layer.id === id)
    if (index < 0) return
    const layers = current.layers.filter((layer) => layer.id !== id)
    const activeLayerId =
      current.activeLayerId === id
        ? layers[Math.min(index, layers.length - 1)].id
        : current.activeLayerId
    this.pushDocument({ ...current, layers, activeLayerId })
  }

  /** Merges a layer into the one below it (vector ops are concatenated). */
  mergeDown(id: string): void {
    const current = this.current
    const index = current.layers.findIndex((layer) => layer.id === id)
    if (index <= 0) return
    const upper = current.layers[index]
    const lower = current.layers[index - 1]
    const merged: Layer = {
      ...lower,
      operations: [...lower.operations, ...upper.operations],
    }
    const layers = current.layers.filter((layer) => layer.id !== id)
    layers[index - 1] = merged
    this.pushDocument({ ...current, layers, activeLayerId: merged.id })
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
      layers: mapLayerOperations(current.layers, (ops) =>
        rotateOperations(ops, turns, current.width, current.height),
      ),
      activeLayerId: current.activeLayerId,
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
      layers: mapLayerOperations(current.layers, (ops) => scaleOperations(ops, scaleX, scaleY)),
      activeLayerId: current.activeLayerId,
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
      layers: mapLayerOperations(current.layers, (ops) =>
        translateOperations(ops, -bounded.x, -bounded.y),
      ),
      activeLayerId: current.activeLayerId,
    })
  }

  async exportPng(filename = 'voice-over-paint.png'): Promise<void> {
    if (!this.canvas) throw new Error('Canvas is not attached yet.')
    await exportCanvasAsPng(this.canvas, filename)
  }

  /** Export as PNG or JPEG. The voice layer keeps calling `exportPng`; this
   *  is the format-aware UI surface built on the same canvas pipeline. */
  async exportImage(format: 'png' | 'jpeg' = 'png'): Promise<void> {
    if (!this.canvas) throw new Error('Canvas is not attached yet.')
    await exportCanvasAsImage(this.canvas, format)
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
      fillTolerance: this.fillTolerance,
      shapeFill: this.shapeFill,
      brushOpacity: this.brushOpacity,
      brushPressure: this.brushPressure,
      brushSmoothing: this.brushSmoothing,
      fontFamily: this.fontFamily,
      fontBold: this.fontBold,
      fontItalic: this.fontItalic,
      symmetry: this.symmetry,
      strokeStyle: this.strokeStyle,
      sketchStyle: this.sketchStyle,
      sketchWeight: this.sketchWeight,
      sketchDetail: this.sketchDetail,
      canUndo: this.history.canUndo,
      canRedo: this.history.canRedo,
      operationCount: totalOperations(current.layers),
      layers: current.layers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        opacity: layer.opacity,
        operationCount: layer.operations.length,
      })),
      activeLayerId: current.activeLayerId,
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
