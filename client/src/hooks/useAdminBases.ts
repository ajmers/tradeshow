import { useQuery } from '@tanstack/react-query'
import { fetchAdminBases } from '@/api/admin'

export function useAdminBases() {
  return useQuery({
    queryKey: ['admin', 'bases'],
    queryFn: fetchAdminBases,
  })
}
