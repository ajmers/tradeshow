import {
  wallAssignmentSchema,
  type WallAssignment,
  type WallAssignmentFields,
  type CreateWallAssignmentInput,
  type UpdateWallAssignmentInput,
} from '@shared'
import { listAllRecords, createRecord, updateRecord, deleteRecord } from '@/lib/airtable'

const TABLE = 'Wall Assignments'

export async function listWallAssignments(baseId: string): Promise<WallAssignment[]> {
  const records = await listAllRecords<WallAssignmentFields>(baseId, TABLE)
  return records.map((record) => wallAssignmentSchema.parse(record))
}

export async function createWallAssignment(
  baseId: string,
  input: CreateWallAssignmentInput,
): Promise<WallAssignment> {
  const record = await createRecord<WallAssignmentFields>(baseId, TABLE, input)
  return wallAssignmentSchema.parse(record)
}

export async function updateWallAssignment(
  baseId: string,
  id: string,
  input: UpdateWallAssignmentInput,
): Promise<WallAssignment> {
  const record = await updateRecord<WallAssignmentFields>(baseId, TABLE, id, input)
  return wallAssignmentSchema.parse(record)
}

export async function deleteWallAssignment(baseId: string, id: string): Promise<void> {
  await deleteRecord(baseId, TABLE, id)
}
