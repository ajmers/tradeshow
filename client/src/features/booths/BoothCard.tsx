import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Booth } from '@shared'
import { BoothReportDialog } from '@/features/booths/BoothReportDialog'
import { useWallAssignments } from '@/hooks/useWallAssignments'

function formatDate(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

type EventStatus = 'upcoming' | 'ongoing' | 'past'

function getEventStatus(start: string | undefined, end: string | undefined): EventStatus | null {
  if (!start && !end) {
    return null
  }
  const now = new Date()
  const startDate = start ? new Date(start) : undefined
  const endDate = end ? new Date(end) : startDate
  if (startDate && now < startDate) {
    return 'upcoming'
  }
  if (endDate && now > endDate) {
    return 'past'
  }
  return 'ongoing'
}

const STATUS_LABELS: Record<EventStatus, string> = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  past: 'Past',
}

export function BoothCard({ booth }: { booth: Booth }) {
  const fields = booth.fields
  const start = formatDate(fields['Event Start Date'])
  const end = formatDate(fields['Event End Date'])
  const dateRange = start && end ? `${start} – ${end}` : (start ?? end)
  const status = getEventStatus(fields['Event Start Date'], fields['Event End Date'])
  const [showReport, setShowReport] = useState(false)
  const navigate = useNavigate()
  const wallAssignments = useWallAssignments()

  const wallCount = fields.Walls?.length ?? 0
  // Counted via the booth's own Walls list rather than the Wall Assignment records'
  // reciprocal Booth field, since that field isn't reliably set on every assignment
  // (e.g. ones created outside the app) even when the Wall link is correct.
  const boothWallIds = new Set(fields.Walls ?? [])
  const itemCount = (wallAssignments.data ?? []).filter((assignment) =>
    boothWallIds.has(assignment.fields.Wall?.[0] ?? ''),
  ).length
  const saleCount = fields.Sales?.length ?? 0

  return (
    <>
      <Link to={`/booth-planner/${booth.id}`} className="booth-card">
        <div className="booth-card__header">
          <h3>{fields['Booth Name'] ?? 'Untitled booth'}</h3>
          {status && (
            <span className={`booth-card__status booth-card__status--${status}`}>
              {STATUS_LABELS[status]}
            </span>
          )}
        </div>
        {dateRange && <p className="booth-card__dates">{dateRange}</p>}
        <div className="booth-card__meta">
          {fields['Event Location'] && <span>{fields['Event Location']}</span>}
          {fields.Organizer && <span>Organizer: {fields.Organizer}</span>}
        </div>
        <div className="booth-card__stats">
          <span>
            {wallCount} {wallCount === 1 ? 'wall' : 'walls'}
          </span>
          <span>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
          <span>
            {saleCount} {saleCount === 1 ? 'sale' : 'sales'}
          </span>
        </div>
        {fields.Notes && <p className="booth-card__notes">{fields.Notes}</p>}
        <div className="booth-card__actions">
          <button
            type="button"
            className="booth-card__report-button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setShowReport(true)
            }}
          >
            Run Booth Report
          </button>
          <button
            type="button"
            className="booth-card__report-button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              navigate(`/label-printer?boothId=${booth.id}`)
            }}
          >
            Print Labels
          </button>
        </div>
      </Link>

      {showReport && <BoothReportDialog booth={booth} onClose={() => setShowReport(false)} />}
    </>
  )
}
