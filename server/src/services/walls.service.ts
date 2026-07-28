import { wallSchema, type Wall, type WallFields } from '@shared'
import { listAllRecords } from '@/lib/airtable'

const TABLE = 'Walls'

export async function listWalls(baseId: string): Promise<Wall[]> {
  const records = await listAllRecords<WallFields>(baseId, TABLE)
  return records.map((record) => wallSchema.parse(record))
}
