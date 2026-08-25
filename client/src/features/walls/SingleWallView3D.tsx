import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { WallScene3D } from '@/features/walls/WallScene3D'
import { FullscreenButton } from '@/features/walls/FullscreenButton'
import { useFullscreenToggle } from '@/hooks/useFullscreenToggle'
import { wallDimensionToInches } from '@/features/walls/wallScale'
import type { PlacedItem } from '@/features/walls/PlacedItem'
import type { Wall } from '@shared'

const INCHES_PER_FOOT = 12

interface SingleWallView3DProps {
  wall: Wall
  placedItems: PlacedItem[]
  onMoveItem: (assignmentId: string, xInches: number, yInches: number) => Promise<unknown> | void
  onOpenDetailItem: (assignmentId: string) => void
}

// A standalone 3D view of one wall — no booth box, no surface assignment, no
// booth dimensions required. Exists for walls that aren't really going into a
// booth (e.g. a staging wall used just to check an item's size/placement) as
// well as for quickly previewing a single wall without leaving its context.
export function SingleWallView3D({ wall, placedItems, onMoveItem, onOpenDetailItem }: SingleWallView3DProps) {
  const [orbitEnabled, setOrbitEnabled] = useState(true)
  const { containerRef, isFullscreen, toggleFullscreen } = useFullscreenToggle<HTMLDivElement>()

  const widthInches = wall.fields.Width
    ? wallDimensionToInches(wall.fields.Width, wall.fields['Unit of Measure'])
    : undefined
  const heightInches = wall.fields.Height
    ? wallDimensionToInches(wall.fields.Height, wall.fields['Unit of Measure'])
    : undefined

  if (!widthInches || !heightInches) {
    return <p>Set this wall&apos;s width and height to see it in 3D.</p>
  }

  const widthFt = widthInches / INCHES_PER_FOOT
  const heightFt = heightInches / INCHES_PER_FOOT
  // Far enough back to fit the whole wall in frame regardless of its aspect ratio.
  const cameraDistance = Math.max(widthFt, heightFt) * 1.3

  return (
    <div className="booth-3d-canvas-wrapper" ref={containerRef}>
      <FullscreenButton isFullscreen={isFullscreen} onToggle={toggleFullscreen} />
      <Canvas camera={{ position: [0, 0, cameraDistance], fov: 50 }}>
        <WallScene3D
          wall={wall}
          placedItems={placedItems}
          interactive
          onMoveItem={onMoveItem}
          onDragActiveChange={(active) => setOrbitEnabled(!active)}
          onOpenDetailItem={onOpenDetailItem}
        />
        <OrbitControls enabled={orbitEnabled} />
      </Canvas>
    </div>
  )
}
