import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useBooths } from '@/hooks/useBooths'
import { useWalls } from '@/hooks/useWalls'
import { useItems } from '@/hooks/useItems'
import { useWallAssignments } from '@/hooks/useWallAssignments'
import { useSales } from '@/hooks/useSales'
import { WallsGrid, type WallWithPlacements } from '@/features/walls/WallsGrid'
import { WallFormDialog } from '@/features/walls/WallFormDialog'
import type { PlacedItem } from '@/features/walls/PlacedItem'

export function BoothDetailPage() {
  const { boothId } = useParams<{ boothId: string }>()
  const booths = useBooths()
  const walls = useWalls()
  const items = useItems()
  const wallAssignments = useWallAssignments()
  const sales = useSales()
  const [showWallForm, setShowWallForm] = useState(false)

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

  if (!booth) {
    return (
      <main>
        <Breadcrumb items={[{ label: 'Booth Planner', to: '/booth-planner' }, { label: 'Not found' }]} />
        <p>Booth not found.</p>
      </main>
    )
  }

  const boothName = booth.fields['Booth Name'] ?? 'Untitled booth'
  const wallIds = new Set(booth.fields.Walls ?? [])
  const boothWalls = wallsData.filter((wall) => wallIds.has(wall.id))
  const boothAssignments = wallAssignmentsData.filter((assignment) =>
    wallIds.has(assignment.fields.Wall?.[0] ?? ''),
  )
  const soldItemIds = new Set(
    salesData.flatMap((sale) => sale.fields['Items (Sale History Link)'] ?? []),
  )
  const existingWallColors = Array.from(
    new Set(
      boothWalls
        .map((wall) => wall.fields['Wall Color']?.trim().toLowerCase())
        .filter((color): color is string => Boolean(color)),
    ),
  )

  const wallsWithPlacements: WallWithPlacements[] = boothWalls.map((wall) => {
    const placedItems: PlacedItem[] = boothAssignments
      .filter((assignment) => assignment.fields.Wall?.[0] === wall.id)
      .map((assignment) => {
        const item = itemsData.find((entry) => entry.id === assignment.fields.Painting?.[0])
        return item ? { assignment, item, isSold: soldItemIds.has(item.id) } : null
      })
      .filter((entry): entry is PlacedItem => entry !== null)
    return { wall, placedItems }
  })

  return (
    <main>
      <Breadcrumb items={[{ label: 'Booth Planner', to: '/booth-planner' }, { label: boothName }]} />
      <h1>{boothName}</h1>

      <section>
        <div className="page-header">
          <h2>Walls</h2>
          <button type="button" onClick={() => setShowWallForm(true)}>
            Add Wall
          </button>
        </div>
        <WallsGrid walls={wallsWithPlacements} boothId={booth.id} />
      </section>

      {showWallForm && (
        <WallFormDialog
          boothId={booth.id}
          existingColors={existingWallColors}
          onClose={() => setShowWallForm(false)}
        />
      )}
    </main>
  )
}
