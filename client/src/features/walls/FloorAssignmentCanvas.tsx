import { useLayoutEffect, useRef, useState, type WheelEvent as ReactWheelEvent } from 'react'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { Stage, Layer, Rect, Group, Line, Text, Transformer } from 'react-konva'
import { WallGrid } from '@/features/walls/WallGrid'
import { PlacedFloorItemNode } from '@/features/walls/PlacedFloorItemNode'
import type {
  BoothSurfaceName,
  BoothSurfaceOccupant,
  FloorPlacementWithItem,
} from '@/features/walls/BoothScene3D'

type Surfaces = Record<BoothSurfaceName, BoothSurfaceOccupant | null>

const INCHES_PER_FOOT = 12
const MARGIN_INCHES = 24
const MIN_SCALE = 3
const DEFAULT_AVAILABLE_SIZE = { width: 700, height: 700 }
const HEIGHT_BUDGET_RATIO = 0.55
const MIN_HEIGHT_BUDGET = 400

const ZOOM_MIN = 0.5
const ZOOM_MAX = 3
const ZOOM_STEP = 0.25
const ZOOM_WHEEL_SENSITIVITY = 0.0015

function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value))
}

// Which screen-space edge of the top-down rectangle each booth surface maps to —
// Back is drawn furthest away (top), Front nearest (bottom), matching the 3D view's
// default camera looking in from the front.
const SURFACE_EDGES: Record<
  BoothSurfaceName,
  (widthPx: number, heightPx: number) => { points: number[]; labelX: number; labelY: number }
> = {
  Back: (w) => ({ points: [0, 0, w, 0], labelX: w / 2, labelY: -14 }),
  Front: (w, h) => ({ points: [0, h, w, h], labelX: w / 2, labelY: h + 4 }),
  Left: (_w, h) => ({ points: [0, 0, 0, h], labelX: -34, labelY: h / 2 - 6 }),
  Right: (w, h) => ({ points: [w, 0, w, h], labelX: w + 4, labelY: h / 2 - 6 }),
}

interface FloorAssignmentCanvasProps {
  widthFt: number
  depthFt: number
  surfaces: Surfaces
  floorPlacements: FloorPlacementWithItem[]
  selectedPlacementId: string | null
  onSelect: (placementId: string | null) => void
  onMove: (placementId: string, xInches: number, yInches: number) => void
  onTransformEnd: (
    placementId: string,
    xInches: number,
    yInches: number,
    rotationDegrees: number,
  ) => void
  /** Fires with a click on empty floor space, in booth-relative inches — used to drop
   *  whichever item is currently armed for placement. */
  onFloorClick?: (xInches: number, yInches: number) => void
  showGrid?: boolean
}

export function FloorAssignmentCanvas({
  widthFt,
  depthFt,
  surfaces,
  floorPlacements,
  selectedPlacementId,
  onSelect,
  onMove,
  onTransformEnd,
  onFloorClick,
  showGrid = true,
}: FloorAssignmentCanvasProps) {
  const nodeRefs = useRef(new Map<string, Konva.Group>())
  const transformerRef = useRef<Konva.Transformer>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [availableSize, setAvailableSize] = useState(DEFAULT_AVAILABLE_SIZE)
  const [zoom, setZoom] = useState(1)
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

  const widthInches = widthFt * INCHES_PER_FOOT
  const depthInches = depthFt * INCHES_PER_FOOT

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
    let moved = false

    const handlePanMove = (moveEvent: MouseEvent) => {
      if (Math.abs(moveEvent.clientX - startX) > 3 || Math.abs(moveEvent.clientY - startY) > 3) {
        moved = true
      }
      container.scrollLeft = startScrollLeft - (moveEvent.clientX - startX)
      container.scrollTop = startScrollTop - (moveEvent.clientY - startY)
    }
    const handlePanEnd = () => {
      window.removeEventListener('mousemove', handlePanMove)
      window.removeEventListener('mouseup', handlePanEnd)
      // A plain click (no real drag) on empty floor places whichever item is armed.
      if (!moved && onFloorClick) {
        const stage = event.target.getStage()
        const pointer = stage?.getPointerPosition()
        if (pointer) {
          const marginPx = MARGIN_INCHES * scale
          onFloorClick((pointer.x - marginPx) / scale, (pointer.y - marginPx) / scale)
        }
      }
    }
    window.addEventListener('mousemove', handlePanMove)
    window.addEventListener('mouseup', handlePanEnd)
  }

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
    const node = selectedPlacementId ? nodeRefs.current.get(selectedPlacementId) : undefined
    transformer.nodes(node ? [node] : [])
    transformer.getLayer()?.batchDraw()
  }, [selectedPlacementId, floorPlacements])

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
  }, [widthFt, depthFt, availableSize, zoom])

  const totalWidthInches = widthInches + MARGIN_INCHES * 2
  const totalHeightInches = depthInches + MARGIN_INCHES * 2
  const fitScale = Math.min(
    availableSize.width / totalWidthInches,
    availableSize.height / totalHeightInches,
  )
  const scale = Math.max(MIN_SCALE, fitScale) * zoom

  const floorWidthPx = widthInches * scale
  const floorHeightPx = depthInches * scale
  const marginPx = MARGIN_INCHES * scale
  const canvasWidth = floorWidthPx + marginPx * 2
  const canvasHeight = floorHeightPx + marginPx * 2

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
            <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="#f4f4f5" />
            <Group x={marginPx} y={marginPx}>
              <Rect
                x={0}
                y={0}
                width={floorWidthPx}
                height={floorHeightPx}
                fill="#d4d4d8"
                stroke="#71717a"
                strokeWidth={1}
              />
              {showGrid && (
                <WallGrid widthInches={widthInches} heightInches={depthInches} scale={scale} />
              )}
              {(['Front', 'Back', 'Left', 'Right'] as BoothSurfaceName[]).map((name) => {
                const occupied = Boolean(surfaces[name])
                const { points, labelX, labelY } = SURFACE_EDGES[name](floorWidthPx, floorHeightPx)
                return (
                  <Group key={name}>
                    <Line
                      points={points}
                      stroke={occupied ? '#3f9868' : '#a1a1aa'}
                      strokeWidth={occupied ? 4 : 2}
                      dash={occupied ? undefined : [6, 4]}
                    />
                    <Text
                      text={occupied ? (surfaces[name]?.wall.fields['Wall Name'] ?? name) : `${name} (open)`}
                      x={labelX}
                      y={labelY}
                      fontSize={11}
                      fill="#52525b"
                      align={name === 'Left' ? 'right' : name === 'Right' ? 'left' : 'center'}
                      width={name === 'Left' || name === 'Right' ? 30 : undefined}
                      offsetX={name === 'Back' || name === 'Front' ? 60 : 0}
                    />
                  </Group>
                )
              })}
              <Text
                text={`${widthFt}' wide`}
                x={floorWidthPx / 2}
                y={-30}
                offsetX={40}
                width={80}
                align="center"
                fontSize={12}
                fontStyle="bold"
                fill="#18181b"
              />
              <Text
                text={`${depthFt}' deep`}
                x={-52}
                y={floorHeightPx / 2}
                offsetX={40}
                width={80}
                align="center"
                fontSize={12}
                fontStyle="bold"
                fill="#18181b"
                rotation={-90}
              />
              {floorPlacements.map(({ placement, item, isSold }) => (
                <PlacedFloorItemNode
                  key={placement.id}
                  placement={placement}
                  item={item}
                  scale={scale}
                  interactive
                  isSelected={placement.id === selectedPlacementId}
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
            <Transformer
              ref={transformerRef}
              resizeEnabled={false}
              rotateEnabled
              rotationSnaps={[0, 90, 180, 270]}
              rotationSnapTolerance={8}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
