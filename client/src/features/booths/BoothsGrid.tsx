import { useBooths } from '@/hooks/useBooths'
import { BoothCard } from '@/features/booths/BoothCard'

export function BoothsGrid() {
  const { data, isPending, isError, error } = useBooths()

  if (isPending) {
    return <p>Loading booths…</p>
  }

  if (isError) {
    return <p role="alert">Error loading booths: {error.message}</p>
  }

  if (data.length === 0) {
    return <p>No booths yet.</p>
  }

  return (
    <div className="booths-grid">
      {data.map((booth) => (
        <BoothCard key={booth.id} booth={booth} />
      ))}
    </div>
  )
}
