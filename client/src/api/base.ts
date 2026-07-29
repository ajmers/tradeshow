import { baseInfoSchema, type BaseInfo } from '@shared'
import { apiFetch } from '@/lib/apiFetch'

export async function fetchBaseInfo(): Promise<BaseInfo> {
  const res = await apiFetch('/api/base')
  if (!res.ok) {
    throw new Error(`Failed to fetch base info: ${res.status}`)
  }
  return baseInfoSchema.parse(await res.json())
}
