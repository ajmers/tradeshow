import { useParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useBooths } from '@/hooks/useBooths'
import { useWalls } from '@/hooks/useWalls'
import { useItems } from '@/hooks/useItems'
import { useWallAssignments } from '@/hooks/useWallAssignments'
import { WallsGrid, type WallWithPlacements } from '@/features/walls/WallsGrid'
import type { PlacedItem } from '@/features/walls/PlacedItem'

export function BoothDetailPage() {
  const { boothId } = useParams<{ boothId: string }>()
  const booths = useBooths()
  const walls = useWalls()
  const items = useItems()
  const wallAssignments = useWallAssignments()

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

  const wallsWithPlacements: WallWithPlacements[] = boothWalls.map((wall) => {
    const placedItems: PlacedItem[] = boothAssignments
      .filter((assignment) => assignment.fields.Wall?.[0] === wall.id)
      .map((assignment) => {
        const item = itemsData.find((entry) => entry.id === assignment.fields.Painting?.[0])
        return item ? { assignment, item } : null
      })
      .filter((entry): entry is PlacedItem => entry !== null)
    return { wall, placedItems }
  })

  return (
    <main>
      <Breadcrumb items={[{ label: 'Booth Planner', to: '/booth-planner' }, { label: boothName }]} />
      <h1>{boothName}</h1>

      <section>
        <h2>Walls</h2>
        <WallsGrid walls={wallsWithPlacements} boothId={booth.id} />
      </section>
    </main>
  )
}
