import {
  floorPlacementSchema,
  type FloorPlacement,
  type FloorPlacementFields,
  type CreateFloorPlacementInput,
  type UpdateFloorPlacementInput,
} from '@shared'
import { listAllRecords, createRecord, updateRecord, deleteRecord } from '@/lib/airtable'

const TABLE = 'Floor Placements'

export async function listFloorPlacements(baseId: string): Promise<FloorPlacement[]> {
  const records = await listAllRecords<FloorPlacementFields>(baseId, TABLE)
  return records.map((record) => floorPlacementSchema.parse(record))
}

export async function createFloorPlacement(
  baseId: string,
  input: CreateFloorPlacementInput,
): Promise<FloorPlacement> {
  const record = await createRecord<FloorPlacementFields>(baseId, TABLE, input)
  return floorPlacementSchema.parse(record)
}

export async function updateFloorPlacement(
  baseId: string,
  id: string,
  input: UpdateFloorPlacementInput,
): Promise<FloorPlacement> {
  const record = await updateRecord<FloorPlacementFields>(baseId, TABLE, id, input)
  return floorPlacementSchema.parse(record)
}

export async function deleteFloorPlacement(baseId: string, id: string): Promise<void> {
  await deleteRecord(baseId, TABLE, id)
}
