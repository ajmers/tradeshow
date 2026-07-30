import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useBooths } from '@/hooks/useBooths'
import { useWalls } from '@/hooks/useWalls'
import { useItems } from '@/hooks/useItems'
import { useWallAssignments } from '@/hooks/useWallAssignments'
import { useSales } from '@/hooks/useSales'
import { useBaseInfo } from '@/hooks/useBaseInfo'
import { useDeleteBooth } from '@/hooks/useBoothMutations'
import { WallsGrid, type WallWithPlacements } from '@/features/walls/WallsGrid'
import { WallFormDialog } from '@/features/walls/WallFormDialog'
import { Booth3DView } from '@/features/walls/Booth3DView'
import { BoothReportDialog } from '@/features/booths/BoothReportDialog'
import type { PlacedItem } from '@/features/walls/PlacedItem'

type ViewMode = '2d' | '3d'

function BoothActionsMenu({
  onRunReport,
  onDelete,
}: {
  onRunReport: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="booth-actions-menu" ref={menuRef}>
      <button
        type="button"
        className="booth-actions-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Booth actions"
        onClick={() => setOpen((prev) => !prev)}
      >
        ⋯
      </button>
      {open && (
        <div className="booth-actions-menu__dropdown" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onRunReport()
            }}
          >
            Run Booth Report
          </button>
          <button
            type="button"
            role="menuitem"
            className="booth-actions-menu__delete"
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
          >
            Delete Booth
          </button>
        </div>
      )}
    </div>
  )
}

export function BoothDetailPage() {
  const { boothId } = useParams<{ boothId: string }>()
  const navigate = useNavigate()
  const booths = useBooths()
  const walls = useWalls()
  const items = useItems()
  const wallAssignments = useWallAssignments()
  const sales = useSales()
  const baseInfo = useBaseInfo()
  const deleteBooth = useDeleteBooth()
  const [showAddWall, setShowAddWall] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('2d')
  // Defaults to enabled while base info is still loading, so the toggle doesn't flash
  // away and back once it resolves (it's normally already cached from AppLayout).
  const booth3dEnabled = baseInfo.data?.featureFlags.boothPlanner3d ?? true

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

  const handleDeleteBooth = () => {
    if (
      !window.confirm(
        `Delete "${boothName}"? This also deletes every wall and item placement in it. This cannot be undone.`,
      )
    ) {
      return
    }
    deleteBooth.mutate(booth.id, { onSuccess: () => navigate('/booth-planner') })
  }

  const wallIds = new Set(booth.fields.Walls ?? [])
  const boothWalls = wallsData.filter((wall) => wallIds.has(wall.id))
  const boothAssignments = wallAssignmentsData.filter((assignment) =>
    wallIds.has(assignment.fields.Wall?.[0] ?? ''),
  )
  const soldItemIds = new Set(
    salesData.flatMap((sale) => sale.fields['Items (Sale History Link)'] ?? []),
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
      <div className="page-toolbar page-toolbar--booth">
        <div className="page-toolbar__title">
          <h1>{boothName}</h1>
          <BoothActionsMenu onRunReport={() => setShowReport(true)} onDelete={handleDeleteBooth} />
        </div>
        {booth3dEnabled && (
          <div className="view-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              className={`view-toggle__button${viewMode === '2d' ? ' view-toggle__button--active' : ''}`}
              aria-pressed={viewMode === '2d'}
              onClick={() => setViewMode('2d')}
            >
              2D
            </button>
            <button
              type="button"
              className={`view-toggle__button${viewMode === '3d' ? ' view-toggle__button--active' : ''}`}
              aria-pressed={viewMode === '3d'}
              onClick={() => setViewMode('3d')}
            >
              3D
            </button>
          </div>
        )}
      </div>

      {booth3dEnabled && viewMode === '3d' ? (
        <Booth3DView booth={booth} />
      ) : (
        <section>
          <div className="page-toolbar">
            <h2>Walls</h2>
            <button type="button" onClick={() => setShowAddWall(true)}>
              Add Wall
            </button>
          </div>
          <WallsGrid walls={wallsWithPlacements} boothId={booth.id} />
        </section>
      )}

      {showAddWall && (
        <WallFormDialog boothId={booth.id} onClose={() => setShowAddWall(false)} />
      )}

      {showReport && <BoothReportDialog booth={booth} onClose={() => setShowReport(false)} />}
    </main>
  )
}
