import * as THREE from 'three'
import type { Wall } from '@shared'
import { wallDimensionToInches } from '@/features/walls/wallScale'
import { WallScene3D } from '@/features/walls/WallScene3D'
import type { PlacedItem } from '@/features/walls/PlacedItem'

const INCHES_PER_FOOT = 12

export type BoothSurfaceName = 'Front' | 'Back' | 'Left' | 'Right'

export interface BoothSurfaceOccupant {
  wall: Wall
  placedItems: PlacedItem[]
}

interface BoothScene3DProps {
  widthFt: number
  depthFt: number
  heightFt: number
  surfaces: Record<BoothSurfaceName, BoothSurfaceOccupant | null>
  selectedSurface: BoothSurfaceName | null
  onSelectSurface: (surface: BoothSurfaceName) => void
}

// Horizontal position + rotation for each of the 4 vertical faces of the booth box,
// in a Y-up world centered on the floor's middle (x=0, z=0, floor at y=0). Front/Back
// faces are widthFt wide; Left/Right faces are depthFt wide. The Front face is
// rotated 180° about Y so a wall's own left/right reads correctly when viewed
// from inside the booth, facing the same way as someone walking in. Y is handled
// separately per-surface below, since it depends on the occupying wall's own height.
const FACE_TRANSFORMS: Record<
  BoothSurfaceName,
  (widthFt: number, depthFt: number) => { x: number; z: number; rotation: [number, number, number]; faceWidthFt: number }
> = {
  Back: (widthFt, depthFt) => ({
    x: 0,
    z: -depthFt / 2,
    rotation: [0, 0, 0],
    faceWidthFt: widthFt,
  }),
  Front: (widthFt, depthFt) => ({
    x: 0,
    z: depthFt / 2,
    rotation: [0, Math.PI, 0],
    faceWidthFt: widthFt,
  }),
  Left: (widthFt, depthFt) => ({
    x: -widthFt / 2,
    z: 0,
    rotation: [0, Math.PI / 2, 0],
    faceWidthFt: depthFt,
  }),
  Right: (widthFt, depthFt) => ({
    x: widthFt / 2,
    z: 0,
    rotation: [0, -Math.PI / 2, 0],
    faceWidthFt: depthFt,
  }),
}

const SURFACE_NAMES: BoothSurfaceName[] = ['Front', 'Back', 'Left', 'Right']

export function BoothScene3D({
  widthFt,
  depthFt,
  heightFt,
  surfaces,
  selectedSurface,
  onSelectSurface,
}: BoothScene3DProps) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[widthFt, heightFt * 1.5, depthFt]} intensity={0.9} />
      <directionalLight position={[-widthFt, heightFt * 0.8, -depthFt * 0.5]} intensity={0.3} />

      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[widthFt, depthFt]} />
        <meshStandardMaterial color="#d4d4d8" side={THREE.DoubleSide} />
      </mesh>

      {SURFACE_NAMES.map((name) => {
        const { x, z, rotation, faceWidthFt } = FACE_TRANSFORMS[name](widthFt, depthFt)
        const occupant = surfaces[name]
        const isSelected = selectedSurface === name

        // WallScene3D draws its wall plane centered on its own local origin (half
        // above, half below y=0). Bottom-align it to the booth floor by lifting
        // that origin to half the WALL's own height — not the booth's — so real
        // walls taller or shorter than the booth still meet the floor exactly
        // instead of poking through it or floating above it. The open placeholder
        // has no real wall, so it just spans the full booth height instead.
        let planeHeightFt = heightFt
        if (occupant) {
          const wallHeightInches = occupant.wall.fields.Height
            ? wallDimensionToInches(occupant.wall.fields.Height, occupant.wall.fields['Unit of Measure'])
            : undefined
          planeHeightFt = wallHeightInches ? wallHeightInches / INCHES_PER_FOOT : heightFt
        }
        const position: [number, number, number] = [x, planeHeightFt / 2, z]

        const handleClick = (event: { stopPropagation: () => void }) => {
          event.stopPropagation()
          onSelectSurface(name)
        }

        return (
          <group key={name} position={position} rotation={rotation}>
            {occupant ? (
              <group onClick={handleClick}>
                <WallScene3D wall={occupant.wall} placedItems={occupant.placedItems} hideFloor hideLights />
              </group>
            ) : (
              <mesh onClick={handleClick}>
                <planeGeometry args={[faceWidthFt, planeHeightFt]} />
                <meshStandardMaterial
                  color={isSelected ? '#a5b4fc' : '#e5e7eb'}
                  opacity={0.35}
                  transparent
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
            {isSelected && (
              <lineSegments>
                <edgesGeometry args={[new THREE.PlaneGeometry(faceWidthFt, planeHeightFt)]} />
                <lineBasicMaterial color="#4338ca" />
              </lineSegments>
            )}
          </group>
        )
      })}
    </>
  )
}
