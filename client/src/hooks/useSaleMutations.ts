import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSale } from '@/api/sales'
import type { CreateSaleInput } from '@shared'

export function useCreateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSaleInput) => createSale(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      // A sale's Venue link populates the booth's reciprocal `Sales` field (used for
      // the sale count on booth cards), so that cached list goes stale too.
      queryClient.invalidateQueries({ queryKey: ['booths'] })
    },
  })
}
