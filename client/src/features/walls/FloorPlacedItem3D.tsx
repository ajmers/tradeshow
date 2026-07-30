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
const ROTATION_HANDLE_COLOR = '#4338ca'
// How far past the item's own footprint the rotation handle sits.
const ROTATION_HANDLE_OFFSET_FT = 0.4
// Within this many degrees of a 90° multiple, the drag snaps exactly to it.
const ROTATION_SNAP_THRESHOLD_DEGREES = 8

function snapToNearest90(degrees: number): number {
  const normalized = ((degrees % 360) + 360) % 360
  const nearest = Math.round(normalized / 90) * 90
  const diff = Math.min(Math.abs(normalized - nearest), 360 - Math.abs(normalized - nearest))
  return diff <= ROTATION_SNAP_THRESHOLD_DEGREES ? nearest % 360 : normalized
}

interface FloorPlacedItem3DProps {
  placement: FloorPlacement
  item: Item
  boothWidthFt: number
  boothDepthFt: number
  isSold?: boolean
  onMove?: (placementId: string, xInches: number, yInches: number) => Promise<unknown> | void
  onRotate?: (placementId: string, rotationDegrees: number) => Promise<unknown> | void
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
  onRotate,
  onDragActiveChange,
  onOpenDetail,
}: FloorPlacedItem3DProps) {
  const { texture, materialRef, backMaterialRef } = useItemTexture3D(item)

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

  // Same "keep the optimistic value until the mutation really lands" approach as
  // position dragging, for the same reason — otherwise rotation would snap back to
  // the old angle and then jump again once the refetch completes.
  const [dragRotationDegrees, setDragRotationDegrees] = useState<number | null>(null)
  const isRotatingRef = useRef(false)

  const xInches = dragPosition?.xInches ?? placement.fields['X Position'] ?? 0
  const yInches = dragPosition?.yInches ?? placement.fields['Y Position'] ?? 0
  const rotationDegrees = dragRotationDegrees ?? placement.fields['Rotation Angle'] ?? 0

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

  async function handlePointerUp(event: ThreeEvent<PointerEvent>) {
    if (!isDraggingRef.current) {
      return
    }
    event.stopPropagation()
    ;(event.target as Element).releasePointerCapture(event.pointerId)
    isDraggingRef.current = false
    onDragActiveChange?.(false)
    if (didDragRef.current && dragPosition) {
      // Keep showing the dragged-to position until the mutation (and the query
      // invalidation it triggers) actually lands — clearing it right away would
      // briefly fall back to the stale pre-drag position and then jump again once
      // the refetch completes a moment later.
      try {
        await onMove?.(placement.id, dragPosition.xInches, dragPosition.yInches)
      } finally {
        setDragPosition(null)
      }
    } else {
      if (!didDragRef.current) {
        onOpenDetail?.()
      }
      setDragPosition(null)
    }
  }

  function handleRotateHandlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation()
    isRotatingRef.current = true
    ;(event.target as Element).setPointerCapture(event.pointerId)
    onDragActiveChange?.(true)
  }

  function handleRotateHandlePointerMove(event: ThreeEvent<PointerEvent>) {
    if (!isRotatingRef.current) {
      return
    }
    event.stopPropagation()
    const worldPoint = new THREE.Vector3()
    if (!event.ray.intersectPlane(floorPlane, worldPoint)) {
      return
    }
    // Angle (in the same world-Y-rotation convention as `rotationY` above) from the
    // item's own center out to the pointer's position on the floor.
    const theta = Math.atan2(worldPoint.x - x, worldPoint.z - z)
    const degrees = (-theta * 180) / Math.PI
    setDragRotationDegrees(snapToNearest90(degrees))
  }

  async function handleRotateHandlePointerUp(event: ThreeEvent<PointerEvent>) {
    if (!isRotatingRef.current) {
      return
    }
    event.stopPropagation()
    ;(event.target as Element).releasePointerCapture(event.pointerId)
    isRotatingRef.current = false
    onDragActiveChange?.(false)
    if (dragRotationDegrees !== null) {
      try {
        await onRotate?.(placement.id, dragRotationDegrees)
      } finally {
        setDragRotationDegrees(null)
      }
    }
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

  // Sits like a compass needle just past the item's front edge, in the direction the
  // item currently faces, so dragging it around the item sets that facing direction.
  const rotationHandleRadiusFt = Math.max(widthFt, depthFt) / 2 + ROTATION_HANDLE_OFFSET_FT
  const rotationHandlePosition: [number, number, number] = [
    x + rotationHandleRadiusFt * Math.sin(rotationY),
    heightFt + 0.25,
    z + rotationHandleRadiusFt * Math.cos(rotationY),
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
        {/* Bottom face: hidden rather than colored — it sits right at floor level and
            z-fights with the floor plane if drawn at all. */}
        <meshStandardMaterial attach="material-3" visible={false} />
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
          transparent
          alphaTest={0.1}
        />
        {/* Reuses the front photo as an alphaMap (not map) so this face stays a plain
            color but is cut out to match the photo's silhouette — otherwise a
            transparent part of the photo just reveals this opaque face sitting right
            behind it instead of letting you see through the item entirely. */}
        <meshBasicMaterial
          ref={backMaterialRef}
          attach="material-5"
          color={BOX_SIDE_COLOR}
          alphaMap={texture ?? undefined}
          side={THREE.DoubleSide}
          transparent
          alphaTest={0.1}
        />
      </mesh>
      {isSold && (
        <SoldBadge3D
          position={badgePosition}
          rotation={[0, rotationY, 0]}
          width={badgeWidthFt}
          height={badgeHeightFt}
        />
      )}
      <mesh
        position={rotationHandlePosition}
        onPointerDown={handleRotateHandlePointerDown}
        onPointerMove={handleRotateHandlePointerMove}
        onPointerUp={handleRotateHandlePointerUp}
      >
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={ROTATION_HANDLE_COLOR} toneMapped={false} />
      </mesh>
    </>
  )
}
