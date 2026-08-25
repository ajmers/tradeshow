import { Group, Rect, Text } from 'react-konva'
import type { Item, WallAssignment } from '@shared'
import { itemFootprintInches } from '@/features/walls/wallScale'
import { defaultLabelPosition, labelLinesForItem, labelSizeInches } from '@/features/walls/labelPlacement'

// Matches the print label's own font sizes (see .label-sheet__field /
// .label-sheet__field--Title in index.css), converted at the CSS-spec-standard
// 96px/in reference pixel — so the label reads at roughly the size it would
// actually print at, once scaled onto the wall canvas below.
const TITLE_FONT_PX = 21.33 // 16pt
const FIELD_FONT_PX = 18.67 // 14pt
const TITLE_FONT_FAMILY = "'Libertinus Serif', Georgia, serif"
const FIELD_FONT_FAMILY = "'Source Sans 3', system-ui, sans-serif"
const LINE_HEIGHT_RATIO = 1.2
const PADDING_INCHES = 0.12
const PX_PER_INCH = 96

interface LabelNodeProps {
  assignment: WallAssignment
  item: Item
  scale: number
  // The wall's own "Show Labels" default — this item's own Label
  // Hidden/Label Shown always overrides it, in either direction.
  wallShowsLabels: boolean
  interactive?: boolean
  onMove?: (assignmentId: string, xInches: number, yInches: number) => void
}

// Deliberately true-to-scale, same as PlacedItemNode: no minimum-size floor
// bumping it up when zoomed out. The whole point of putting labels on the
// wall canvas is to see their real physical size and placement relative to
// the wall and the art, so an artificially inflated label would misrepresent
// exactly the thing this is for. Zoom in (the canvas already supports it) to
// read a label at a given moment; the canvas itself stays accurate throughout.
export function LabelNode({
  assignment,
  item,
  scale,
  wallShowsLabels,
  interactive = false,
  onMove,
}: LabelNodeProps) {
  const lines = labelLinesForItem(item)
  const hidden = Boolean(assignment.fields['Label Hidden'])
  const shown = Boolean(assignment.fields['Label Shown']) || wallShowsLabels
  if (lines.length === 0 || hidden || !shown) {
    return null
  }

  const itemFootprint = itemFootprintInches(item.fields)
  const itemX = assignment.fields['X Position'] ?? 0
  const itemY = assignment.fields['Y Position'] ?? 0
  const { width: labelWidthInches, height: labelHeightInches } = labelSizeInches(item)
  const fallback = defaultLabelPosition(itemX, itemY, itemFootprint, labelHeightInches)

  const xInches = assignment.fields['Label X Position'] ?? fallback.x
  const yInches = assignment.fields['Label Y Position'] ?? fallback.y

  const w = labelWidthInches * scale
  const h = labelHeightInches * scale
  const paddingPx = PADDING_INCHES * scale
  const titleFontSize = (TITLE_FONT_PX / PX_PER_INCH) * scale
  const fieldFontSize = (FIELD_FONT_PX / PX_PER_INCH) * scale
  const titleLineHeight = titleFontSize * LINE_HEIGHT_RATIO

  const titleLine = lines.find((line) => line.isTitle)
  const priceLine = lines.find((line) => !line.isTitle)
  const textWidth = w - paddingPx * 2

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
      {titleLine && (
        <Text
          text={titleLine.text}
          x={paddingPx}
          y={paddingPx}
          width={textWidth}
          height={titleLineHeight}
          wrap="none"
          ellipsis
          fontFamily={TITLE_FONT_FAMILY}
          fontStyle="bold"
          fontSize={titleFontSize}
          lineHeight={LINE_HEIGHT_RATIO}
          fill="#18181b"
        />
      )}
      {priceLine && (
        <Text
          text={priceLine.text}
          x={paddingPx}
          y={paddingPx + titleLineHeight}
          width={textWidth}
          height={h - paddingPx * 2 - titleLineHeight}
          wrap="none"
          ellipsis
          fontFamily={FIELD_FONT_FAMILY}
          fontSize={fieldFontSize}
          lineHeight={LINE_HEIGHT_RATIO}
          fill="#52525b"
        />
      )}
    </Group>
  )
}
