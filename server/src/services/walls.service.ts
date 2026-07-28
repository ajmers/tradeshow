import { wallSchema, type Wall, type WallFields, type CreateWallInput } from '@shared'
import { listAllRecords, createRecord } from '@/lib/airtable'

const TABLE = 'Walls'

export async function listWalls(baseId: string): Promise<Wall[]> {
  const records = await listAllRecords<WallFields>(baseId, TABLE)
  return records.map((record) => wallSchema.parse(record))
}

export async function createWall(baseId: string, input: CreateWallInput): Promise<Wall> {
  const record = await createRecord<WallFields>(baseId, TABLE, input)
  return wallSchema.parse(record)
}
