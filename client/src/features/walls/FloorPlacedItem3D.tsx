import { useRef, useState } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { FloorPlacement, Item } from '@shared'
import { itemFloorFootprintInches } from '@/features/walls/wallScale'
import { useItemTexture3D } from '@/features/walls/useItemTexture3D'
import { SoldBadge3D } from '@/features/walls/SoldBadge3D'

const INCHES_PER_FOOT = 12
// Sides/top/bottom/back of a 3D item — there's no photo for those faces, just a
// plain neutral tone standing in for a canvas edge or frame depth.
const BOX_SIDE_COLOR = '#a1a1aa'

interface FloorPlacedItem3DProps {
  placement: FloorPlacement
  item: Item
  boothWidthFt: number
  boothDepthFt: number
  isSold?: boolean
  onMove?: (placementId: string, xInches: number, yInches: number) => void
  onDragActiveChange?: (active: boolean) => void
  /** A pointer down+up with no meaningful movement in between is a click, not a drag. */
  onOpenDetail?: () => void
}

export function FloorPlacedItem3D({
  placement,
  item,
  boothWidthFt,
  boothDepthFt,
  isSold,
  onMove,
  onDragActiveChange,
  onOpenDetail,
}: FloorPlacedItem3DProps) {
  const { texture, materialRef } = useItemTexture3D(item)

  const {
    width: widthInches,
    height: heightInches,
    depth: depthInches,
  } = itemFloorFootprintInches(item.fields)
  const widthFt = widthInches / INCHES_PER_FOOT
  const heightFt = heightInches / INCHES_PER_FOOT
  const depthFt = depthInches / INCHES_PER_FOOT

  // While dragging, position comes from local pointer tracking instead of the
  // (stale, until the mutation round-trips) placement fields, so the item follows
  // the cursor smoothly. Cleared once the drag ends and the mutation is fired.
  const [dragPosition, setDragPosition] = useState<{ xInches: number; yInches: number } | null>(
    null,
  )
  const isDraggingRef = useRef(false)
  const didDragRef = useRef(false)

  const xInches = dragPosition?.xInches ?? placement.fields['X Position'] ?? 0
  const yInches = dragPosition?.yInches ?? placement.fields['Y Position'] ?? 0
  const rotationDegrees = placement.fields['Rotation Angle'] ?? 0

  // Floor-plan convention: X/Y Position is the item's unrotated top-left corner in a
  // top-down view (X = booth width axis, Y = booth depth axis), matching how Wall
  // Assignments store position for their own 2D plane. World Z is the depth axis.
  const centerXInches = xInches + widthInches / 2
  const centerZInches = yInches + depthInches / 2
  const x = centerXInches / INCHES_PER_FOOT - boothWidthFt / 2
  const z = centerZInches / INCHES_PER_FOOT - boothDepthFt / 2
  const rotationY = -(rotationDegrees * Math.PI) / 180

  // Floor items sit directly in the scene's own top-level frame (siblings of the
  // floor mesh), so the drag ray can be intersected against the world-space floor
  // plane (y = 0) directly — no parent transform to invert, unlike wall items.
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation()
    isDraggingRef.current = true
    didDragRef.current = false
    ;(event.target as Element).setPointerCapture(event.pointerId)
    onDragActiveChange?.(true)
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    if (!isDraggingRef.current) {
      return
    }
    event.stopPropagation()
    const worldPoint = new THREE.Vector3()
    if (!event.ray.intersectPlane(floorPlane, worldPoint)) {
      return
    }
    const newCenterXInches = (worldPoint.x + boothWidthFt / 2) * INCHES_PER_FOOT
    const newCenterZInches = (worldPoint.z + boothDepthFt / 2) * INCHES_PER_FOOT
    didDragRef.current = true
    setDragPosition({
      xInches: newCenterXInches - widthInches / 2,
      yInches: newCenterZInches - depthInches / 2,
    })
  }

  function handlePointerUp(event: ThreeEvent<PointerEvent>) {
    if (!isDraggingRef.current) {
      return
    }
    event.stopPropagation()
    ;(event.target as Element).releasePointerCapture(event.pointerId)
    isDraggingRef.current = false
    onDragActiveChange?.(false)
    if (didDragRef.current && dragPosition) {
      onMove?.(placement.id, dragPosition.xInches, dragPosition.yInches)
    } else if (!didDragRef.current) {
      onOpenDetail?.()
    }
    setDragPosition(null)
  }

  // Same top-right-corner placement as wall items, but on the front (+Z) face of the
  // box in its own unrotated local frame, then rotated around Y to match the item.
  const badgeWidthFt = Math.min(0.6, widthFt)
  const badgeHeightFt = Math.min(0.25, heightFt)
  const localOffsetX = widthFt / 2 - badgeWidthFt / 2
  const localOffsetY = heightFt / 2 - badgeHeightFt / 2
  const localOffsetZ = depthFt / 2 + 0.02
  const cos = Math.cos(rotationY)
  const sin = Math.sin(rotationY)
  const badgePosition: [number, number, number] = [
    x + localOffsetX * cos + localOffsetZ * sin,
    heightFt / 2 + localOffsetY,
    z - localOffsetX * sin + localOffsetZ * cos,
  ]

  return (
    <>
      <mesh
        position={[x, heightFt / 2, z]}
        rotation={[0, rotationY, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <boxGeometry args={[widthFt, heightFt, depthFt]} />
        <meshStandardMaterial attach="material-0" color={BOX_SIDE_COLOR} side={THREE.DoubleSide} />
        <meshStandardMaterial attach="material-1" color={BOX_SIDE_COLOR} side={THREE.DoubleSide} />
        <meshStandardMaterial attach="material-2" color={BOX_SIDE_COLOR} side={THREE.DoubleSide} />
        <meshStandardMaterial attach="material-3" color={BOX_SIDE_COLOR} side={THREE.DoubleSide} />
        {/* Unlit so the photo shows at full brightness regardless of scene lighting —
            see useItemTexture3D for why this material stays a single persistent
            instance rather than swapping types when the texture loads. */}
        <meshBasicMaterial
          ref={materialRef}
          attach="material-4"
          map={texture ?? undefined}
          color={texture ? '#ffffff' : '#fafafa'}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
        <meshStandardMaterial attach="material-5" color={BOX_SIDE_COLOR} side={THREE.DoubleSide} />
      </mesh>
      {isSold && (
        <SoldBadge3D
          position={badgePosition}
          rotation={[0, rotationY, 0]}
          width={badgeWidthFt}
          height={badgeHeightFt}
        />
      )}
    </>
  )
}
