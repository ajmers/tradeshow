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

export async function listItems(): Promise<Item[]> {
  const records = await listAllRecords<ItemFields>(TABLE)
  return records.map((record) => itemSchema.parse(record))
}

export async function createItem(input: CreateItemInput): Promise<Item> {
  const record = await createRecord<ItemFields>(TABLE, input)
  return itemSchema.parse(record)
}

export async function updateItem(id: string, input: UpdateItemInput): Promise<Item> {
  const record = await updateRecord<ItemFields>(TABLE, id, input)
  return itemSchema.parse(record)
}

export async function deleteItem(id: string): Promise<void> {
  await deleteRecord(TABLE, id)
}

export async function uploadItemPhoto(id: string, photo: UploadItemPhotoInput): Promise<Item> {
  await uploadAttachment(id, photo.field, {
    contentType: photo.contentType,
    file: photo.file,
    filename: photo.filename,
  })
  const record = await getRecord<ItemFields>(TABLE, id)
  return itemSchema.parse(record)
}
