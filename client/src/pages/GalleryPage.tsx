import { HealthStatus } from '@/features/health/HealthStatus'
import { ItemsGallery } from '@/features/items/ItemsGallery'

export function GalleryPage() {
  return (
    <main>
      <h1>Gallery</h1>
      <ItemsGallery />
      <footer>
        <HealthStatus />
      </footer>
    </main>
  )
}
