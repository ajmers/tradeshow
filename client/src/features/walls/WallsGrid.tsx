import type { Wall } from '@shared'
import { WallCanvas } from '@/features/walls/WallCanvas'

export function WallsGrid({ walls }: { walls: Wall[] }) {
  if (walls.length === 0) {
    return <p>No walls for this booth yet.</p>
  }

  return (
    <div className="walls-grid">
      {walls.map((wall) => (
        <WallCanvas key={wall.id} wall={wall} />
      ))}
    </div>
  )
}
