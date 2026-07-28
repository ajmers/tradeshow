import type { Wall } from '@shared'
import { WallCanvas } from '@/features/walls/WallCanvas'
import type { PlacedItem } from '@/features/walls/PlacedItem'

export interface WallWithPlacements {
  wall: Wall
  placedItems: PlacedItem[]
}

export function WallsGrid({ walls, boothId }: { walls: WallWithPlacements[]; boothId: string }) {
  if (walls.length === 0) {
    return <p>No walls for this booth yet.</p>
  }

  return (
    <div className="walls-grid">
      {walls.map(({ wall, placedItems }) => (
        <WallCanvas key={wall.id} wall={wall} boothId={boothId} placedItems={placedItems} />
      ))}
    </div>
  )
}
