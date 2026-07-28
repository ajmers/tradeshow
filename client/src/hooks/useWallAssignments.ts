import { useQuery } from '@tanstack/react-query'
import { fetchWallAssignments } from '@/api/wallAssignments'

export function useWallAssignments() {
  return useQuery({
    queryKey: ['wallAssignments'],
    queryFn: fetchWallAssignments,
  })
}
