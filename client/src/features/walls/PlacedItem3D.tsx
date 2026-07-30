import { useMemo } from 'react'
import useImage from 'use-image'
import * as THREE from 'three'
import type { Item, WallAssignment } from '@shared'
import { itemFootprintInches } from '@/features/walls/wallScale'
import { getItemImageUrl } from '@/features/items/getItemImageUrl'

const INCHES_PER_FOOT = 12
// Sits just in front of the wall plane so item textures don't z-fight with it.
const Z_OFFSET_FT = 0.05

interface PlacedItem3DProps {
  assignment: WallAssignment
  item: Item
  wallWidthFt: number
  wallHeightFt: number
}

export function PlacedItem3D({ assignment, item, wallWidthFt, wallHeightFt }: PlacedItem3DProps) {
  const imageUrl = getItemImageUrl(item)
  const [image] = useImage(imageUrl ?? '', 'anonymous')

  const texture = useMemo(() => {
    if (!image) {
      return null
    }
    const t = new THREE.Texture(image)
    t.colorSpace = THREE.SRGBColorSpace
    t.needsUpdate = true
    return t
  }, [image])

  const { width: widthInches, height: heightInches } = itemFootprintInches(item.fields)
  const widthFt = widthInches / INCHES_PER_FOOT
  const heightFt = heightInches / INCHES_PER_FOOT

  const xInches = assignment.fields['X Position'] ?? 0
  const yInches = assignment.fields['Y Position'] ?? 0
  const rotationDegrees = assignment.fields['Rotation Angle'] ?? 0

  // Same top-left + center-of-item convention as the 2D canvas (PlacedItemNode),
  // just re-centered on the wall's own center and flipped from screen-down-Y to
  // world-up-Y. Rotation direction flips along with it: a clockwise 2D rotation
  // (Y down) reads as counter-clockwise once Y points up, so it's negated here to
  // keep the same visual result as the 2D editor.
  const centerXInches = xInches + widthInches / 2
  const centerYInches = yInches + heightInches / 2
  const x = centerXInches / INCHES_PER_FOOT - wallWidthFt / 2
  const y = wallHeightFt / 2 - centerYInches / INCHES_PER_FOOT
  const rotationZ = -(rotationDegrees * Math.PI) / 180

  return (
    <mesh position={[x, y, Z_OFFSET_FT]} rotation={[0, 0, rotationZ]}>
      <planeGeometry args={[widthFt, heightFt]} />
      {texture ? (
        <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} />
      ) : (
        <meshStandardMaterial color="#fafafa" side={THREE.DoubleSide} />
      )}
    </mesh>
  )
}
