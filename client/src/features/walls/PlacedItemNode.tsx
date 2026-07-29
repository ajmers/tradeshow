import useImage from 'use-image'
import type Konva from 'konva'
import { Group, Rect, Text, Image as KonvaImage } from 'react-konva'
import type { Item, WallAssignment } from '@shared'
import { itemFootprintInches } from '@/features/walls/wallScale'
import { getItemImageUrl } from '@/features/items/getItemImageUrl'

interface PlacedItemNodeProps {
  assignment: WallAssignment
  item: Item
  scale: number
  isSelected?: boolean
  isSold?: boolean
  interactive?: boolean
  onSelect?: (assignmentId: string) => void
  onMove?: (assignmentId: string, xInches: number, yInches: number) => void
  onTransformEnd?: (
    assignmentId: string,
    xInches: number,
    yInches: number,
    rotationDegrees: number,
  ) => void
  registerNode?: (assignmentId: string, node: Konva.Group | null) => void
}

export function PlacedItemNode({
  assignment,
  item,
  scale,
  isSelected = false,
  isSold = false,
  interactive = false,
  onSelect,
  onMove,
  onTransformEnd,
  registerNode,
}: PlacedItemNodeProps) {
  const [image] = useImage(getItemImageUrl(item) ?? '')

  const { width: itemWidthInches, height: itemHeightInches } = itemFootprintInches(item.fields)
  const w = itemWidthInches * scale
  const h = itemHeightInches * scale
  // Rotation must pivot around the item's center (matching Airtable/every design tool),
  // but X/Y Position still means the top-left corner when unrotated. Konva rotates a node
  // around its own x/y, so we offset the group to its center and shift the drawn shape back.
  const topLeftX = (assignment.fields['X Position'] ?? 0) * scale
  const topLeftY = (assignment.fields['Y Position'] ?? 0) * scale
  const centerX = topLeftX + w / 2
  const centerY = topLeftY + h / 2

  return (
    <Group
      ref={(node) => registerNode?.(assignment.id, node)}
      x={centerX}
      y={centerY}
      offsetX={w / 2}
      offsetY={h / 2}
      rotation={assignment.fields['Rotation Angle'] ?? 0}
      draggable={interactive}
      onDragEnd={
        interactive
          ? (event) => {
              const node = event.target
              onMove?.(assignment.id, (node.x() - w / 2) / scale, (node.y() - h / 2) / scale)
            }
          : undefined
      }
      onClick={interactive ? () => onSelect?.(assignment.id) : undefined}
      onTap={interactive ? () => onSelect?.(assignment.id) : undefined}
      onTransformEnd={
        interactive
          ? (event) => {
              const node = event.target
              onTransformEnd?.(
                assignment.id,
                (node.x() - w / 2) / scale,
                (node.y() - h / 2) / scale,
                node.rotation(),
              )
            }
          : undefined
      }
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
      {isSold &&
        (() => {
          const badgeWidth = Math.min(40, w)
          const badgeHeight = Math.min(16, h)
          return (
            <>
              <Rect x={w - badgeWidth} y={0} width={badgeWidth} height={badgeHeight} fill="#dc2626" />
              <Text
                text="SOLD"
                x={w - badgeWidth}
                y={0}
                width={badgeWidth}
                height={badgeHeight}
                align="center"
                verticalAlign="middle"
                fontSize={9}
                fontStyle="bold"
                fill="#fff"
              />
            </>
          )
        })()}
    </Group>
  )
}
