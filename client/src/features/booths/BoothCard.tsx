import { Link } from 'react-router-dom'
import type { Booth } from '@shared'

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

export function BoothCard({ booth }: { booth: Booth }) {
  const fields = booth.fields
  const start = formatDate(fields['Event Start Date'])
  const end = formatDate(fields['Event End Date'])
  const dateRange = start && end ? `${start} – ${end}` : (start ?? end)

  return (
    <Link to={`/booth-planner/${booth.id}`} className="booth-card">
      <h3>{fields['Booth Name'] ?? 'Untitled booth'}</h3>
      {dateRange && <p className="booth-card__dates">{dateRange}</p>}
      <div className="booth-card__meta">
        {fields['Booth Type'] && <span className="booth-card__type">{fields['Booth Type']}</span>}
        {fields['Event Location'] && <span>{fields['Event Location']}</span>}
        {fields.Organizer && <span>Organizer: {fields.Organizer}</span>}
      </div>
      {fields.Notes && <p className="booth-card__notes">{fields.Notes}</p>}
    </Link>
  )
}
