import { z } from 'zod'
import {
  floorPlacementSchema,
  type FloorPlacement,
  type CreateFloorPlacementInput,
  type UpdateFloorPlacementInput,
} from '@shared'
import { apiFetch } from '@/lib/apiFetch'

export async function fetchFloorPlacements(): Promise<FloorPlacement[]> {
  const res = await apiFetch('/api/floor-placements')
  if (!res.ok) {
    throw new Error(`Failed to fetch floor placements: ${res.status}`)
  }
  return z.array(floorPlacementSchema).parse(await res.json())
}

export async function createFloorPlacement(
  input: CreateFloorPlacementInput,
): Promise<FloorPlacement> {
  const res = await apiFetch('/api/floor-placements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(`Failed to add item to floor: ${res.status}`)
  }
  return floorPlacementSchema.parse(await res.json())
}

export async function updateFloorPlacement(
  id: string,
  input: UpdateFloorPlacementInput,
): Promise<FloorPlacement> {
  const res = await apiFetch(`/api/floor-placements/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(`Failed to update position: ${res.status}`)
  }
  return floorPlacementSchema.parse(await res.json())
}

export async function deleteFloorPlacement(id: string): Promise<void> {
  const res = await apiFetch(`/api/floor-placements/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    throw new Error(`Failed to remove item from floor: ${res.status}`)
  }
}
