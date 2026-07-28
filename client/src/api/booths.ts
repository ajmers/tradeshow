import { z } from 'zod'
import { boothSchema, type Booth } from '@shared'
import { apiFetch } from '@/lib/apiFetch'

export async function fetchBooths(): Promise<Booth[]> {
  const res = await apiFetch('/api/booths')
  if (!res.ok) {
    throw new Error(`Failed to fetch booths: ${res.status}`)
  }
  return z.array(boothSchema).parse(await res.json())
}
