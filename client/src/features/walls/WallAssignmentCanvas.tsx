import useImage from 'use-image'
import { Stage, Layer, Rect, Text, Group, Image as KonvaImage } from 'react-konva'
import type { Wall, Item, WallAssignment } from '@shared'
import { toInches, wallDimensionToInches } from '@/features/walls/wallScale'
import { getItemImageUrl } from '@/features/items/getItemImageUrl'

const MAX_STAGE = 700
const DEFAULT_ITEM_INCHES = 6

export interface PlacedItem {
  assignment: WallAssignment
  item: Item
}

interface WallAssignmentCanvasProps {
  wall: Wall
  placedItems: PlacedItem[]
  selectedAssignmentId: string | null
  onSelect: (assignmentId: string | null) => void
  onMove: (assignmentId: string, xInches: number, yInches: number) => void
}

interface PlacedItemNodeProps {
  assignment: WallAssignment
  item: Item
  scale: number
  isSelected: boolean
  onSelect: (assignmentId: string) => void
  onMove: (assignmentId: string, xInches: number, yInches: number) => void
}

function PlacedItemNode({
  assignment,
  item,
  scale,
  isSelected,
  onSelect,
  onMove,
}: PlacedItemNodeProps) {
  const [image] = useImage(getItemImageUrl(item) ?? '')

  const itemWidthInches = item.fields.Width
    ? toInches(item.fields.Width, item.fields['Unit of Measure'])
    : DEFAULT_ITEM_INCHES
  const itemHeightInches = item.fields.Height
    ? toInches(item.fields.Height, item.fields['Unit of Measure'])
    : DEFAULT_ITEM_INCHES
  const w = itemWidthInches * scale
  const h = itemHeightInches * scale
  const x = (assignment.fields['X Position'] ?? 0) * scale
  const y = (assignment.fields['Y Position'] ?? 0) * scale

  return (
    <Group
      x={x}
      y={y}
      rotation={assignment.fields['Rotation Angle'] ?? 0}
      draggable
      onDragEnd={(event) => {
        const node = event.target
        onMove(assignment.id, node.x() / scale, node.y() / scale)
      }}
      onClick={() => onSelect(assignment.id)}
      onTap={() => onSelect(assignment.id)}
    >
      {image ? (
        <KonvaImage
          image={image}
          width={w}
          height={h}
          stroke={isSelected ? '#2563eb' : '#a1a1aa'}
          strokeWidth={isSelected ? 2 : 1}
        />
      ) : (
        <>
          <Rect
            width={w}
            height={h}
            fill="#fafafa"
            stroke={isSelected ? '#2563eb' : '#a1a1aa'}
            strokeWidth={isSelected ? 2 : 1}
          />
          <Text
            text={item.fields.Title ?? 'Untitled'}
            width={w}
            height={h}
            align="center"
            verticalAlign="middle"
            fontSize={11}
            padding={4}
            fill="#18181b"
          />
        </>
      )}
    </Group>
  )
}

export function WallAssignmentCanvas({
  wall,
  placedItems,
  selectedAssignmentId,
  onSelect,
  onMove,
}: WallAssignmentCanvasProps) {
  const fields = wall.fields
  const widthInches = fields.Width
    ? wallDimensionToInches(fields.Width, fields['Unit of Measure'])
    : undefined
  const heightInches = fields.Height
    ? wallDimensionToInches(fields.Height, fields['Unit of Measure'])
    : undefined

  if (!widthInches || !heightInches) {
    return <p>This wall doesn&apos;t have dimensions set yet.</p>
  }

  const scale = Math.min(MAX_STAGE / widthInches, MAX_STAGE / heightInches)
  const stageWidth = widthInches * scale
  const stageHeight = heightInches * scale
  const wallFill = fields['Wall Color']?.trim() || '#e4e4e7'

  return (
    <Stage
      width={stageWidth}
      height={stageHeight}
      onMouseDown={(event) => {
        if (event.target === event.target.getStage()) {
          onSelect(null)
        }
      }}
    >
      <Layer>
        <Rect
          x={0}
          y={0}
          width={stageWidth}
          height={stageHeight}
          fill={wallFill}
          stroke="#71717a"
          strokeWidth={1}
        />
        {placedItems.map(({ assignment, item }) => (
          <PlacedItemNode
            key={assignment.id}
            assignment={assignment}
            item={item}
            scale={scale}
            isSelected={assignment.id === selectedAssignmentId}
            onSelect={onSelect}
            onMove={onMove}
          />
        ))}
      </Layer>
    </Stage>
  )
}
