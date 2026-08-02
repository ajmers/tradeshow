import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import type { Item, Wall, WallAssignment } from '@shared'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useBooths } from '@/hooks/useBooths'
import { useWalls } from '@/hooks/useWalls'
import { useItems } from '@/hooks/useItems'
import { useWallAssignments } from '@/hooks/useWallAssignments'
import { useSales } from '@/hooks/useSales'
import { useBaseInfo } from '@/hooks/useBaseInfo'
import { useDeleteBooth } from '@/hooks/useBoothMutations'
import { useDeleteWall } from '@/hooks/useWallMutations'
import {
  useCreateWallAssignment,
  useUpdateWallAssignment,
  useDeleteWallAssignment,
} from '@/hooks/useWallAssignmentMutations'
import { WallAssignmentCanvas } from '@/features/walls/WallAssignmentCanvas'
import { WallCanvas } from '@/features/walls/WallCanvas'
import { WallFormDialog } from '@/features/walls/WallFormDialog'
import { WallDimensionsEditor } from '@/features/walls/WallDimensionsEditor'
import { WallColorPicker } from '@/features/walls/WallColorPicker'
import { WallInventory } from '@/features/walls/WallInventory'
import { ItemDetailDialog } from '@/features/walls/ItemDetailDialog'
import { Booth3DView } from '@/features/walls/Booth3DView'
import { BoothReportDialog } from '@/features/booths/BoothReportDialog'
import type { PlacedItem } from '@/features/walls/PlacedItem'
import { AvailableItemsTray } from '@/features/walls/AvailableItemsTray'
import { findEmptySpot } from '@/features/walls/findEmptySpot'
import { itemFootprintInches, wallDimensionToInches } from '@/features/walls/wallScale'

const THUMBNAIL_SIZE = 110
// Matches the shared @page rule's content width (8.5in letter - 2 * 0.65in
// margins = 7.2in), converted at the CSS-spec-standard 96px/in reference
// pixel that browsers use consistently for absolute units in both screen
// and print media.
const PRINT_TARGET_WIDTH_PX = 691

// The canvas's on-screen size comes from Konva/react-konva, which sets fixed
// pixel width/height (via inline style) on both its wrapping .konvajs-content
// div and each layer's own <canvas> element — CSS alone (even in @media
// print) can't override those without fighting inline styles, and neither
// changes the *rendered pixels*, just how large they're displayed. This
// scales all of them up to fill the print page's width, then restores the
// original sizes once the print dialog closes (window.print() blocks until
// then in every browser this app supports).
function printWallCanvas() {
  const content = document.querySelector<HTMLElement>('.wall-editor-canvas .konvajs-content')
  if (!content) {
    window.print()
    return
  }
  const canvases = [...content.querySelectorAll('canvas')]
  const originalSizes = [content, ...canvases].map((el) => ({
    el,
    width: el.style.width,
    height: el.style.height,
  }))

  const scale = PRINT_TARGET_WIDTH_PX / content.offsetWidth
  const targetWidth = `${content.offsetWidth * scale}px`
  const targetHeight = `${content.offsetHeight * scale}px`
  for (const { el } of originalSizes) {
    el.style.width = targetWidth
    el.style.height = targetHeight
  }

  window.print()

  for (const { el, width, height } of originalSizes) {
    el.style.width = width
    el.style.height = height
  }
}

// Shared by "add item to this wall" and "move item to another wall" — finds a
// free spot for an item on a given wall against whatever's already placed there,
// falling back to a simple wrapping grid if the wall has no dimensions set yet
// or nothing empty was found.
function findSpotOnWall(
  targetWall: Wall,
  itemFields: Item['fields'],
  existingAssignments: WallAssignment[],
  itemsData: Item[],
): { x: number; y: number } {
  const { width: itemWidthInches, height: itemHeightInches } = itemFootprintInches(itemFields)
  const wallWidthInches = targetWall.fields.Width
    ? wallDimensionToInches(targetWall.fields.Width, targetWall.fields['Unit of Measure'])
    : undefined
  const wallHeightInches = targetWall.fields.Height
    ? wallDimensionToInches(targetWall.fields.Height, targetWall.fields['Unit of Measure'])
    : undefined

  const spot =
    wallWidthInches && wallHeightInches
      ? findEmptySpot(
          wallWidthInches,
          wallHeightInches,
          itemWidthInches,
          itemHeightInches,
          existingAssignments
            .map((assignment) => {
              const placedItem = itemsData.find((entry) => entry.id === assignment.fields.Painting?.[0])
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

  const count = existingAssignments.length
  return {
    x: spot?.x ?? 1 + (count % 5) * 1.5,
    y: spot?.y ?? 1 + Math.floor(count / 5) * 1.5,
  }
}

type ViewMode = '2d' | '3d'

// Generic "..." menu used for both booth-level and wall-level actions — each
// caller supplies its own menuitem buttons as children. Closes on any click
// inside the dropdown (via bubbling) so individual items don't each need to
// know how to close the menu themselves.
function ActionsMenu({ label, children }: { label: string; children: ReactNode }) {
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
    <div className="actions-menu" ref={menuRef}>
      <button
        type="button"
        className="actions-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((prev) => !prev)}
      >
        ⋯
      </button>
      {open && (
        <div className="actions-menu__dropdown" role="menu" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  )
}

export function WallDetailPage() {
  const { boothId, wallId } = useParams<{ boothId: string; wallId?: string }>()
  const navigate = useNavigate()
  const booths = useBooths()
  const walls = useWalls()
  const items = useItems()
  const wallAssignments = useWallAssignments()
  const sales = useSales()
  const baseInfo = useBaseInfo()
  const deleteBooth = useDeleteBooth()
  const createAssignment = useCreateWallAssignment()
  const updateAssignment = useUpdateWallAssignment()
  const deleteAssignment = useDeleteWallAssignment()
  const deleteWall = useDeleteWall()
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [detailAssignmentId, setDetailAssignmentId] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [showAddWall, setShowAddWall] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('2d')
  const [inventoryOpen, setInventoryOpen] = useState(true)

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

  if (!booth) {
    // Most often a stale booth URL left over from a different user's session on
    // this browser (or a deleted booth) — either way, there's nothing useful to
    // show here, so bounce straight back to the home page instead of a dead end.
    return <Navigate to="/" replace />
  }

  const boothName = booth.fields['Booth Name'] ?? 'Untitled booth'
  const boothWallIds = new Set(booth.fields.Walls ?? [])
  const boothWalls = wallsData.filter((entry) => boothWallIds.has(entry.id))

  // Landing on the bare booth URL (no wall in the path) — jump straight to the
  // most recently added wall instead of an intermediate "pick a wall" screen.
  // Skipped once the booth has no walls at all, since there's nowhere to send it.
  if (!wallId && boothWalls.length > 0) {
    const latestWall = boothWalls.reduce((latest, entry) =>
      (entry.createdTime ?? '') > (latest.createdTime ?? '') ? entry : latest,
    )
    return <Navigate to={`/booth-planner/${booth.id}/walls/${latestWall.id}`} replace />
  }

  const wall = wallId ? wallsData.find((entry) => entry.id === wallId) : undefined

  if (wallId && !wall) {
    // Stale/foreign wall id — same reasoning as the booth check above.
    return <Navigate to="/" replace />
  }

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

  const placedItemsForWall = (targetWallId: string): PlacedItem[] =>
    boothAssignments
      .filter((assignment) => assignment.fields.Wall?.[0] === targetWallId)
      .map((assignment) => {
        const item = itemsData.find((entry) => entry.id === assignment.fields.Painting?.[0])
        return item ? { assignment, item, isSold: soldItemIds.has(item.id) } : null
      })
      .filter((entry): entry is PlacedItem => entry !== null)

  const thisWallAssignments = wall
    ? boothAssignments.filter((assignment) => assignment.fields.Wall?.[0] === wall.id)
    : []
  const placedItems = wall ? placedItemsForWall(wall.id) : []
  const otherWalls = wall ? boothWalls.filter((entry) => entry.id !== wall.id) : boothWalls

  const availableItems = itemsData.filter((item) => !placedItemIdsInBooth.has(item.id))
  const detailItem = placedItems.find((entry) => entry.assignment.id === detailAssignmentId) ?? null

  const booth3dEnabled = baseInfo.data?.featureFlags.boothPlanner3d ?? true

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

  const handleDeleteWall = () => {
    if (!wall) {
      return
    }
    const wallName = wall.fields['Wall Name'] ?? 'Untitled wall'
    if (!window.confirm(`Delete "${wallName}"? This also deletes every item placement on it. This cannot be undone.`)) {
      return
    }
    deleteWall.mutate(wall.id, {
      onSuccess: () => {
        const next = otherWalls[0]
        navigate(next ? `/booth-planner/${booth.id}/walls/${next.id}` : `/booth-planner/${booth.id}`)
      },
    })
  }

  const handleAddItem = (itemId: string) => {
    if (!wall) {
      return
    }
    const item = itemsData.find((entry) => entry.id === itemId)
    if (!item) {
      return
    }

    const { x, y } = findSpotOnWall(wall, item.fields, thisWallAssignments, itemsData)

    createAssignment.mutate({
      Assignment: `${item.fields.Title ?? 'Item'} on ${wall.fields['Wall Name'] ?? 'wall'}`,
      Wall: [wall.id],
      Painting: [item.id],
      Booth: [booth.id],
      'X Position': x,
      'Y Position': y,
      'Rotation Angle': 0,
    })
  }

  const handleMoveToWall = (assignment: WallAssignment, item: Item, targetWallId: string) => {
    const targetWall = boothWalls.find((entry) => entry.id === targetWallId)
    if (!targetWall) {
      return Promise.resolve()
    }
    const existingOnTargetWall = boothAssignments.filter(
      (entry) => entry.fields.Wall?.[0] === targetWallId,
    )
    const { x, y } = findSpotOnWall(targetWall, item.fields, existingOnTargetWall, itemsData)

    return updateAssignment.mutateAsync({
      id: assignment.id,
      input: {
        Wall: [targetWallId],
        'X Position': x,
        'Y Position': y,
        ...labelDeltaInput(assignment.id, x, y),
      },
    })
  }

  // Once a label has been dragged to an explicit spot, it should keep riding
  // along with the item — so moving/transforming the item carries the label
  // by the same delta instead of leaving it pinned at its old absolute spot.
  // A label still at its (unset) computed default doesn't need this: that
  // default is recalculated from the item's current position on every
  // render, so it already tracks the item for free.
  function labelDeltaInput(assignmentId: string, xInches: number, yInches: number) {
    const assignment = boothAssignments.find((entry) => entry.id === assignmentId)
    const labelX = assignment?.fields['Label X Position']
    const labelY = assignment?.fields['Label Y Position']
    if (labelX === undefined || labelY === undefined) {
      return {}
    }
    const deltaX = xInches - (assignment?.fields['X Position'] ?? xInches)
    const deltaY = yInches - (assignment?.fields['Y Position'] ?? yInches)
    return { 'Label X Position': labelX + deltaX, 'Label Y Position': labelY + deltaY }
  }

  const handleMove = (assignmentId: string, xInches: number, yInches: number) => {
    updateAssignment.mutate({
      id: assignmentId,
      input: {
        'X Position': xInches,
        'Y Position': yInches,
        ...labelDeltaInput(assignmentId, xInches, yInches),
      },
    })
  }

  const handleMoveLabel = (assignmentId: string, xInches: number, yInches: number) => {
    updateAssignment.mutate({
      id: assignmentId,
      input: { 'Label X Position': xInches, 'Label Y Position': yInches },
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
      input: {
        'X Position': xInches,
        'Y Position': yInches,
        'Rotation Angle': rotationDegrees,
        ...labelDeltaInput(assignmentId, xInches, yInches),
      },
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
    <main className={inventoryOpen ? 'wall-detail-page' : 'wall-detail-page wall-detail-page--inventory-collapsed'}>
      <Breadcrumb
        items={
          wall
            ? [
                { label: 'Booth Planner', to: '/booth-planner' },
                { label: boothName, to: `/booth-planner/${booth.id}` },
                { label: wall.fields['Wall Name'] ?? 'Untitled wall' },
              ]
            : [{ label: 'Booth Planner', to: '/booth-planner' }, { label: boothName }]
        }
      />

      <div className="page-toolbar page-toolbar--booth">
        <div className="page-toolbar__title">
          <div>
            <p className="wall-editor-booth-label">{boothName}</p>
            <div className="wall-editor-name-row">
              <h1>{wall ? (wall.fields['Wall Name'] ?? 'Untitled wall') : 'No walls yet'}</h1>
              {wall && (
                <ActionsMenu label="Wall actions">
                  <button
                    type="button"
                    role="menuitem"
                    className="actions-menu__delete"
                    onClick={handleDeleteWall}
                    disabled={deleteWall.isPending}
                  >
                    {deleteWall.isPending ? 'Deleting…' : 'Delete Wall'}
                  </button>
                </ActionsMenu>
              )}
            </div>
            {wall && viewMode === '2d' && <WallDimensionsEditor wall={wall} key={wall.id} />}
          </div>
          <ActionsMenu label="Booth actions">
            <button type="button" role="menuitem" onClick={() => setShowReport(true)}>
              Run Booth Report
            </button>
            <button
              type="button"
              role="menuitem"
              className="actions-menu__delete"
              onClick={handleDeleteBooth}
            >
              Delete Booth
            </button>
          </ActionsMenu>
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
        <>
          {wall && (
            <div className="wall-editor-toolbar__controls">
              <WallColorPicker wall={wall} boothWalls={boothWalls} />
              <button type="button" onClick={printWallCanvas}>
                Print Wall
              </button>
            </div>
          )}

          <div className="wall-editor-body">
            <aside className="wall-editor-thumbnails" aria-label="All walls in this booth">
              <div className="wall-editor-thumbnails__header">
                <h2>All Walls</h2>
                <button type="button" onClick={() => setShowAddWall(true)}>
                  Add Wall
                </button>
              </div>
              <div className="wall-editor-thumbnails__list">
                {boothWalls.map((boothWall) => (
                  <WallCanvas
                    key={boothWall.id}
                    wall={boothWall}
                    boothId={booth.id}
                    placedItems={placedItemsForWall(boothWall.id)}
                    size={THUMBNAIL_SIZE}
                    active={wall?.id === boothWall.id}
                  />
                ))}
                {boothWalls.length === 0 && <p>No walls for this booth yet.</p>}
              </div>
            </aside>

            {wall ? (
              <WallAssignmentCanvas
                key={wall.id}
                wall={wall}
                placedItems={placedItems}
                selectedAssignmentId={selectedAssignmentId}
                onSelect={handleCanvasSelect}
                onMove={handleMove}
                onMoveLabel={handleMoveLabel}
                onTransformEnd={handleTransformEnd}
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid((prev) => !prev)}
              />
            ) : (
              <div className="wall-editor-empty">
                <p>This booth doesn&rsquo;t have any walls yet.</p>
                <button type="button" onClick={() => setShowAddWall(true)}>
                  Add Wall
                </button>
              </div>
            )}
          </div>

          {wall && (
            <>
              <WallInventory
                placedItems={placedItems}
                selectedAssignmentId={selectedAssignmentId}
                onSelect={handleListSelect}
                isOpen={inventoryOpen}
                onToggle={() => setInventoryOpen((prev) => !prev)}
              />

              <section>
                <h2>Available items</h2>
                <AvailableItemsTray items={availableItems} onSelect={handleAddItem} />
              </section>
            </>
          )}
        </>
      )}

      {showAddWall && <WallFormDialog boothId={booth.id} onClose={() => setShowAddWall(false)} />}

      {showReport && <BoothReportDialog booth={booth} onClose={() => setShowReport(false)} />}

      {detailItem && (
        <ItemDetailDialog
          item={detailItem.item}
          boothId={booth.id}
          removeLabel="Remove from wall"
          onRemove={() => deleteAssignment.mutateAsync(detailItem.assignment.id)}
          onClose={handleCloseDetail}
          moveOptions={{
            otherWalls,
            onMove: (targetWallId) =>
              handleMoveToWall(detailItem.assignment, detailItem.item, targetWallId),
          }}
        />
      )}
    </main>
  )
}
