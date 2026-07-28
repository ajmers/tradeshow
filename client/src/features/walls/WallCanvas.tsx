import { Link } from 'react-router-dom'
import { Stage, Layer, Rect } from 'react-konva'
import type { Wall } from '@shared'
import { wallDimensionToInches } from '@/features/walls/wallScale'
import { PlacedItemNode } from '@/features/walls/PlacedItemNode'
import type { PlacedItem } from '@/features/walls/PlacedItem'

const CONTAINER_SIZE = 260

interface WallCanvasProps {
  wall: Wall
  boothId: string
  placedItems: PlacedItem[]
}

export function WallCanvas({ wall, boothId, placedItems }: WallCanvasProps) {
  const fields = wall.fields
  const name = fields['Wall Name'] ?? 'Untitled wall'
  const widthInches = fields.Width
    ? wallDimensionToInches(fields.Width, fields['Unit of Measure'])
    : undefined
  const heightInches = fields.Height
    ? wallDimensionToInches(fields.Height, fields['Unit of Measure'])
    : undefined
  const to = `/booth-planner/${boothId}/walls/${wall.id}`

  if (!widthInches || !heightInches) {
    return (
      <Link to={to} className="wall-card">
        <div className="wall-card__canvas wall-card__canvas--empty">No dimensions set</div>
        <div className="wall-card__caption">
          <strong>{name}</strong>
        </div>
      </Link>
    )
  }

  const scale = Math.min(CONTAINER_SIZE / widthInches, CONTAINER_SIZE / heightInches)
  const stageWidth = widthInches * scale
  const stageHeight = heightInches * scale
  const fill = fields['Wall Color']?.trim() || '#e4e4e7'

  return (
    <Link to={to} className="wall-card">
      <div className="wall-card__canvas" style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE }}>
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
            {placedItems.map(({ assignment, item }) => (
              <PlacedItemNode key={assignment.id} assignment={assignment} item={item} scale={scale} />
            ))}
          </Layer>
        </Stage>
      </div>
      <div className="wall-card__caption">
        <strong>{name}</strong>
        <span>
          {fields.Height} × {fields.Width} {fields['Unit of Measure'] ?? 'ft'}
        </span>
      </div>
    </Link>
  )
}
