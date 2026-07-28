import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSale } from '@/api/sales'
import type { CreateSaleInput } from '@shared'

export function useCreateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSaleInput) => createSale(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales'] }),
  })
}
