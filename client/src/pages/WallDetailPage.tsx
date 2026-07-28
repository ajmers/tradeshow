import { useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Item, WallAssignment } from '@shared'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useBooths } from '@/hooks/useBooths'
import { useWalls } from '@/hooks/useWalls'
import { useItems } from '@/hooks/useItems'
import { useWallAssignments } from '@/hooks/useWallAssignments'
import {
  useCreateWallAssignment,
  useUpdateWallAssignment,
  useDeleteWallAssignment,
} from '@/hooks/useWallAssignmentMutations'
import { WallAssignmentCanvas, type PlacedItem } from '@/features/walls/WallAssignmentCanvas'
import { AvailableItemsTray } from '@/features/walls/AvailableItemsTray'

export function WallDetailPage() {
  const { boothId, wallId } = useParams<{ boothId: string; wallId: string }>()
  const booths = useBooths()
  const walls = useWalls()
  const items = useItems()
  const wallAssignments = useWallAssignments()
  const createAssignment = useCreateWallAssignment()
  const updateAssignment = useUpdateWallAssignment()
  const deleteAssignment = useDeleteWallAssignment()
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)

  const isPending = booths.isPending || walls.isPending || items.isPending || wallAssignments.isPending
  const firstError = booths.error ?? walls.error ?? items.error ?? wallAssignments.error

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

  const booth = boothsData.find((entry) => entry.id === boothId)
  const wall = wallsData.find((entry) => entry.id === wallId)

  if (!booth || !wall) {
    return (
      <main>
        <Breadcrumb items={[{ label: 'Booth Planner', to: '/booth-planner' }]} />
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

  const thisWallAssignments = boothAssignments.filter(
    (assignment) => assignment.fields.Wall?.[0] === wallId,
  )
  const placedItems: PlacedItem[] = thisWallAssignments
    .map((assignment) => {
      const item = itemsData.find((entry) => entry.id === assignment.fields.Painting?.[0])
      return item ? { assignment, item } : null
    })
    .filter((entry): entry is { assignment: WallAssignment; item: Item } => entry !== null)

  const availableItems = itemsData.filter((item) => !placedItemIdsInBooth.has(item.id))

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

  const handleRemove = () => {
    if (!selectedAssignmentId) {
      return
    }
    deleteAssignment.mutate(selectedAssignmentId, {
      onSuccess: () => setSelectedAssignmentId(null),
    })
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
      <h1>{wallName}</h1>

      {selectedAssignmentId && (
        <div className="wall-editor-toolbar">
          <button type="button" onClick={handleRemove} disabled={deleteAssignment.isPending}>
            {deleteAssignment.isPending ? 'Removing…' : 'Remove from wall'}
          </button>
        </div>
      )}

      <div className="wall-editor-canvas">
        <WallAssignmentCanvas
          wall={wall}
          placedItems={placedItems}
          selectedAssignmentId={selectedAssignmentId}
          onSelect={setSelectedAssignmentId}
          onMove={handleMove}
        />
      </div>

      <section>
        <h2>Add an item</h2>
        <AvailableItemsTray items={availableItems} onSelect={handleAddItem} />
      </section>
    </main>
  )
}
