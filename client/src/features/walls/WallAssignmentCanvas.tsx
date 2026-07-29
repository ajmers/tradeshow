import { useLayoutEffect, useRef, useState, type WheelEvent as ReactWheelEvent } from 'react'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { Stage, Layer, Rect, Group, Transformer } from 'react-konva'
import type { Wall } from '@shared'
import { wallDimensionToInches } from '@/features/walls/wallScale'
import { PlacedItemNode } from '@/features/walls/PlacedItemNode'
import { WallGrid } from '@/features/walls/WallGrid'
import type { PlacedItem } from '@/features/walls/PlacedItem'

// How far beyond the wall's own bounds you can scroll to see items placed off-wall.
// Kept smaller top/bottom than left/right so the canvas doesn't grow so tall it pushes
// the rest of the page (like the available-items tray) below the fold.
const MARGIN_INCHES_X = 36
const MARGIN_INCHES_Y = 12
// Floor on pixels-per-inch so a huge wall doesn't shrink to illegibility — past this
// point the canvas exceeds the available viewport and scrolling kicks in instead.
const MIN_SCALE = 3
const DEFAULT_AVAILABLE_SIZE = { width: 700, height: 700 }
// Leaves room below the canvas (e.g. the available-items tray) so the page fits
// without scrolling on typical viewports.
const HEIGHT_BUDGET_RATIO = 0.55
const MIN_HEIGHT_BUDGET = 400

// Zoom is a multiplier on top of the auto-fit scale above, not an absolute pixel value.
const ZOOM_MIN = 0.5
const ZOOM_MAX = 3
const ZOOM_STEP = 0.25
// Converts a wheel event's deltaY into a zoom change. Proportional rather than a fixed
// step per event, since trackpads fire many small events per scroll gesture while a
// mouse wheel fires few large ones — a fixed step would make trackpad zoom too jumpy.
const ZOOM_WHEEL_SENSITIVITY = 0.0015

function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value))
}

interface WallAssignmentCanvasProps {
  wall: Wall
  placedItems: PlacedItem[]
  selectedAssignmentId: string | null
  onSelect: (assignmentId: string | null) => void
  onMove: (assignmentId: string, xInches: number, yInches: number) => void
  onTransformEnd: (
    assignmentId: string,
    xInches: number,
    yInches: number,
    rotationDegrees: number,
  ) => void
  showGrid?: boolean
}

export function WallAssignmentCanvas({
  wall,
  placedItems,
  selectedAssignmentId,
  onSelect,
  onMove,
  onTransformEnd,
  showGrid = true,
}: WallAssignmentCanvasProps) {
  const nodeRefs = useRef(new Map<string, Konva.Group>())
  const transformerRef = useRef<Konva.Transformer>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [availableSize, setAvailableSize] = useState(DEFAULT_AVAILABLE_SIZE)
  const [zoom, setZoom] = useState(1)
  // When zoom changes via a button/wheel, this captures where the view was (as a
  // fraction of scrollable space) so the recentering effect below can restore roughly
  // the same view instead of snapping back to the middle of the wall every time.
  const pendingScrollFraction = useRef<{ x: number; y: number } | null>(null)

  function adjustZoom(updater: (current: number) => number) {
    const container = containerRef.current
    if (container) {
      const maxScrollLeft = container.scrollWidth - container.clientWidth
      const maxScrollTop = container.scrollHeight - container.clientHeight
      pendingScrollFraction.current = {
        x: maxScrollLeft > 0 ? container.scrollLeft / maxScrollLeft : 0.5,
        y: maxScrollTop > 0 ? container.scrollTop / maxScrollTop : 0.5,
      }
    }
    setZoom((current) => clampZoom(updater(current)))
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault()
    adjustZoom((current) => current - event.deltaY * ZOOM_WHEEL_SENSITIVITY)
  }

  // Scrolling now zooms rather than panning, so dragging on empty canvas space is the
  // replacement way to move around — items keep their own Konva drag behavior since this
  // only starts a pan when the mousedown target is the stage background itself.
  function handleStageMouseDown(event: KonvaEventObject<MouseEvent>) {
    if (event.target !== event.target.getStage()) {
      return
    }
    onSelect(null)
    const container = containerRef.current
    if (!container) {
      return
    }
    const startX = event.evt.clientX
    const startY = event.evt.clientY
    const startScrollLeft = container.scrollLeft
    const startScrollTop = container.scrollTop

    const handlePanMove = (moveEvent: MouseEvent) => {
      container.scrollLeft = startScrollLeft - (moveEvent.clientX - startX)
      container.scrollTop = startScrollTop - (moveEvent.clientY - startY)
    }
    const handlePanEnd = () => {
      window.removeEventListener('mousemove', handlePanMove)
      window.removeEventListener('mouseup', handlePanEnd)
    }
    window.addEventListener('mousemove', handlePanMove)
    window.addEventListener('mouseup', handlePanEnd)
  }

  const fields = wall.fields
  const widthInches = fields.Width
    ? wallDimensionToInches(fields.Width, fields['Unit of Measure'])
    : undefined
  const heightInches = fields.Height
    ? wallDimensionToInches(fields.Height, fields['Unit of Measure'])
    : undefined

  // Track how much room the canvas actually has, so it can grow to fill the viewport
  // instead of being capped at a fixed size regardless of screen space.
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) {
      return
    }

    const updateSize = () => {
      setAvailableSize({
        width: wrapper.clientWidth,
        height: Math.max(MIN_HEIGHT_BUDGET, window.innerHeight * HEIGHT_BUDGET_RATIO),
      })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(wrapper)
    window.addEventListener('resize', updateSize)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  useLayoutEffect(() => {
    const transformer = transformerRef.current
    if (!transformer) {
      return
    }
    const node = selectedAssignmentId ? nodeRefs.current.get(selectedAssignmentId) : undefined
    transformer.nodes(node ? [node] : [])
    transformer.getLayer()?.batchDraw()
  }, [selectedAssignmentId, placedItems])

  // Center the scroll on the wall itself rather than the top-left corner of the margin —
  // unless a zoom change just captured where the view was, in which case restore that
  // instead of snapping back to center.
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }
    const pending = pendingScrollFraction.current
    if (pending) {
      container.scrollLeft = pending.x * (container.scrollWidth - container.clientWidth)
      container.scrollTop = pending.y * (container.scrollHeight - container.clientHeight)
      pendingScrollFraction.current = null
    } else {
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2
      container.scrollTop = (container.scrollHeight - container.clientHeight) / 2
    }
  }, [wall.id, availableSize, zoom])

  if (!widthInches || !heightInches) {
    return <p>This wall doesn&apos;t have dimensions set yet.</p>
  }

  const totalWidthInches = widthInches + MARGIN_INCHES_X * 2
  const totalHeightInches = heightInches + MARGIN_INCHES_Y * 2
  const fitScale = Math.min(
    availableSize.width / totalWidthInches,
    availableSize.height / totalHeightInches,
  )
  const scale = Math.max(MIN_SCALE, fitScale) * zoom

  const wallWidth = widthInches * scale
  const wallHeight = heightInches * scale
  const marginX = MARGIN_INCHES_X * scale
  const marginY = MARGIN_INCHES_Y * scale
  const canvasWidth = wallWidth + marginX * 2
  const canvasHeight = wallHeight + marginY * 2
  const wallFill = fields['Wall Color']?.trim() || '#e4e4e7'

  return (
    <div className="wall-editor-canvas-wrapper" ref={wrapperRef}>
      <div className="wall-editor-zoom">
        <button
          type="button"
          onClick={() => adjustZoom((current) => current - ZOOM_STEP)}
          disabled={zoom <= ZOOM_MIN}
          aria-label="Zoom out"
        >
          −
        </button>
        <button type="button" onClick={() => adjustZoom(() => 1)} title="Reset zoom">
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => adjustZoom((current) => current + ZOOM_STEP)}
          disabled={zoom >= ZOOM_MAX}
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
      <div
        className="wall-editor-canvas"
        ref={containerRef}
        onWheel={handleWheel}
        style={{ width: availableSize.width, height: availableSize.height }}
      >
        <Stage width={canvasWidth} height={canvasHeight} onMouseDown={handleStageMouseDown}>
          <Layer>
            <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="#d4d4d8" />
            <Group x={marginX} y={marginY}>
              <Rect
                x={0}
                y={0}
                width={wallWidth}
                height={wallHeight}
                fill={wallFill}
                stroke="#71717a"
                strokeWidth={1}
              />
              {showGrid && (
                <WallGrid widthInches={widthInches} heightInches={heightInches} scale={scale} />
              )}
              {placedItems.map(({ assignment, item, isSold }) => (
                <PlacedItemNode
                  key={assignment.id}
                  assignment={assignment}
                  item={item}
                  scale={scale}
                  interactive
                  isSelected={assignment.id === selectedAssignmentId}
                  isSold={isSold}
                  onSelect={onSelect}
                  onMove={onMove}
                  onTransformEnd={onTransformEnd}
                  registerNode={(id, node) => {
                    if (node) {
                      nodeRefs.current.set(id, node)
                    } else {
                      nodeRefs.current.delete(id)
                    }
                  }}
                />
              ))}
            </Group>
            <Transformer ref={transformerRef} resizeEnabled={false} rotateEnabled />
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
