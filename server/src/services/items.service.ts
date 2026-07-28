import {
  itemSchema,
  type Item,
  type ItemFields,
  type CreateItemInput,
  type UpdateItemInput,
  type UploadItemPhotoInput,
} from '@shared'
import {
  listAllRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  uploadAttachment,
} from '@/lib/airtable'

const TABLE = 'Items'

export async function listItems(baseId: string): Promise<Item[]> {
  const records = await listAllRecords<ItemFields>(baseId, TABLE)
  return records.map((record) => itemSchema.parse(record))
}

export async function createItem(baseId: string, input: CreateItemInput): Promise<Item> {
  const record = await createRecord<ItemFields>(baseId, TABLE, input)
  return itemSchema.parse(record)
}

export async function updateItem(
  baseId: string,
  id: string,
  input: UpdateItemInput,
): Promise<Item> {
  const record = await updateRecord<ItemFields>(baseId, TABLE, id, input)
  return itemSchema.parse(record)
}

export async function deleteItem(baseId: string, id: string): Promise<void> {
  await deleteRecord(baseId, TABLE, id)
}

export async function uploadItemPhoto(
  baseId: string,
  id: string,
  photo: UploadItemPhotoInput,
): Promise<Item> {
  await uploadAttachment(baseId, id, photo.field, {
    contentType: photo.contentType,
    file: photo.file,
    filename: photo.filename,
  })
  const record = await getRecord<ItemFields>(baseId, TABLE, id)
  return itemSchema.parse(record)
}
