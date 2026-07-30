import {
  boothSchema,
  type Booth,
  type BoothFields,
  type CreateBoothInput,
  type UpdateBoothInput,
} from '@shared'
import { listAllRecords, createRecord, updateRecord, deleteRecord } from '@/lib/airtable'
import { listWalls, deleteWall } from '@/services/walls.service'
import { listWallAssignments, deleteWallAssignment } from '@/services/wallAssignments.service'
import { listFloorPlacements, deleteFloorPlacement } from '@/services/floorPlacements.service'

const TABLE = 'Booths'

export async function listBooths(baseId: string): Promise<Booth[]> {
  const records = await listAllRecords<BoothFields>(baseId, TABLE)
  return records.map((record) => boothSchema.parse(record))
}

export async function createBooth(baseId: string, input: CreateBoothInput): Promise<Booth> {
  const record = await createRecord<BoothFields>(baseId, TABLE, input)
  return boothSchema.parse(record)
}

export async function updateBooth(
  baseId: string,
  id: string,
  input: UpdateBoothInput,
): Promise<Booth> {
  const record = await updateRecord<BoothFields>(baseId, TABLE, id, input)
  return boothSchema.parse(record)
}

// Deletes everything that only makes sense in the context of this booth — its
// walls (and, transitively, their wall assignments) and its floor placements.
// Sales records are left alone: they're financial history, not layout data, and
// should survive even if the booth that generated them is later deleted.
export async function deleteBooth(baseId: string, id: string): Promise<void> {
  const [walls, assignments, floorPlacements] = await Promise.all([
    listWalls(baseId),
    listWallAssignments(baseId),
    listFloorPlacements(baseId),
  ])

  const wallIdsInBooth = walls
    .filter((wall) => wall.fields.Booths?.includes(id))
    .map((wall) => wall.id)
  const assignmentsInBooth = assignments.filter((assignment) => assignment.fields.Booth?.includes(id))
  const floorPlacementsInBooth = floorPlacements.filter((placement) =>
    placement.fields.Booth?.includes(id),
  )

  await Promise.all([
    ...assignmentsInBooth.map((assignment) => deleteWallAssignment(baseId, assignment.id)),
    ...floorPlacementsInBooth.map((placement) => deleteFloorPlacement(baseId, placement.id)),
  ])

  // Any assignments on these walls are already gone from the sweep above (matched
  // by Booth, not Wall), so deleteWall's own cascade is just a no-op safety net here.
  await Promise.all(wallIdsInBooth.map((wallId) => deleteWall(baseId, wallId)))

  await deleteRecord(baseId, TABLE, id)
}
