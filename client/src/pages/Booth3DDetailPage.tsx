import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useBooths } from '@/hooks/useBooths'
import { useWalls } from '@/hooks/useWalls'
import { useItems } from '@/hooks/useItems'
import { useWallAssignments } from '@/hooks/useWallAssignments'
import { useSales } from '@/hooks/useSales'
import { useFloorPlacements } from '@/hooks/useFloorPlacements'
import { useUpdateBooth } from '@/hooks/useBoothMutations'
import { useUpdateWall } from '@/hooks/useWallMutations'
import {
  useCreateWallAssignment,
  useUpdateWallAssignment,
  useDeleteWallAssignment,
} from '@/hooks/useWallAssignmentMutations'
import {
  useCreateFloorPlacement,
  useUpdateFloorPlacement,
  useDeleteFloorPlacement,
} from '@/hooks/useFloorPlacementMutations'
import {
  BoothScene3D,
  type BoothSurfaceName,
  type BoothSurfaceOccupant,
  type FloorPlacementWithItem,
} from '@/features/walls/BoothScene3D'
import { AvailableItemsTray } from '@/features/walls/AvailableItemsTray'
import { ItemDetailDialog } from '@/features/walls/ItemDetailDialog'
import { FloorAssignmentCanvas } from '@/features/walls/FloorAssignmentCanvas'
import { findEmptySpot } from '@/features/walls/findEmptySpot'
import { itemFloorFootprintInches, itemFootprintInches, wallDimensionToInches } from '@/features/walls/wallScale'
import type { PlacedItem } from '@/features/walls/PlacedItem'
import type { Wall } from '@shared'

type DetailTarget = { kind: 'wall'; assignmentId: string } | { kind: 'floor'; placementId: string }

const SURFACE_NAMES: BoothSurfaceName[] = ['Front', 'Back', 'Left', 'Right']

interface SuggestedDimensions {
  width?: number
  depth?: number
  height?: number
}

// A rough starting guess so the form isn't blank when a booth already has walls from
// the 2D Booth Planner: the two longest distinct wall widths become the footprint
// (the booth is assumed rectangular), and the tallest wall becomes the height, since
// a booth's walls are typically all the same height anyway.
function suggestBoothDimensions(walls: Wall[]): SuggestedDimensions {
  const widthsFt: number[] = []
  const heightsFt: number[] = []
  for (const wall of walls) {
    if (wall.fields.Width) {
      widthsFt.push(wallDimensionToInches(wall.fields.Width, wall.fields['Unit of Measure']) / 12)
    }
    if (wall.fields.Height) {
      heightsFt.push(wallDimensionToInches(wall.fields.Height, wall.fields['Unit of Measure']) / 12)
    }
  }
  if (widthsFt.length === 0) {
    return {}
  }
  widthsFt.sort((a, b) => b - a)
  const round = (value: number) => Math.round(value * 10) / 10
  return {
    width: round(widthsFt[0]!),
    depth: round(widthsFt[1] ?? widthsFt[0]!),
    height: heightsFt.length > 0 ? round(Math.max(...heightsFt)) : undefined,
  }
}

function BoothDimensionsForm({
  boothId,
  suggested,
  onSaved,
}: {
  boothId: string
  suggested: SuggestedDimensions
  onSaved: (dims: { width: number; depth: number; height: number }) => void
}) {
  const updateBooth = useUpdateBooth()
  const hasSuggestion = suggested.width !== undefined

  return (
    <form
      className="booth-3d-dimensions-form"
      onSubmit={(event) => {
        event.preventDefault()
        const form = event.currentTarget
        const width = Number((form.elements.namedItem('width') as HTMLInputElement).value)
        const depth = Number((form.elements.namedItem('depth') as HTMLInputElement).value)
        const height = Number((form.elements.namedItem('height') as HTMLInputElement).value)
        if (!width || !depth || !height) {
          return
        }
        updateBooth.mutate(
          {
            id: boothId,
            input: { 'Booth Width': width, 'Booth Depth': depth, 'Booth Height': height },
          },
          { onSuccess: () => onSaved({ width, depth, height }) },
        )
      }}
    >
      <h2>Set booth dimensions</h2>
      <p>Enter the booth&apos;s footprint and wall height in feet, then lay out your walls in 3D.</p>
      {hasSuggestion && (
        <p className="booth-3d-panel__hint">
          Suggested from this booth&apos;s existing walls — adjust if needed.
        </p>
      )}
      <div className="booth-3d-dimensions-form__row">
        <label>
          Width (ft)
          <input
            name="width"
            type="number"
            step="any"
            min="0"
            defaultValue={suggested.width ?? ''}
            required
          />
        </label>
        <label>
          Depth (ft)
          <input
            name="depth"
            type="number"
            step="any"
            min="0"
            defaultValue={suggested.depth ?? ''}
            required
          />
        </label>
        <label>
          Height (ft)
          <input
            name="height"
            type="number"
            step="any"
            min="0"
            defaultValue={suggested.height ?? ''}
            required
          />
        </label>
      </div>
      <button type="submit" disabled={updateBooth.isPending}>
        {updateBooth.isPending ? 'Saving…' : 'Save & continue'}
      </button>
    </form>
  )
}

export function Booth3DDetailPage() {
  const { boothId } = useParams<{ boothId: string }>()
  const booths = useBooths()
  const walls = useWalls()
  const items = useItems()
  const wallAssignments = useWallAssignments()
  const sales = useSales()
  const floorPlacements = useFloorPlacements()
  const updateBooth = useUpdateBooth()
  const updateWall = useUpdateWall()
  const createAssignment = useCreateWallAssignment()
  const updateAssignment = useUpdateWallAssignment()
  const deleteAssignment = useDeleteWallAssignment()
  const createFloorPlacement = useCreateFloorPlacement()
  const updateFloorPlacement = useUpdateFloorPlacement()
  const deleteFloorPlacement = useDeleteFloorPlacement()
  const [selectedSurface, setSelectedSurface] = useState<BoothSurfaceName | null>(null)
  const [editingDimensions, setEditingDimensions] = useState(false)
  const [orbitEnabled, setOrbitEnabled] = useState(true)
  const [itemToPlaceOnFloor, setItemToPlaceOnFloor] = useState('')
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null)
  const [viewMode, setViewMode] = useState<'3d' | 'floor2d'>('3d')
  const [selected2DFloorPlacementId, setSelected2DFloorPlacementId] = useState<string | null>(null)

  const isPending =
    booths.isPending ||
    walls.isPending ||
    items.isPending ||
    wallAssignments.isPending ||
    sales.isPending ||
    floorPlacements.isPending
  const firstError =
    booths.error ?? walls.error ?? items.error ?? wallAssignments.error ?? sales.error ?? floorPlacements.error

  if (isPending) {
    return <p>Loading…</p>
  }

  if (firstError) {
    return <p role="alert">Error: {firstError.message}</p>
  }

  const boothsData = booths.data ?? []
  const wallsData = walls.data ?? []
  const itemsData = items.data ?? []
  const wallAssignmentsData = wallAssignments.data ?? []
  const salesData = sales.data ?? []
  const floorPlacementsData = floorPlacements.data ?? []

  const booth = boothsData.find((entry) => entry.id === boothId)

  if (!booth) {
    return (
      <main>
        <Breadcrumb items={[{ label: 'Booth Planner 3D', to: '/booth-planner-3d' }, { label: 'Not found' }]} />
        <p>Booth not found.</p>
      </main>
    )
  }

  const boothRecordId = booth.id
  const boothName = booth.fields['Booth Name'] ?? 'Untitled booth'
  const widthFt = booth.fields['Booth Width']
  const depthFt = booth.fields['Booth Depth']
  const heightFt = booth.fields['Booth Height']
  const hasDimensions = Boolean(widthFt && depthFt && heightFt)

  const boothWallIds = new Set(booth.fields.Walls ?? [])
  const boothWalls = wallsData.filter((wall) => boothWallIds.has(wall.id))
  const soldItemIds = new Set(salesData.flatMap((sale) => sale.fields['Items (Sale History Link)'] ?? []))

  // The booth's own saved dimensions win when re-editing; a fresh guess from its
  // existing walls only fills in whichever of those was never set.
  const wallSuggestedDimensions = suggestBoothDimensions(boothWalls)
  const suggestedDimensions: SuggestedDimensions = {
    width: widthFt ?? wallSuggestedDimensions.width,
    depth: depthFt ?? wallSuggestedDimensions.depth,
    height: heightFt ?? wallSuggestedDimensions.height,
  }

  function placedItemsForWall(wallId: string): PlacedItem[] {
    return wallAssignmentsData
      .filter((assignment) => assignment.fields.Wall?.[0] === wallId)
      .map((assignment) => {
        const item = itemsData.find((entry) => entry.id === assignment.fields.Painting?.[0])
        return item ? { assignment, item, isSold: soldItemIds.has(item.id) } : null
      })
      .filter((entry): entry is PlacedItem => entry !== null)
  }

  const surfaces = SURFACE_NAMES.reduce(
    (acc, name) => {
      const wall = boothWalls.find((entry) => entry.fields['Booth Surface'] === name)
      acc[name] = wall ? { wall, placedItems: placedItemsForWall(wall.id) } : null
      return acc
    },
    {} as Record<BoothSurfaceName, BoothSurfaceOccupant | null>,
  )

  const selectedOccupant = selectedSurface ? surfaces[selectedSurface] : null
  // A wall can only occupy one surface at a time, so the assign dropdown offers
  // walls that are either unassigned or already on the surface being edited.
  const assignableWalls = boothWalls.filter(
    (wall) => !wall.fields['Booth Surface'] || wall.id === selectedOccupant?.wall.id,
  )

  function handleAssignWall(surface: BoothSurfaceName, wallId: string) {
    const currentOccupant = surfaces[surface]
    if (currentOccupant && currentOccupant.wall.id !== wallId) {
      updateWall.mutate({ id: currentOccupant.wall.id, input: { 'Booth Surface': null } })
    }
    if (wallId) {
      updateWall.mutate({ id: wallId, input: { 'Booth Surface': surface } })
    }
  }

  // Clears the booth's dimensions and which surface each wall occupies, so the box
  // and wall-to-surface assignment can be redone from scratch. Items already placed
  // on those walls are untouched — only the surface/dimension bookkeeping resets.
  async function handleResetBooth() {
    setSelectedSurface(null)
    await Promise.all([
      updateBooth.mutateAsync({
        id: boothRecordId,
        input: { 'Booth Width': null, 'Booth Depth': null, 'Booth Height': null },
      }),
      ...boothWalls.map((wall) => updateWall.mutateAsync({ id: wall.id, input: { 'Booth Surface': null } })),
    ])
  }

  const boothFloorPlacements = floorPlacementsData.filter(
    (placement) => placement.fields.Booth?.[0] === boothRecordId,
  )
  const floorPlacementsWithItems: FloorPlacementWithItem[] = boothFloorPlacements
    .map((placement) => {
      const item = itemsData.find((entry) => entry.id === placement.fields.Item?.[0])
      return item ? { placement, item, isSold: soldItemIds.has(item.id) } : null
    })
    .filter((entry): entry is FloorPlacementWithItem => entry !== null)

  // Items already on any wall or the floor in this booth aren't offered again — same
  // "one spot per item within a booth" rule the 2D Wall Detail page uses.
  const placedItemIdsInBooth = new Set([
    ...boothWalls.flatMap((wall) => placedItemsForWall(wall.id)).map((entry) => entry.item.id),
    ...floorPlacementsWithItems.map((entry) => entry.item.id),
  ])
  const availableItems = itemsData.filter((item) => !placedItemIdsInBooth.has(item.id))

  function handleAddItemToSelectedWall(itemId: string) {
    if (!selectedOccupant) {
      return
    }
    const wall = selectedOccupant.wall
    const item = itemsData.find((entry) => entry.id === itemId)
    if (!item) {
      return
    }

    const { width: itemWidthInches, height: itemHeightInches } = itemFootprintInches(item.fields)
    const wallWidthInches = wall.fields.Width
      ? wallDimensionToInches(wall.fields.Width, wall.fields['Unit of Measure'])
      : undefined
    const wallHeightInches = wall.fields.Height
      ? wallDimensionToInches(wall.fields.Height, wall.fields['Unit of Measure'])
      : undefined

    const spot =
      wallWidthInches && wallHeightInches
        ? findEmptySpot(
            wallWidthInches,
            wallHeightInches,
            itemWidthInches,
            itemHeightInches,
            selectedOccupant.placedItems.map(({ assignment, item: placedItem }) => {
              const footprint = itemFootprintInches(placedItem.fields)
              return {
                x: assignment.fields['X Position'] ?? 0,
                y: assignment.fields['Y Position'] ?? 0,
                width: footprint.width,
                height: footprint.height,
                rotationDegrees: assignment.fields['Rotation Angle'] ?? 0,
              }
            }),
          )
        : null

    const count = selectedOccupant.placedItems.length
    const x = spot?.x ?? 1 + (count % 5) * 1.5
    const y = spot?.y ?? 1 + Math.floor(count / 5) * 1.5

    createAssignment.mutate({
      Assignment: `${item.fields.Title ?? 'Item'} on ${wall.fields['Wall Name'] ?? 'wall'}`,
      Wall: [wall.id],
      Painting: [item.id],
      Booth: [boothRecordId],
      'X Position': x,
      'Y Position': y,
      'Rotation Angle': 0,
    })
  }

  function handleMoveItem(assignmentId: string, xInches: number, yInches: number) {
    // Returned (not fire-and-forget) so the dragged item's 3D mesh can keep showing
    // its optimistic position until this — including the query refetch it triggers —
    // actually finishes, instead of snapping back and then jumping again.
    return updateAssignment.mutateAsync({
      id: assignmentId,
      input: { 'X Position': xInches, 'Y Position': yInches },
    })
  }

  // Shared by both the 3D and 2D floor views — given the center point (in
  // booth-relative inches) of a click, drops whichever item is armed for placement
  // there. A plain click with nothing armed does nothing (just orbiting/panning).
  function placeArmedItemAtCenter(centerXInches: number, centerZInches: number) {
    if (!itemToPlaceOnFloor) {
      return
    }
    const item = itemsData.find((entry) => entry.id === itemToPlaceOnFloor)
    if (!item) {
      return
    }
    const footprint = itemFloorFootprintInches(item.fields)
    createFloorPlacement.mutate({
      Placement: `${item.fields.Title ?? 'Item'} on floor`,
      Item: [item.id],
      Booth: [boothRecordId],
      'X Position': centerXInches - footprint.width / 2,
      'Y Position': centerZInches - footprint.depth / 2,
      'Rotation Angle': 0,
    })
    setItemToPlaceOnFloor('')
  }

  function handleFloorClick(xFt: number, zFt: number) {
    if (!widthFt || !depthFt) {
      return
    }
    placeArmedItemAtCenter((xFt + widthFt / 2) * 12, (zFt + depthFt / 2) * 12)
  }

  // The 2D floor view's click coordinates are already booth-relative inches (from the
  // floor rectangle's own top-left corner), so no feet-to-inches/booth-centering
  // conversion is needed the way the 3D view's world coordinates require.
  function handleFloor2DClick(xInches: number, yInches: number) {
    placeArmedItemAtCenter(xInches, yInches)
  }

  function handleMoveFloorItem(placementId: string, xInches: number, yInches: number) {
    return updateFloorPlacement.mutateAsync({
      id: placementId,
      input: { 'X Position': xInches, 'Y Position': yInches },
    })
  }

  function handleRotateFloorItem(placementId: string, rotationDegrees: number) {
    return updateFloorPlacement.mutateAsync({
      id: placementId,
      input: { 'Rotation Angle': rotationDegrees },
    })
  }

  // The 2D canvas's Transformer reports position and rotation together in one
  // gesture (unlike the 3D view's separate drag handle and rotate handle), so this
  // saves both fields in a single mutation.
  function handleFloor2DTransformEnd(
    placementId: string,
    xInches: number,
    yInches: number,
    rotationDegrees: number,
  ) {
    updateFloorPlacement.mutate({
      id: placementId,
      input: { 'X Position': xInches, 'Y Position': yInches, 'Rotation Angle': rotationDegrees },
    })
  }

  // Same two-step pattern as the 2D wall canvas: a first click just selects the item
  // (so the rotate handle shows up and is actually usable); clicking the
  // already-selected item again opens details.
  function handleFloor2DSelect(placementId: string | null) {
    if (placementId && placementId === selected2DFloorPlacementId) {
      setDetailTarget({ kind: 'floor', placementId })
    } else {
      setSelected2DFloorPlacementId(placementId)
    }
  }

  // Items already placed anywhere in the booth (walls or floor), flattened, so the
  // detail dialog can look one up by whichever id opened it.
  const boothPlacedItems = boothWalls.flatMap((wall) => placedItemsForWall(wall.id))

  const detailWallPlacedItem =
    detailTarget?.kind === 'wall'
      ? boothPlacedItems.find((entry) => entry.assignment.id === detailTarget.assignmentId)
      : undefined
  const detailFloorItem =
    detailTarget?.kind === 'floor'
      ? floorPlacementsWithItems.find((entry) => entry.placement.id === detailTarget.placementId)
      : undefined

  return (
    <main>
      <Breadcrumb items={[{ label: 'Booth Planner 3D', to: '/booth-planner-3d' }, { label: boothName }]} />
      <div className="page-toolbar">
        <h1>{boothName} — 3D Layout</h1>
      </div>

      {!hasDimensions || editingDimensions ? (
        <BoothDimensionsForm
          boothId={booth.id}
          suggested={suggestedDimensions}
          onSaved={() => setEditingDimensions(false)}
        />
      ) : (
        <>
          <div className="booth-3d-toolbar">
            <span>
              w: {widthFt}&apos; × d: {depthFt}&apos; × h: {heightFt}&apos;
            </span>
            <button
              type="button"
              className="wall-editor-dimensions__edit-button"
              onClick={() => setEditingDimensions(true)}
              aria-label="Edit dimensions"
              title="Edit dimensions"
            >
              ✎
            </button>
            <button
              type="button"
              onClick={handleResetBooth}
              title="Clears the booth's dimensions and which wall is on which surface, so you can redo the layout. Items on walls and on the floor are not removed."
            >
              Reset booth
            </button>
            <button
              type="button"
              onClick={() => setViewMode((current) => (current === '3d' ? 'floor2d' : '3d'))}
              title="The 2D floor view makes it easier to position and rotate floor items without the 3D perspective getting in the way."
            >
              {viewMode === '3d' ? 'Floor view (2D)' : '3D view'}
            </button>
          </div>

          <div className="booth-3d-layout">
            <div className="booth-3d-canvas-wrapper">
              {viewMode === '3d' ? (
                <Canvas camera={{ position: [widthFt! * 0.9, heightFt! * 1.1, depthFt! * 1.4], fov: 50 }}>
                  <BoothScene3D
                    widthFt={widthFt!}
                    depthFt={depthFt!}
                    heightFt={heightFt!}
                    surfaces={surfaces}
                    selectedSurface={selectedSurface}
                    onSelectSurface={setSelectedSurface}
                    onMoveItem={handleMoveItem}
                    onDragActiveChange={(active) => setOrbitEnabled(!active)}
                    onOpenDetailItem={(assignmentId) => setDetailTarget({ kind: 'wall', assignmentId })}
                    floorPlacements={floorPlacementsWithItems}
                    onMoveFloorItem={handleMoveFloorItem}
                    onRotateFloorItem={handleRotateFloorItem}
                    onOpenFloorDetailItem={(placementId) => setDetailTarget({ kind: 'floor', placementId })}
                    onFloorClick={handleFloorClick}
                  />
                  <OrbitControls target={[0, heightFt! / 2, 0]} enabled={orbitEnabled} />
                </Canvas>
              ) : (
                <FloorAssignmentCanvas
                  widthFt={widthFt!}
                  depthFt={depthFt!}
                  surfaces={surfaces}
                  floorPlacements={floorPlacementsWithItems}
                  selectedPlacementId={selected2DFloorPlacementId}
                  onSelect={handleFloor2DSelect}
                  onMove={handleMoveFloorItem}
                  onTransformEnd={handleFloor2DTransformEnd}
                  onFloorClick={handleFloor2DClick}
                />
              )}
            </div>

            <aside className="booth-3d-panel">
              {viewMode === '3d' && (
                <>
                  {!selectedSurface ? (
                    <p>Click a wall of the booth to assign or clear it.</p>
                  ) : (
                    <>
                      <h3>{selectedSurface} wall</h3>
                      {boothWalls.length === 0 ? (
                        <p>This booth has no walls yet. Add one from the Booth Planner first.</p>
                      ) : (
                        <label>
                          Assigned wall
                          <select
                            value={selectedOccupant?.wall.id ?? ''}
                            onChange={(event) => handleAssignWall(selectedSurface, event.target.value)}
                          >
                            <option value="">— Open (no wall) —</option>
                            {assignableWalls.map((wall) => (
                              <option key={wall.id} value={wall.id}>
                                {wall.fields['Wall Name'] ?? 'Untitled wall'}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      {selectedOccupant && (
                        <>
                          <p className="booth-3d-panel__hint">
                            Drag items to reposition them, or click one to sell or remove it.
                            Click an item below to add it.
                          </p>
                          <AvailableItemsTray
                            items={availableItems}
                            onSelect={handleAddItemToSelectedWall}
                          />
                        </>
                      )}
                      <button type="button" onClick={() => setSelectedSurface(null)}>
                        Done
                      </button>
                    </>
                  )}
                  <hr />
                </>
              )}

              <h3>Floor</h3>
              {itemToPlaceOnFloor ? (
                <>
                  <p className="booth-3d-panel__hint">
                    Click anywhere on the floor to place{' '}
                    {itemsData.find((entry) => entry.id === itemToPlaceOnFloor)?.fields.Title ?? 'item'}.
                  </p>
                  <button type="button" onClick={() => setItemToPlaceOnFloor('')}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <p className="booth-3d-panel__hint">
                    {viewMode === '3d'
                      ? 'Click an item, then click the floor to place it freestanding. Drag placed items to reposition them, or click one to sell or remove it. Drag the small dot in front of an item to rotate it — it snaps to 90° angles.'
                      : 'Click an item, then click the floor to place it freestanding. Drag placed items to reposition them. Click an item to select it (rotate with the handle above it), then click again to sell or remove it.'}
                  </p>
                  <AvailableItemsTray items={availableItems} onSelect={setItemToPlaceOnFloor} />
                </>
              )}
            </aside>
          </div>
        </>
      )}

      {detailWallPlacedItem && (
        <ItemDetailDialog
          item={detailWallPlacedItem.item}
          boothId={boothRecordId}
          removeLabel="Remove from wall"
          onRemove={() => deleteAssignment.mutateAsync(detailWallPlacedItem.assignment.id)}
          onClose={() => setDetailTarget(null)}
        />
      )}

      {detailFloorItem && (
        <ItemDetailDialog
          item={detailFloorItem.item}
          boothId={boothRecordId}
          removeLabel="Remove from floor"
          onRemove={() => deleteFloorPlacement.mutateAsync(detailFloorItem.placement.id)}
          onClose={() => {
            setDetailTarget(null)
            setSelected2DFloorPlacementId(null)
          }}
        />
      )}
    </main>
  )
}
