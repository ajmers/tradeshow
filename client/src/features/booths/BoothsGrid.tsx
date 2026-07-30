import { useState } from 'react'
import { useBooths } from '@/hooks/useBooths'
import { BoothCard } from '@/features/booths/BoothCard'
import { BoothFormDialog } from '@/features/booths/BoothFormDialog'

export function BoothsGrid() {
  const { data, isPending, isError, error } = useBooths()
  const [showAddBooth, setShowAddBooth] = useState(false)

  return (
    <>
      <div className="page-toolbar">
        <button type="button" onClick={() => setShowAddBooth(true)}>
          Add Booth
        </button>
      </div>

      {isPending && <p>Loading booths…</p>}
      {isError && <p role="alert">Error loading booths: {error.message}</p>}
      {!isPending && !isError && data.length === 0 && <p>No booths yet.</p>}

      {!isPending && !isError && data.length > 0 && (
        <div className="booths-grid">
          {data.map((booth) => (
            <BoothCard key={booth.id} booth={booth} />
          ))}
        </div>
      )}

      {showAddBooth && <BoothFormDialog onClose={() => setShowAddBooth(false)} />}
    </>
  )
}
