import type { ReactNode } from 'react'
import { Group, Rect, Text } from 'react-konva'
import type { Item, WallAssignment } from '@shared'
import { itemFootprintInches } from '@/features/walls/wallScale'
import {
  FIELD_FONT_FAMILY,
  FIELD_FONT_PX,
  LINE_HEIGHT_RATIO,
  PADDING_INCHES,
  PX_PER_INCH,
  TITLE_FONT_FAMILY,
  TITLE_FONT_PX,
} from '@/features/walls/labelDimensions'
import {
  defaultLabelPosition,
  labelDimensionsForItem,
  labelLinesForItem,
} from '@/features/walls/labelPlacement'

interface LabelNodeProps {
  assignment: WallAssignment
  item: Item
  scale: number
  interactive?: boolean
  onMove?: (assignmentId: string, xInches: number, yInches: number) => void
}

export function LabelNode({ assignment, item, scale, interactive = false, onMove }: LabelNodeProps) {
  const lines = labelLinesForItem(item)
  if (lines.length === 0) {
    return null
  }

  const dims = labelDimensionsForItem(item)
  const itemFootprint = itemFootprintInches(item.fields)
  const itemX = assignment.fields['X Position'] ?? 0
  const itemY = assignment.fields['Y Position'] ?? 0
  const fallback = defaultLabelPosition(itemX, itemY, itemFootprint, dims.heightInches)

  const xInches = assignment.fields['Label X Position'] ?? fallback.x
  const yInches = assignment.fields['Label Y Position'] ?? fallback.y

  const w = dims.widthInches * scale
  const h = dims.heightInches * scale
  // Same px-per-inch -> canvas-scale conversion as the box itself, so the drawn
  // text is proportioned exactly like the real-world label it's estimating.
  const titleFontSize = (TITLE_FONT_PX / PX_PER_INCH) * scale
  const fieldFontSize = (FIELD_FONT_PX / PX_PER_INCH) * scale
  const paddingPx = PADDING_INCHES * scale

  // Builds each line's vertical offset functionally (rather than mutating a
  // running counter across the .map()) — each step folds in the previous
  // lines' total height so far.
  const { nodes: textNodes } = lines.reduce<{ nodes: ReactNode[]; y: number }>(
    (acc, line, index) => {
      const fontSize = line.isTitle ? titleFontSize : fieldFontSize
      const lineHeight = fontSize * LINE_HEIGHT_RATIO
      return {
        nodes: [
          ...acc.nodes,
          <Text
            key={index}
            text={line.text}
            x={paddingPx}
            y={acc.y}
            width={w - paddingPx * 2}
            fontFamily={line.isTitle ? TITLE_FONT_FAMILY : FIELD_FONT_FAMILY}
            fontStyle={line.isTitle ? 'bold' : 'normal'}
            fontSize={fontSize}
            lineHeight={LINE_HEIGHT_RATIO}
            fill="#18181b"
          />,
        ],
        y: acc.y + lineHeight,
      }
    },
    { nodes: [], y: paddingPx },
  )

  return (
    <Group
      x={xInches * scale}
      y={yInches * scale}
      draggable={interactive}
      onDragEnd={
        interactive
          ? (event) => {
              const node = event.target
              onMove?.(assignment.id, node.x() / scale, node.y() / scale)
            }
          : undefined
      }
    >
      <Rect width={w} height={h} fill="#fff" stroke="#a1a1aa" strokeWidth={1} cornerRadius={2} />
      {textNodes}
    </Group>
  )
}
