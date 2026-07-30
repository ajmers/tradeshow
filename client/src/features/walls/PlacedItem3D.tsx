import { useMemo } from 'react'
import useImage from 'use-image'
import * as THREE from 'three'
import type { Item, WallAssignment } from '@shared'
import { itemFootprintInches, toInches } from '@/features/walls/wallScale'
import { getItemImageUrl } from '@/features/items/getItemImageUrl'

const INCHES_PER_FOOT = 12
// Sits just in front of the wall plane so item textures don't z-fight with it.
const Z_OFFSET_FT = 0.05
// Sides/top/bottom/back of a 3D item — there's no photo for those faces, just a
// plain neutral tone standing in for a canvas edge or frame depth.
const BOX_SIDE_COLOR = '#a1a1aa'

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
  const depthInches = item.fields.Depth
    ? toInches(item.fields.Depth, item.fields['Unit of Measure'])
    : 0
  const depthFt = depthInches / INCHES_PER_FOOT

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

  if (depthFt > 0) {
    // A real 3D box: its back face rests flush against the wall (plus the same
    // small offset used for flat items) and it extrudes outward by its own depth,
    // rather than being centered on the wall surface. Box face order is
    // [+x, -x, +y, -y, +z, -z]; +z is the face pointing away from the wall, into
    // the room, so that's the only one that gets the item's photo.
    return (
      <mesh position={[x, y, Z_OFFSET_FT + depthFt / 2]} rotation={[0, 0, rotationZ]}>
        <boxGeometry args={[widthFt, heightFt, depthFt]} />
        <meshStandardMaterial attach="material-0" color={BOX_SIDE_COLOR} side={THREE.DoubleSide} />
        <meshStandardMaterial attach="material-1" color={BOX_SIDE_COLOR} side={THREE.DoubleSide} />
        <meshStandardMaterial attach="material-2" color={BOX_SIDE_COLOR} side={THREE.DoubleSide} />
        <meshStandardMaterial attach="material-3" color={BOX_SIDE_COLOR} side={THREE.DoubleSide} />
        {/* Kept as a single material (only `map`/`color` change) rather than swapping
            between mesh*Material types when the texture loads — switching element
            types here would briefly leave this slot of the material array empty,
            which crashes the raycaster if a pointer event lands in that instant. */}
        <meshStandardMaterial
          attach="material-4"
          map={texture ?? undefined}
          color={texture ? '#ffffff' : '#fafafa'}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
        <meshStandardMaterial attach="material-5" color={BOX_SIDE_COLOR} side={THREE.DoubleSide} />
      </mesh>
    )
  }

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
