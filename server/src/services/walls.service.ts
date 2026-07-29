import {
  wallSchema,
  type Wall,
  type WallFields,
  type CreateWallInput,
  type UpdateWallInput,
} from '@shared'
import { listAllRecords, createRecord, updateRecord } from '@/lib/airtable'

const TABLE = 'Walls'

export async function listWalls(baseId: string): Promise<Wall[]> {
  const records = await listAllRecords<WallFields>(baseId, TABLE)
  return records.map((record) => wallSchema.parse(record))
}

export async function createWall(baseId: string, input: CreateWallInput): Promise<Wall> {
  const record = await createRecord<WallFields>(baseId, TABLE, input)
  return wallSchema.parse(record)
}

export async function updateWall(
  baseId: string,
  id: string,
  input: UpdateWallInput,
): Promise<Wall> {
  const record = await updateRecord<WallFields>(baseId, TABLE, id, input)
  return wallSchema.parse(record)
}
