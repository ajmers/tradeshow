import { useQuery } from '@tanstack/react-query'
import { fetchItems } from '@/api/items'

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
  })
}
