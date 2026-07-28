import { Stage, Layer, Rect, Text } from 'react-konva'
import type { Wall } from '@shared'

const CONTAINER_SIZE = 260
const INCHES_PER_CM = 0.393701

function toInches(value: number, unit: string | undefined): number {
  if (unit === 'centimeters' || unit === 'cm') {
    return value * INCHES_PER_CM
  }
  return value
}

export function WallCanvas({ wall }: { wall: Wall }) {
  const fields = wall.fields
  const name = fields['Wall Name'] ?? 'Untitled wall'
  const widthInches = fields.Width ? toInches(fields.Width, fields['Unit of Measure']) : undefined
  const heightInches = fields.Height ? toInches(fields.Height, fields['Unit of Measure']) : undefined

  if (!widthInches || !heightInches) {
    return (
      <div className="wall-card">
        <div className="wall-card__canvas wall-card__canvas--empty">No dimensions set</div>
        <div className="wall-card__caption">
          <strong>{name}</strong>
        </div>
      </div>
    )
  }

  const scale = Math.min(CONTAINER_SIZE / widthInches, CONTAINER_SIZE / heightInches)
  const stageWidth = widthInches * scale
  const stageHeight = heightInches * scale
  const fill = fields['Wall Color']?.trim() || '#e4e4e7'

  return (
    <div className="wall-card">
      <div className="wall-card__canvas" style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE }}>
        <Stage width={stageWidth} height={stageHeight}>
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
            <Text text={name} x={8} y={8} fontSize={13} fill="#18181b" />
          </Layer>
        </Stage>
      </div>
      <div className="wall-card__caption">
        <strong>{name}</strong>
        <span>
          {fields.Height} × {fields.Width} {fields['Unit of Measure'] ?? ''}
        </span>
      </div>
    </div>
  )
}
