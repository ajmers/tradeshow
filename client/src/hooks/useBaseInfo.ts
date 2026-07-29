import { useQuery } from '@tanstack/react-query'
import { fetchBaseInfo } from '@/api/base'

export function useBaseInfo() {
  return useQuery({
    queryKey: ['base'],
    queryFn: fetchBaseInfo,
  })
}
