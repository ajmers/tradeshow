import { useEffect, useRef } from 'react'
import type Konva from 'konva'
import { Stage, Layer, Rect, Group, Transformer } from 'react-konva'
import type { Wall } from '@shared'
import { wallDimensionToInches } from '@/features/walls/wallScale'
import { PlacedItemNode } from '@/features/walls/PlacedItemNode'
import { WallGrid } from '@/features/walls/WallGrid'
import type { PlacedItem } from '@/features/walls/PlacedItem'

const MAX_STAGE = 700
// How far beyond the wall's own bounds you can scroll to see items placed off-wall.
const MARGIN_INCHES = 36

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

  const fields = wall.fields
  const widthInches = fields.Width
    ? wallDimensionToInches(fields.Width, fields['Unit of Measure'])
    : undefined
  const heightInches = fields.Height
    ? wallDimensionToInches(fields.Height, fields['Unit of Measure'])
    : undefined

  useEffect(() => {
    const transformer = transformerRef.current
    if (!transformer) {
      return
    }
    const node = selectedAssignmentId ? nodeRefs.current.get(selectedAssignmentId) : undefined
    transformer.nodes(node ? [node] : [])
    transformer.getLayer()?.batchDraw()
  }, [selectedAssignmentId, placedItems])

  // Center the scroll on the wall itself rather than the top-left corner of the margin.
  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }
    container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2
    container.scrollTop = (container.scrollHeight - container.clientHeight) / 2
  }, [wall.id])

  if (!widthInches || !heightInches) {
    return <p>This wall doesn&apos;t have dimensions set yet.</p>
  }

  const scale = Math.min(MAX_STAGE / widthInches, MAX_STAGE / heightInches)
  const wallWidth = widthInches * scale
  const wallHeight = heightInches * scale
  const margin = MARGIN_INCHES * scale
  const canvasWidth = wallWidth + margin * 2
  const canvasHeight = wallHeight + margin * 2
  const wallFill = fields['Wall Color']?.trim() || '#e4e4e7'

  return (
    <div className="wall-editor-canvas" ref={containerRef}>
      <Stage
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={(event) => {
          if (event.target === event.target.getStage()) {
            onSelect(null)
          }
        }}
      >
        <Layer>
          <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="#d4d4d8" />
          <Group x={margin} y={margin}>
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
            {placedItems.map(({ assignment, item }) => (
              <PlacedItemNode
                key={assignment.id}
                assignment={assignment}
                item={item}
                scale={scale}
                interactive
                isSelected={assignment.id === selectedAssignmentId}
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
  )
}
