import { wallSchema, type Wall, type WallFields } from '@shared'
import { listAllRecords } from '@/lib/airtable'

const TABLE = 'Walls'

export async function listWalls(): Promise<Wall[]> {
  const records = await listAllRecords<WallFields>(TABLE)
  return records.map((record) => wallSchema.parse(record))
}
