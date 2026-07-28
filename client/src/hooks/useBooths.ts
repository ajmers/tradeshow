import { useQuery } from '@tanstack/react-query'
import { fetchBooths } from '@/api/booths'

export function useBooths() {
  return useQuery({
    queryKey: ['booths'],
    queryFn: fetchBooths,
  })
}
