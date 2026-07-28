import { useState } from 'react'
import { BoothsGrid } from '@/features/booths/BoothsGrid'
import { BoothFormDialog } from '@/features/booths/BoothFormDialog'

export function BoothPlannerPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <main>
      <div className="page-header">
        <h1>Booth Planner</h1>
        <button type="button" onClick={() => setShowForm(true)}>
          Add Booth
        </button>
      </div>

      <BoothsGrid />

      {showForm && <BoothFormDialog onClose={() => setShowForm(false)} />}
    </main>
  )
}
