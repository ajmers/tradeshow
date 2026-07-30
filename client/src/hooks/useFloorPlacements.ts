import { useQuery } from '@tanstack/react-query'
import { fetchFloorPlacements } from '@/api/floorPlacements'

export function useFloorPlacements() {
  return useQuery({
    queryKey: ['floorPlacements'],
    queryFn: fetchFloorPlacements,
  })
}
