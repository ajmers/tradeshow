import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useBooths } from '@/hooks/useBooths'
import { useWalls } from '@/hooks/useWalls'
import { useItems } from '@/hooks/useItems'
import { useWallAssignments } from '@/hooks/useWallAssignments'
import { useSales } from '@/hooks/useSales'
import {
  useCreateWallAssignment,
  useUpdateWallAssignment,
} from '@/hooks/useWallAssignmentMutations'
import { WallAssignmentCanvas } from '@/features/walls/WallAssignmentCanvas'
import { WallInventory } from '@/features/walls/WallInventory'
import { ItemDetailDialog } from '@/features/walls/ItemDetailDialog'
import type { PlacedItem } from '@/features/walls/PlacedItem'
import { AvailableItemsTray } from '@/features/walls/AvailableItemsTray'

export function WallDetailPage() {
  const { boothId, wallId } = useParams<{ boothId: string; wallId: string }>()
  const booths = useBooths()
  const walls = useWalls()
  const items = useItems()
  const wallAssignments = useWallAssignments()
  const sales = useSales()
  const createAssignment = useCreateWallAssignment()
  const updateAssignment = useUpdateWallAssignment()
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [detailAssignmentId, setDetailAssignmentId] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(true)

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
    return (
      <main>
        <Breadcrumb items={[{ label: 'Booth Planner', to: '/booth-planner' }, { label: 'Not found' }]} />
        <p>{!booth ? 'Booth not found.' : 'Wall not found.'}</p>
      </main>
    )
  }

  const boothName = booth.fields['Booth Name'] ?? 'Untitled booth'
  const wallName = wall.fields['Wall Name'] ?? 'Untitled wall'

  const boothWallIds = new Set(booth.fields.Walls ?? [])
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
    const count = thisWallAssignments.length
    const x = 1 + (count % 5) * 1.5
    const y = 1 + Math.floor(count / 5) * 1.5
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

  const handleSelectItem = (assignmentId: string | null) => {
    setSelectedAssignmentId(assignmentId)
    if (assignmentId) {
      setDetailAssignmentId(assignmentId)
    }
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
        <h1>{wallName}</h1>
        <button type="button" onClick={() => setShowGrid((prev) => !prev)}>
          {showGrid ? 'Hide gridlines' : 'Show gridlines'}
        </button>
      </div>

      <WallAssignmentCanvas
        wall={wall}
        placedItems={placedItems}
        selectedAssignmentId={selectedAssignmentId}
        onSelect={handleSelectItem}
        onMove={handleMove}
        onTransformEnd={handleTransformEnd}
        showGrid={showGrid}
      />

      <WallInventory
        placedItems={placedItems}
        selectedAssignmentId={selectedAssignmentId}
        onSelect={handleSelectItem}
      />

      <section>
        <h2>Available items</h2>
        <AvailableItemsTray items={availableItems} onSelect={handleAddItem} />
      </section>

      {detailItem && (
        <ItemDetailDialog placedItem={detailItem} boothId={booth.id} onClose={handleCloseDetail} />
      )}
    </main>
  )
}
