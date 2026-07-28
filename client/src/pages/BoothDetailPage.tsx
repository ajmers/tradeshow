import { useParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useBooths } from '@/hooks/useBooths'
import { useWalls } from '@/hooks/useWalls'
import { WallsGrid } from '@/features/walls/WallsGrid'

export function BoothDetailPage() {
  const { boothId } = useParams<{ boothId: string }>()
  const booths = useBooths()
  const walls = useWalls()

  if (booths.isPending) {
    return <p>Loading booth…</p>
  }

  if (booths.isError) {
    return <p role="alert">Error loading booth: {booths.error.message}</p>
  }

  const booth = booths.data.find((item) => item.id === boothId)

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
  const boothWalls = walls.data?.filter((wall) => wallIds.has(wall.id)) ?? []

  return (
    <main>
      <Breadcrumb items={[{ label: 'Booth Planner', to: '/booth-planner' }, { label: boothName }]} />
      <h1>{boothName}</h1>

      <section>
        <h2>Walls</h2>
        {walls.isPending && <p>Loading walls…</p>}
        {walls.isError && <p role="alert">Error loading walls: {walls.error.message}</p>}
        {walls.isSuccess && <WallsGrid walls={boothWalls} boothId={booth.id} />}
      </section>
    </main>
  )
}
