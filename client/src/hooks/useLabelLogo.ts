import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchLabelLogo, updateLabelLogo } from '@/api/labelLogo'

export function useLabelLogo() {
  return useQuery({
    queryKey: ['labelLogo'],
    queryFn: fetchLabelLogo,
  })
}

export function useUpdateLabelLogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dataUrl: string | null) => updateLabelLogo(dataUrl),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['labelLogo'] }),
  })
}
