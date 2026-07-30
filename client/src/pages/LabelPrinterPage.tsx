import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useItems } from '@/hooks/useItems'
import { useBooths } from '@/hooks/useBooths'
import { useWalls } from '@/hooks/useWalls'
import { useWallAssignments } from '@/hooks/useWallAssignments'
import { useLabelLogo } from '@/hooks/useLabelLogo'
import { LabelPrinterConfigPanel } from '@/features/labelPrinter/LabelPrinterConfigPanel'
import { ItemSelectionList } from '@/features/labelPrinter/ItemSelectionList'
import { LabelSheet } from '@/features/labelPrinter/LabelSheet'
import {
  loadLabelPrinterConfig,
  saveLabelPrinterConfig,
  type LabelPrinterConfig,
} from '@/features/labelPrinter/labelPrinterConfig'

export function LabelPrinterPage() {
  const items = useItems()
  const booths = useBooths()
  const walls = useWalls()
  const wallAssignments = useWallAssignments()
  const logo = useLabelLogo()
  const [searchParams] = useSearchParams()
  const [config, setConfig] = useState<LabelPrinterConfig>(() => loadLabelPrinterConfig())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [boothFilter, setBoothFilter] = useState(() => searchParams.get('boothId') ?? '')
  const [wallFilter, setWallFilter] = useState('')
  const hasInitializedSelection = useRef(false)

  useEffect(() => {
    saveLabelPrinterConfig(config)
  }, [config])

  // Everything starts selected by default (or, if arriving from a booth's "Print
  // Labels" link, just that booth's items) — the user can then deselect individual
  // items or clear the whole selection. Only runs once, on first load, so it
  // doesn't stomp on the user's own (de)selections if items refetch later.
  useEffect(() => {
    if (!items.data || !wallAssignments.data || !booths.data || hasInitializedSelection.current) {
      return
    }
    const initialBoothId = searchParams.get('boothId') ?? ''
    const initialBoothWallIds = new Set(
      booths.data.find((booth) => booth.id === initialBoothId)?.fields.Walls ?? [],
    )
    const initialIds = initialBoothId
      ? new Set(
          wallAssignments.data
            .filter((assignment) => initialBoothWallIds.has(assignment.fields.Wall?.[0] ?? ''))
            .map((assignment) => assignment.fields.Painting?.[0])
            .filter((id): id is string => Boolean(id)),
        )
      : new Set(items.data.map((item) => item.id))
    setSelectedIds(initialIds)
    hasInitializedSelection.current = true
  }, [items.data, wallAssignments.data, booths.data, searchParams])

  const isPending = items.isPending || booths.isPending || walls.isPending || wallAssignments.isPending
  const firstError = items.error ?? booths.error ?? walls.error ?? wallAssignments.error

  if (isPending) {
    return <p>Loading…</p>
  }

  if (firstError) {
    return <p role="alert">Error: {firstError.message}</p>
  }

  const itemsData = items.data ?? []
  const boothsData = booths.data ?? []
  const wallsData = walls.data ?? []
  const wallAssignmentsData = wallAssignments.data ?? []

  const wallsInSelectedBooth = boothFilter
    ? wallsData.filter((wall) =>
        (boothsData.find((booth) => booth.id === boothFilter)?.fields.Walls ?? []).includes(wall.id),
      )
    : []

  function itemIdsForLocation(boothId: string, wallId: string): Set<string> {
    if (wallId) {
      return new Set(
        wallAssignmentsData
          .filter((assignment) => assignment.fields.Wall?.[0] === wallId)
          .map((assignment) => assignment.fields.Painting?.[0])
          .filter((id): id is string => Boolean(id)),
      )
    }
    if (boothId) {
      const boothWallIds = new Set(
        boothsData.find((booth) => booth.id === boothId)?.fields.Walls ?? [],
      )
      return new Set(
        wallAssignmentsData
          .filter((assignment) => boothWallIds.has(assignment.fields.Wall?.[0] ?? ''))
          .map((assignment) => assignment.fields.Painting?.[0])
          .filter((id): id is string => Boolean(id)),
      )
    }
    return new Set(itemsData.map((item) => item.id))
  }

  function handleBoothFilterChange(boothId: string) {
    setBoothFilter(boothId)
    setWallFilter('')
    setSelectedIds(itemIdsForLocation(boothId, ''))
  }

  function handleWallFilterChange(wallId: string) {
    setWallFilter(wallId)
    setSelectedIds(itemIdsForLocation(boothFilter, wallId))
  }

  const locationItemIds = itemIdsForLocation(boothFilter, wallFilter)
  const filteredItems = itemsData.filter((item) => locationItemIds.has(item.id))
  const selectedItems = filteredItems.filter((item) => selectedIds.has(item.id))

  return (
    <main className="label-printer-page">
      <div className="label-printer-controls">
        <div className="page-toolbar">
          <h1>Label Printer</h1>
        </div>
        <button
          type="button"
          className="label-printer-print-button"
          onClick={() => window.print()}
          disabled={selectedItems.length === 0}
        >
          Print
        </button>

        <LabelPrinterConfigPanel config={config} onChange={setConfig} />

        <fieldset className="label-printer-filters">
          <legend>Filters</legend>
          <div className="label-printer-filters__row">
            <label>
              Booth
              <select
                value={boothFilter}
                onChange={(event) => handleBoothFilterChange(event.target.value)}
              >
                <option value="">— Select a booth —</option>
                {boothsData.map((booth) => (
                  <option key={booth.id} value={booth.id}>
                    {booth.fields['Booth Name'] ?? 'Untitled booth'}
                  </option>
                ))}
              </select>
            </label>
            {boothFilter && (
              <label>
                Wall
                <select
                  value={wallFilter}
                  onChange={(event) => handleWallFilterChange(event.target.value)}
                >
                  <option value="">All walls in this booth</option>
                  {wallsInSelectedBooth.map((wall) => (
                    <option key={wall.id} value={wall.id}>
                      {wall.fields['Wall Name'] ?? 'Untitled wall'}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="label-printer-filters__pills">
            {!boothFilter && (
              <span className="label-printer-pill label-printer-pill--muted">All Inventory</span>
            )}
            {boothFilter && (
              <span className="label-printer-pill">
                {boothsData.find((booth) => booth.id === boothFilter)?.fields['Booth Name'] ??
                  'Untitled booth'}
                <button
                  type="button"
                  onClick={() => handleBoothFilterChange('')}
                  aria-label="Clear booth filter"
                >
                  ×
                </button>
              </span>
            )}
            {wallFilter && (
              <span className="label-printer-pill">
                {wallsInSelectedBooth.find((wall) => wall.id === wallFilter)?.fields['Wall Name'] ??
                  'Untitled wall'}
                <button
                  type="button"
                  onClick={() => handleWallFilterChange('')}
                  aria-label="Clear wall filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </fieldset>

        <ItemSelectionList items={filteredItems} selectedIds={selectedIds} onChange={setSelectedIds} />

        <h2>Preview</h2>
      </div>

      <LabelSheet
        items={selectedItems}
        fieldKeys={config.fieldKeys}
        showLogo={config.showLogo}
        logoDataUrl={logo.data ?? null}
      />
    </main>
  )
}
