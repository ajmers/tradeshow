import { useRef, useState } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { Item, WallAssignment } from '@shared'
import { itemFootprintInches, toInches } from '@/features/walls/wallScale'
import { useItemTexture3D } from '@/features/walls/useItemTexture3D'
import { SoldBadge3D } from '@/features/walls/SoldBadge3D'

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
  isSold?: boolean
  /** Only the selected wall's items are draggable, so items on other surfaces don't
   *  intercept clicks meant for orbiting the camera. */
  interactive?: boolean
  onMove?: (assignmentId: string, xInches: number, yInches: number) => Promise<unknown> | void
  onDragActiveChange?: (active: boolean) => void
  /** A pointer down+up with no meaningful movement in between is a click, not a drag. */
  onOpenDetail?: () => void
}

interface DragState {
  plane: THREE.Plane
  parent: THREE.Object3D
}

export function PlacedItem3D({
  assignment,
  item,
  wallWidthFt,
  wallHeightFt,
  isSold,
  interactive,
  onMove,
  onDragActiveChange,
  onOpenDetail,
}: PlacedItem3DProps) {
  const {
    texture,
    materialRef: boxFrontMaterialRef,
    backMaterialRef: boxBackMaterialRef,
  } = useItemTexture3D(item)

  const { width: widthInches, height: heightInches } = itemFootprintInches(item.fields)
  const widthFt = widthInches / INCHES_PER_FOOT
  const heightFt = heightInches / INCHES_PER_FOOT
  const depthInches = item.fields.Depth
    ? toInches(item.fields.Depth, item.fields['Unit of Measure'])
    : 0
  const depthFt = depthInches / INCHES_PER_FOOT

  // While dragging, position comes from local pointer tracking instead of the
  // (stale, until the mutation round-trips) assignment fields, so the item follows
  // the cursor smoothly. Cleared once the drag ends and the mutation is fired.
  const [dragPosition, setDragPosition] = useState<{ xInches: number; yInches: number } | null>(
    null,
  )
  const dragStateRef = useRef<DragState | null>(null)
  const didDragRef = useRef(false)

  const xInches = dragPosition?.xInches ?? assignment.fields['X Position'] ?? 0
  const yInches = dragPosition?.yInches ?? assignment.fields['Y Position'] ?? 0
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

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    if (!interactive) {
      return
    }
    event.stopPropagation()
    const mesh = event.eventObject
    const parent = mesh.parent
    if (!parent) {
      return
    }
    const worldPosition = new THREE.Vector3()
    mesh.getWorldPosition(worldPosition)
    const worldQuaternion = new THREE.Quaternion()
    mesh.getWorldQuaternion(worldQuaternion)
    const worldNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(worldQuaternion)
    dragStateRef.current = {
      plane: new THREE.Plane().setFromNormalAndCoplanarPoint(worldNormal, worldPosition),
      parent,
    }
    didDragRef.current = false
    ;(event.target as Element).setPointerCapture(event.pointerId)
    onDragActiveChange?.(true)
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    const dragState = dragStateRef.current
    if (!dragState) {
      return
    }
    event.stopPropagation()
    const worldPoint = new THREE.Vector3()
    if (!event.ray.intersectPlane(dragState.plane, worldPoint)) {
      return
    }
    const local = dragState.parent.worldToLocal(worldPoint)
    const newCenterXInches = (local.x + wallWidthFt / 2) * INCHES_PER_FOOT
    const newCenterYInches = (wallHeightFt / 2 - local.y) * INCHES_PER_FOOT
    didDragRef.current = true
    setDragPosition({
      xInches: newCenterXInches - widthInches / 2,
      yInches: newCenterYInches - heightInches / 2,
    })
  }

  async function handlePointerUp(event: ThreeEvent<PointerEvent>) {
    if (!dragStateRef.current) {
      return
    }
    event.stopPropagation()
    ;(event.target as Element).releasePointerCapture(event.pointerId)
    dragStateRef.current = null
    onDragActiveChange?.(false)
    if (didDragRef.current && dragPosition) {
      // Keep showing the dragged-to position until the mutation (and the query
      // invalidation it triggers) actually lands — clearing it right away would
      // briefly fall back to the stale pre-drag position and then jump again once
      // the refetch completes a moment later.
      try {
        await onMove?.(assignment.id, dragPosition.xInches, dragPosition.yInches)
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

  const dragHandlers = interactive
    ? {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
      }
    : {}

  // Same top-right-corner placement as the 2D canvas's badge, clamped to the item's
  // own size, then rotated by the same amount as the item so it stays in that corner
  // regardless of rotation.
  const badgeWidthFt = Math.min(0.6, widthFt)
  const badgeHeightFt = Math.min(0.25, heightFt)
  const cos = Math.cos(rotationZ)
  const sin = Math.sin(rotationZ)
  const localOffsetX = widthFt / 2 - badgeWidthFt / 2
  const localOffsetY = heightFt / 2 - badgeHeightFt / 2
  const badgePosition: [number, number, number] = [
    x + localOffsetX * cos - localOffsetY * sin,
    y + localOffsetX * sin + localOffsetY * cos,
    Z_OFFSET_FT + depthFt + 0.02,
  ]
  const soldBadge = isSold && (
    <SoldBadge3D
      position={badgePosition}
      rotation={[0, 0, rotationZ]}
      width={badgeWidthFt}
      height={badgeHeightFt}
    />
  )

  if (depthFt > 0) {
    // A real 3D box: its back face rests flush against the wall (plus the same
    // small offset used for flat items) and it extrudes outward by its own depth,
    // rather than being centered on the wall surface. Box face order is
    // [+x, -x, +y, -y, +z, -z]; +z is the face pointing away from the wall, into
    // the room, so that's the only one that gets the item's photo.
    return (
      <>
        <mesh position={[x, y, Z_OFFSET_FT + depthFt / 2]} rotation={[0, 0, rotationZ]} {...dragHandlers}>
          <boxGeometry args={[widthFt, heightFt, depthFt]} />
          <meshStandardMaterial attach="material-0" color={BOX_SIDE_COLOR} side={THREE.DoubleSide} />
          <meshStandardMaterial attach="material-1" color={BOX_SIDE_COLOR} side={THREE.DoubleSide} />
          <meshStandardMaterial attach="material-2" color={BOX_SIDE_COLOR} side={THREE.DoubleSide} />
          {/* Bottom face: hidden rather than colored. For floor items this sits right
              at floor level and z-fights with the floor plane if drawn at all. */}
          <meshStandardMaterial attach="material-3" visible={false} />
          {/* Unlit, like the flat-plane case below — meshStandardMaterial would need
              scene lighting to render the photo at full brightness, making it look dim
              or washed-out depending on the light angle. Kept as a single material
              (only `map`/`color` change) rather than swapping between mesh*Material
              types when the texture loads, since switching element types here would
              briefly leave this slot of the material array empty, crashing the
              raycaster if a pointer event lands in that instant. */}
          <meshBasicMaterial
            ref={boxFrontMaterialRef}
            attach="material-4"
            map={texture ?? undefined}
            color={texture ? '#ffffff' : '#fafafa'}
            toneMapped={false}
            side={THREE.DoubleSide}
            transparent
            alphaTest={0.1}
          />
          {/* Reuses the front photo as an alphaMap (not map) so this face stays a
              plain color but is cut out to match the photo's silhouette — otherwise a
              transparent part of the photo just reveals this opaque face sitting
              right behind it instead of letting you see through the item entirely. */}
          <meshBasicMaterial
            ref={boxBackMaterialRef}
            attach="material-5"
            color={BOX_SIDE_COLOR}
            alphaMap={texture ?? undefined}
            side={THREE.DoubleSide}
            transparent
            alphaTest={0.1}
          />
        </mesh>
        {soldBadge}
      </>
    )
  }

  return (
    <>
      <mesh position={[x, y, Z_OFFSET_FT]} rotation={[0, 0, rotationZ]} {...dragHandlers}>
        <planeGeometry args={[widthFt, heightFt]} />
        {texture ? (
          <meshBasicMaterial
            map={texture}
            toneMapped={false}
            side={THREE.DoubleSide}
            transparent
            alphaTest={0.1}
          />
        ) : (
          <meshStandardMaterial color="#fafafa" side={THREE.DoubleSide} />
        )}
      </mesh>
      {soldBadge}
    </>
  )
}
