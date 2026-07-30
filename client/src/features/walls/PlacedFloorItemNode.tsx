import type Konva from 'konva'
import { Group, Rect, Text } from 'react-konva'
import type { FloorPlacement, Item } from '@shared'
import { itemFloorFootprintInches } from '@/features/walls/wallScale'

interface PlacedFloorItemNodeProps {
  placement: FloorPlacement
  item: Item
  scale: number
  isSelected?: boolean
  isSold?: boolean
  interactive?: boolean
  onSelect?: (placementId: string) => void
  onMove?: (placementId: string, xInches: number, yInches: number) => void
  onTransformEnd?: (
    placementId: string,
    xInches: number,
    yInches: number,
    rotationDegrees: number,
  ) => void
  registerNode?: (placementId: string, node: Konva.Group | null) => void
}

function formatInches(value: number): string {
  return `${Math.round(value * 10) / 10}"`
}

// Same shape as PlacedItemNode (the wall version) — just keyed by a FloorPlacement
// and the item's floor footprint (width × depth) instead of its on-wall footprint
// (width × height). No photos here — this view is for laying out and measuring
// footprints, not previewing artwork, so each item is always a plain labeled
// rectangle showing its title and its width × depth.
export function PlacedFloorItemNode({
  placement,
  item,
  scale,
  isSelected = false,
  isSold = false,
  interactive = false,
  onSelect,
  onMove,
  onTransformEnd,
  registerNode,
}: PlacedFloorItemNodeProps) {
  const { width: itemWidthInches, depth: itemDepthInches } = itemFloorFootprintInches(item.fields)
  const w = itemWidthInches * scale
  const h = itemDepthInches * scale
  // Rotation must pivot around the item's center (matching Airtable/every design
  // tool), but X/Y Position still means the top-left corner when unrotated. Konva
  // rotates a node around its own x/y, so we offset the group to its center and
  // shift the drawn shape back.
  const topLeftX = (placement.fields['X Position'] ?? 0) * scale
  const topLeftY = (placement.fields['Y Position'] ?? 0) * scale
  const centerX = topLeftX + w / 2
  const centerY = topLeftY + h / 2

  return (
    <Group
      ref={(node) => registerNode?.(placement.id, node)}
      x={centerX}
      y={centerY}
      offsetX={w / 2}
      offsetY={h / 2}
      rotation={placement.fields['Rotation Angle'] ?? 0}
      draggable={interactive}
      onDragEnd={
        interactive
          ? (event) => {
              const node = event.target
              onMove?.(placement.id, (node.x() - w / 2) / scale, (node.y() - h / 2) / scale)
            }
          : undefined
      }
      onClick={interactive ? () => onSelect?.(placement.id) : undefined}
      onTap={interactive ? () => onSelect?.(placement.id) : undefined}
      onTransformEnd={
        interactive
          ? (event) => {
              const node = event.target
              onTransformEnd?.(
                placement.id,
                (node.x() - w / 2) / scale,
                (node.y() - h / 2) / scale,
                node.rotation(),
              )
            }
          : undefined
      }
    >
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
      {/* Below the box rather than inside it, since a real item's footprint can be
          much too thin (e.g. a painting's shallow depth) to fit two lines of text. */}
      <Text
        text={`${formatInches(itemWidthInches)} × ${formatInches(itemDepthInches)}`}
        y={h + 2}
        width={w}
        align="center"
        fontSize={10}
        fill="#52525b"
      />
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
