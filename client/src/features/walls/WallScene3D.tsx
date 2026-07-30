import * as THREE from 'three'
import type { Wall } from '@shared'
import { wallDimensionToInches } from '@/features/walls/wallScale'
import { PlacedItem3D } from '@/features/walls/PlacedItem3D'
import type { PlacedItem } from '@/features/walls/PlacedItem'

const INCHES_PER_FOOT = 12

interface WallScene3DProps {
  wall: Wall
  placedItems: PlacedItem[]
  hideFloor?: boolean
  hideLights?: boolean
  interactive?: boolean
  onMoveItem?: (assignmentId: string, xInches: number, yInches: number) => void
  onDragActiveChange?: (active: boolean) => void
  onOpenDetailItem?: (assignmentId: string) => void
}

export function WallScene3D({
  wall,
  placedItems,
  hideFloor,
  hideLights,
  interactive,
  onMoveItem,
  onDragActiveChange,
  onOpenDetailItem,
}: WallScene3DProps) {
  const widthInches = wall.fields.Width
    ? wallDimensionToInches(wall.fields.Width, wall.fields['Unit of Measure'])
    : undefined
  const heightInches = wall.fields.Height
    ? wallDimensionToInches(wall.fields.Height, wall.fields['Unit of Measure'])
    : undefined

  if (!widthInches || !heightInches) {
    return null
  }

  const widthFt = widthInches / INCHES_PER_FOOT
  const heightFt = heightInches / INCHES_PER_FOOT
  const wallColor = wall.fields['Wall Color']?.trim() || '#e4e4e7'

  return (
    <>
      {!hideLights && (
        <>
          <ambientLight intensity={0.7} />
          <directionalLight position={[widthFt, heightFt, widthFt]} intensity={0.9} />
          <directionalLight position={[-widthFt, heightFt * 0.5, widthFt * 0.5]} intensity={0.3} />
        </>
      )}

      {/* Wall */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[widthFt, heightFt]} />
        <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
      </mesh>

      {/* Floor, just for spatial context */}
      {!hideFloor && (
        <mesh position={[0, -heightFt / 2, widthFt / 3]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[widthFt * 2.5, widthFt * 1.5]} />
          <meshStandardMaterial color="#d4d4d8" side={THREE.DoubleSide} />
        </mesh>
      )}

      {placedItems.map(({ assignment, item }) => (
        <PlacedItem3D
          key={assignment.id}
          assignment={assignment}
          item={item}
          wallWidthFt={widthFt}
          wallHeightFt={heightFt}
          interactive={interactive}
          onMove={onMoveItem}
          onDragActiveChange={onDragActiveChange}
          onOpenDetail={onOpenDetailItem ? () => onOpenDetailItem(assignment.id) : undefined}
        />
      ))}
    </>
  )
}
