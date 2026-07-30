import {
  wallSchema,
  type Wall,
  type WallFields,
  type CreateWallInput,
  type UpdateWallInput,
} from '@shared'
import { listAllRecords, createRecord, updateRecord, deleteRecord } from '@/lib/airtable'
import { listWallAssignments, deleteWallAssignment } from '@/services/wallAssignments.service'

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

export async function deleteWall(baseId: string, id: string): Promise<void> {
  const assignments = await listWallAssignments(baseId)
  const assignmentsOnWall = assignments.filter((assignment) => assignment.fields.Wall?.includes(id))
  await Promise.all(
    assignmentsOnWall.map((assignment) => deleteWallAssignment(baseId, assignment.id)),
  )
  await deleteRecord(baseId, TABLE, id)
}
