import { BoothsGrid } from '@/features/booths/BoothsGrid'

export function Booth3DPlannerPage() {
  return (
    <main>
      <h1>Booth Planner 3D</h1>
      <p>Choose a booth to lay out its walls in 3D.</p>
      <BoothsGrid basePath="/booth-planner-3d" />
    </main>
  )
}
