import { useQuery } from '@tanstack/react-query'
import { fetchWalls } from '@/api/walls'

export function useWalls() {
  return useQuery({
    queryKey: ['walls'],
    queryFn: fetchWalls,
  })
}
