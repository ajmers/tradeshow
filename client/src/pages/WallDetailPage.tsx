import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useBooths } from '@/hooks/useBooths'
import { useWalls } from '@/hooks/useWalls'
import { useItems } from '@/hooks/useItems'
import { useWallAssignments } from '@/hooks/useWallAssignments'
import { useSales } from '@/hooks/useSales'
import { useDeleteWall } from '@/hooks/useWallMutations'
import {
  useCreateWallAssignment,
  useUpdateWallAssignment,
  useDeleteWallAssignment,
} from '@/hooks/useWallAssignmentMutations'
import { WallAssignmentCanvas } from '@/features/walls/WallAssignmentCanvas'
import { WallDimensionsEditor } from '@/features/walls/WallDimensionsEditor'
import { WallColorPicker } from '@/features/walls/WallColorPicker'
import { WallInventory } from '@/features/walls/WallInventory'
import { ItemDetailDialog } from '@/features/walls/ItemDetailDialog'
import type { PlacedItem } from '@/features/walls/PlacedItem'
import { AvailableItemsTray } from '@/features/walls/AvailableItemsTray'
import { findEmptySpot } from '@/features/walls/findEmptySpot'
import { itemFootprintInches, wallDimensionToInches } from '@/features/walls/wallScale'

export function WallDetailPage() {
  const { boothId, wallId } = useParams<{ boothId: string; wallId: string }>()
  const navigate = useNavigate()
  const booths = useBooths()
  const walls = useWalls()
  const items = useItems()
  const wallAssignments = useWallAssignments()
  const sales = useSales()
  const createAssignment = useCreateWallAssignment()
  const updateAssignment = useUpdateWallAssignment()
  const deleteAssignment = useDeleteWallAssignment()
  const deleteWall = useDeleteWall()
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [detailAssignmentId, setDetailAssignmentId] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(true)

  // Delete/Backspace removes the selected item directly from the canvas. Only active
  // while the detail dialog is closed, so it never fights with typing in the Sell form.
  useEffect(() => {
    if (!selectedAssignmentId || detailAssignmentId) {
      return
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return
      }
      event.preventDefault()
      deleteAssignment.mutate(selectedAssignmentId, {
        onSuccess: () => setSelectedAssignmentId(null),
      })
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAssignmentId, detailAssignmentId, deleteAssignment])

  const isPending =
    booths.isPending || walls.isPending || items.isPending || wallAssignments.isPending || sales.isPending
  const firstError = booths.error ?? walls.error ?? items.error ?? wallAssignments.error ?? sales.error

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

  const booth = boothsData.find((entry) => entry.id === boothId)
  const wall = wallsData.find((entry) => entry.id === wallId)

  if (!booth || !wall) {
    // Most often a stale wall/booth URL left over from a different user's session
    // on this browser (or a deleted booth/wall) — either way, there's nothing
    // useful to show here, so bounce straight back to the home page.
    return <Navigate to="/" replace />
  }

  const boothName = booth.fields['Booth Name'] ?? 'Untitled booth'
  const wallName = wall.fields['Wall Name'] ?? 'Untitled wall'

  const handleDeleteWall = () => {
    if (!window.confirm(`Delete "${wallName}"? This also deletes every item placement on it. This cannot be undone.`)) {
      return
    }
    deleteWall.mutate(wall.id, { onSuccess: () => navigate(`/booth-planner/${booth.id}`) })
  }

  const boothWallIds = new Set(booth.fields.Walls ?? [])
  const boothWalls = wallsData.filter((entry) => boothWallIds.has(entry.id))
  const boothAssignments = wallAssignmentsData.filter((assignment) =>
    boothWallIds.has(assignment.fields.Wall?.[0] ?? ''),
  )
  const placedItemIdsInBooth = new Set(
    boothAssignments
      .map((assignment) => assignment.fields.Painting?.[0])
      .filter((id): id is string => Boolean(id)),
  )

  const soldItemIds = new Set(
    salesData.flatMap((sale) => sale.fields['Items (Sale History Link)'] ?? []),
  )

  const thisWallAssignments = boothAssignments.filter(
    (assignment) => assignment.fields.Wall?.[0] === wallId,
  )
  const placedItems: PlacedItem[] = thisWallAssignments
    .map((assignment) => {
      const item = itemsData.find((entry) => entry.id === assignment.fields.Painting?.[0])
      return item ? { assignment, item, isSold: soldItemIds.has(item.id) } : null
    })
    .filter((entry): entry is PlacedItem => entry !== null)

  const availableItems = itemsData.filter((item) => !placedItemIdsInBooth.has(item.id))
  const detailItem = placedItems.find((entry) => entry.assignment.id === detailAssignmentId) ?? null

  const handleAddItem = (itemId: string) => {
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
            thisWallAssignments
              .map((assignment) => {
                const placedItem = itemsData.find(
                  (entry) => entry.id === assignment.fields.Painting?.[0],
                )
                if (!placedItem) {
                  return null
                }
                const footprint = itemFootprintInches(placedItem.fields)
                return {
                  x: assignment.fields['X Position'] ?? 0,
                  y: assignment.fields['Y Position'] ?? 0,
                  width: footprint.width,
                  height: footprint.height,
                  rotationDegrees: assignment.fields['Rotation Angle'] ?? 0,
                }
              })
              .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
          )
        : null

    // Falls back to a simple wrapping grid when nothing empty was found (wall fully
    // packed, item too big to fit anywhere, or the wall has no dimensions set yet).
    const count = thisWallAssignments.length
    const x = spot?.x ?? 1 + (count % 5) * 1.5
    const y = spot?.y ?? 1 + Math.floor(count / 5) * 1.5

    createAssignment.mutate({
      Assignment: `${item.fields.Title ?? 'Item'} on ${wallName}`,
      Wall: [wall.id],
      Painting: [item.id],
      Booth: [booth.id],
      'X Position': x,
      'Y Position': y,
      'Rotation Angle': 0,
    })
  }

  const handleMove = (assignmentId: string, xInches: number, yInches: number) => {
    updateAssignment.mutate({
      id: assignmentId,
      input: { 'X Position': xInches, 'Y Position': yInches },
    })
  }

  const handleTransformEnd = (
    assignmentId: string,
    xInches: number,
    yInches: number,
    rotationDegrees: number,
  ) => {
    updateAssignment.mutate({
      id: assignmentId,
      input: { 'X Position': xInches, 'Y Position': yInches, 'Rotation Angle': rotationDegrees },
    })
  }

  // On the canvas, a first click just selects the item (so the rotate handles show up
  // and are actually usable); clicking the already-selected item again opens details.
  const handleCanvasSelect = (assignmentId: string | null) => {
    if (assignmentId && assignmentId === selectedAssignmentId) {
      setDetailAssignmentId(assignmentId)
    } else {
      setSelectedAssignmentId(assignmentId)
    }
  }

  // The inventory list has no handles to preserve access to, so a click there can
  // just select and open details in one step.
  const handleListSelect = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId)
    setDetailAssignmentId(assignmentId)
  }

  const handleCloseDetail = () => {
    setDetailAssignmentId(null)
    setSelectedAssignmentId(null)
  }

  return (
    <main>
      <Breadcrumb
        items={[
          { label: 'Booth Planner', to: '/booth-planner' },
          { label: boothName, to: `/booth-planner/${booth.id}` },
          { label: wallName },
        ]}
      />

      <div className="wall-editor-toolbar">
        <div>
          <h1>{wallName}</h1>
          <WallDimensionsEditor wall={wall} key={wall.id} />
        </div>
        <div className="wall-editor-toolbar__controls">
          <WallColorPicker wall={wall} boothWalls={boothWalls} />
          <button type="button" onClick={() => setShowGrid((prev) => !prev)}>
            {showGrid ? 'Hide gridlines' : 'Show gridlines'}
          </button>
          <button type="button" onClick={handleDeleteWall} disabled={deleteWall.isPending}>
            {deleteWall.isPending ? 'Deleting…' : 'Delete Wall'}
          </button>
        </div>
      </div>

      <WallAssignmentCanvas
        key={wall.id}
        wall={wall}
        placedItems={placedItems}
        selectedAssignmentId={selectedAssignmentId}
        onSelect={handleCanvasSelect}
        onMove={handleMove}
        onTransformEnd={handleTransformEnd}
        showGrid={showGrid}
      />

      <WallInventory
        placedItems={placedItems}
        selectedAssignmentId={selectedAssignmentId}
        onSelect={handleListSelect}
      />

      <section>
        <h2>Available items</h2>
        <AvailableItemsTray items={availableItems} onSelect={handleAddItem} />
      </section>

      {detailItem && (
        <ItemDetailDialog
          item={detailItem.item}
          boothId={booth.id}
          removeLabel="Remove from wall"
          onRemove={() => deleteAssignment.mutateAsync(detailItem.assignment.id)}
          onClose={handleCloseDetail}
        />
      )}
    </main>
  )
}
