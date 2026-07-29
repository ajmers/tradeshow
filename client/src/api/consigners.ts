import { z } from 'zod'
import { consignerSchema, type Consigner } from '@shared'
import { apiFetch } from '@/lib/apiFetch'

export async function fetchConsigners(): Promise<Consigner[]> {
  const res = await apiFetch('/api/consigners')
  if (!res.ok) {
    throw new Error(`Failed to fetch consigners: ${res.status}`)
  }
  return z.array(consignerSchema).parse(await res.json())
}
