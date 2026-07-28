import { useQuery } from '@tanstack/react-query'
import { fetchSales } from '@/api/sales'

export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: fetchSales,
  })
}
