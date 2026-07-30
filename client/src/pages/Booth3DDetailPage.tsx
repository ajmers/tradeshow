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
import { useUpdateBooth } from '@/hooks/useBoothMutations'
import { useUpdateWall } from '@/hooks/useWallMutations'
import { BoothScene3D, type BoothSurfaceName, type BoothSurfaceOccupant } from '@/features/walls/BoothScene3D'
import type { PlacedItem } from '@/features/walls/PlacedItem'

const SURFACE_NAMES: BoothSurfaceName[] = ['Front', 'Back', 'Left', 'Right']

function BoothDimensionsForm({
  boothId,
  onSaved,
}: {
  boothId: string
  onSaved: (dims: { width: number; depth: number; height: number }) => void
}) {
  const updateBooth = useUpdateBooth()

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
      <div className="booth-3d-dimensions-form__row">
        <label>
          Width (ft)
          <input name="width" type="number" step="any" min="0" required />
        </label>
        <label>
          Depth (ft)
          <input name="depth" type="number" step="any" min="0" required />
        </label>
        <label>
          Height (ft)
          <input name="height" type="number" step="any" min="0" required />
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
  const updateWall = useUpdateWall()
  const [selectedSurface, setSelectedSurface] = useState<BoothSurfaceName | null>(null)
  const [editingDimensions, setEditingDimensions] = useState(false)

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
        <Breadcrumb items={[{ label: 'Booth Planner 3D', to: '/booth-planner-3d' }, { label: 'Not found' }]} />
        <p>Booth not found.</p>
      </main>
    )
  }

  const boothName = booth.fields['Booth Name'] ?? 'Untitled booth'
  const widthFt = booth.fields['Booth Width']
  const depthFt = booth.fields['Booth Depth']
  const heightFt = booth.fields['Booth Height']
  const hasDimensions = Boolean(widthFt && depthFt && heightFt)

  const boothWallIds = new Set(booth.fields.Walls ?? [])
  const boothWalls = wallsData.filter((wall) => boothWallIds.has(wall.id))
  const soldItemIds = new Set(salesData.flatMap((sale) => sale.fields['Items (Sale History Link)'] ?? []))

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

  return (
    <main>
      <Breadcrumb items={[{ label: 'Booth Planner 3D', to: '/booth-planner-3d' }, { label: boothName }]} />
      <div className="page-toolbar">
        <h1>{boothName} — 3D Layout</h1>
      </div>

      {!hasDimensions || editingDimensions ? (
        <BoothDimensionsForm boothId={booth.id} onSaved={() => setEditingDimensions(false)} />
      ) : (
        <>
          <div className="booth-3d-toolbar">
            <span>
              {widthFt}&apos; × {depthFt}&apos; × {heightFt}&apos; high
            </span>
            <button type="button" onClick={() => setEditingDimensions(true)}>
              Edit dimensions
            </button>
          </div>

          <div className="booth-3d-layout">
            <div className="booth-3d-canvas-wrapper">
              <Canvas camera={{ position: [widthFt! * 0.9, heightFt! * 1.1, depthFt! * 1.4], fov: 50 }}>
                <BoothScene3D
                  widthFt={widthFt!}
                  depthFt={depthFt!}
                  heightFt={heightFt!}
                  surfaces={surfaces}
                  selectedSurface={selectedSurface}
                  onSelectSurface={setSelectedSurface}
                />
                <OrbitControls target={[0, heightFt! / 2, 0]} />
              </Canvas>
            </div>

            <aside className="booth-3d-panel">
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
                  <button type="button" onClick={() => setSelectedSurface(null)}>
                    Done
                  </button>
                </>
              )}
            </aside>
          </div>
        </>
      )}
    </main>
  )
}
