import { useQuery } from '@tanstack/react-query'
import { fetchConsigners } from '@/api/consigners'

export function useConsigners() {
  return useQuery({
    queryKey: ['consigners'],
    queryFn: fetchConsigners,
  })
}
