import { Link } from 'react-router-dom'
import { Stage, Layer, Rect } from 'react-konva'
import type { Wall } from '@shared'
import { wallDimensionToInches } from '@/features/walls/wallScale'
import { PlacedItemNode } from '@/features/walls/PlacedItemNode'
import type { PlacedItem } from '@/features/walls/PlacedItem'

const DEFAULT_CONTAINER_SIZE = 260

interface WallCanvasProps {
  wall: Wall
  boothId: string
  placedItems: PlacedItem[]
  /** Pixel width/height of the (square) preview. Defaults to the full card size
   *  used in the booth's wall grid; pass a smaller value for a thumbnail. */
  size?: number
  /** Highlights this card as the one currently being edited, e.g. in the "All
   *  Walls" sidebar. */
  active?: boolean
}

export function WallCanvas({
  wall,
  boothId,
  placedItems,
  size = DEFAULT_CONTAINER_SIZE,
  active = false,
}: WallCanvasProps) {
  const fields = wall.fields
  const name = fields['Wall Name'] ?? 'Untitled wall'
  const widthInches = fields.Width
    ? wallDimensionToInches(fields.Width, fields['Unit of Measure'])
    : undefined
  const heightInches = fields.Height
    ? wallDimensionToInches(fields.Height, fields['Unit of Measure'])
    : undefined
  const to = `/booth-planner/${boothId}/walls/${wall.id}`
  const className = active ? 'wall-card wall-card--active' : 'wall-card'

  if (!widthInches || !heightInches) {
    return (
      <Link to={to} className={className}>
        <div
          className="wall-card__canvas wall-card__canvas--empty"
          style={{ width: size, height: size }}
        >
          No dimensions set
        </div>
        <div className="wall-card__caption">
          <strong>{name}</strong>
        </div>
      </Link>
    )
  }

  const scale = Math.min(size / widthInches, size / heightInches)
  const stageWidth = widthInches * scale
  const stageHeight = heightInches * scale
  const fill = fields['Wall Color']?.trim() || '#e4e4e7'

  return (
    <Link to={to} className={className}>
      <div className="wall-card__canvas" style={{ width: size, height: size }}>
        <Stage width={stageWidth} height={stageHeight} listening={false}>
          <Layer>
            <Rect
              x={0}
              y={0}
              width={stageWidth}
              height={stageHeight}
              fill={fill}
              stroke="#71717a"
              strokeWidth={1}
            />
            {placedItems.map(({ assignment, item, isSold }) => (
              <PlacedItemNode
                key={assignment.id}
                assignment={assignment}
                item={item}
                scale={scale}
                isSold={isSold}
              />
            ))}
          </Layer>
        </Stage>
      </div>
      <div className="wall-card__caption">
        <strong>{name}</strong>
        <span>
          h: {fields.Height} × w: {fields.Width} {fields['Unit of Measure'] ?? 'ft'}
        </span>
      </div>
    </Link>
  )
}
