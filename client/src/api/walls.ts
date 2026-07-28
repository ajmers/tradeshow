import { z } from 'zod'
import { wallSchema, type Wall } from '@shared'

export async function fetchWalls(): Promise<Wall[]> {
  const res = await fetch('/api/walls')
  if (!res.ok) {
    throw new Error(`Failed to fetch walls: ${res.status}`)
  }
  return z.array(wallSchema).parse(await res.json())
}
