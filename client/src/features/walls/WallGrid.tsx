import { Line } from 'react-konva'

const FOOT_INCHES = 12
const HALF_FOOT_INCHES = 6
const FOOT_COLOR = 'rgba(0, 0, 0, 0.35)'
const HALF_FOOT_COLOR = 'rgba(0, 0, 0, 0.15)'

interface WallGridProps {
  widthInches: number
  heightInches: number
  scale: number
}

export function WallGrid({ widthInches, heightInches, scale }: WallGridProps) {
  const stageWidth = widthInches * scale
  const stageHeight = heightInches * scale

  const lines = []

  // Vertical lines, measured from the left edge.
  for (let inches = HALF_FOOT_INCHES; inches < widthInches; inches += HALF_FOOT_INCHES) {
    const isFoot = inches % FOOT_INCHES === 0
    const x = inches * scale
    lines.push(
      <Line
        key={`v-${inches}`}
        points={[x, 0, x, stageHeight]}
        stroke={isFoot ? FOOT_COLOR : HALF_FOOT_COLOR}
        strokeWidth={1}
      />,
    )
  }

  // Horizontal lines, measured up from the floor (any leftover gap lands at the top).
  for (let inches = HALF_FOOT_INCHES; inches < heightInches; inches += HALF_FOOT_INCHES) {
    const isFoot = inches % FOOT_INCHES === 0
    const y = stageHeight - inches * scale
    lines.push(
      <Line
        key={`h-${inches}`}
        points={[0, y, stageWidth, y]}
        stroke={isFoot ? FOOT_COLOR : HALF_FOOT_COLOR}
        strokeWidth={1}
      />,
    )
  }

  return <>{lines}</>
}
