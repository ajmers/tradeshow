import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Item, CreateItemInput, UpdateItemInput } from '@shared'
import { useCreateItem, useUpdateItem, useUploadItemPhoto } from '@/hooks/useItemMutations'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

interface ItemFormDialogProps {
  item: Item | null
  onClose: () => void
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function ItemFormDialog({ item, onClose }: ItemFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()
  const uploadPhoto = useUploadItemPhoto()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }
    dialog.showModal()
    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  const fields = item?.fields

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const getString = (name: string) => {
      const value = formData.get(name)
      return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
    }
    const getNumber = (name: string) => {
      const value = getString(name)
      return value === undefined ? undefined : Number(value)
    }

    const input: CreateItemInput = {
      Title: getString('Title') ?? '',
      'Label Title': getString('Label Title'),
      Artist: getString('Artist'),
      Description: getString('Description'),
      Label: getString('Label'),
      Height: getNumber('Height'),
      Width: getNumber('Width'),
      Depth: getNumber('Depth'),
      'Unit of Measure': getString('Unit of Measure') as CreateItemInput['Unit of Measure'],
      Condition: getString('Condition') as CreateItemInput['Condition'],
      Location: getString('Location'),
      Consigner: getString('Consigner'),
      'List Price': getNumber('List Price'),
      Discount: getNumber('Discount'),
      'Is Prop': formData.get('Is Prop') === 'on',
    }

    const imageFiles = formData
      .getAll('Images')
      .filter((value): value is File => value instanceof File && value.size > 0)
    const croppedValue = formData.get('cropped image')
    const croppedFile = croppedValue instanceof File && croppedValue.size > 0 ? croppedValue : null

    for (const file of [...imageFiles, ...(croppedFile ? [croppedFile] : [])]) {
      if (file.size > MAX_PHOTO_BYTES) {
        setError(`"${file.name}" is larger than 5MB. Please choose a smaller file.`)
        return
      }
    }

    setSubmitting(true)
    try {
      const savedItem = item
        ? await updateItem.mutateAsync({ id: item.id, input: input as UpdateItemInput })
        : await createItem.mutateAsync(input)

      for (const file of imageFiles) {
        const base64 = await fileToBase64(file)
        await uploadPhoto.mutateAsync({
          id: savedItem.id,
          input: { field: 'Images', filename: file.name, contentType: file.type, file: base64 },
        })
      }

      if (croppedFile) {
        const base64 = await fileToBase64(croppedFile)
        await uploadPhoto.mutateAsync({
          id: savedItem.id,
          input: {
            field: 'cropped image',
            filename: croppedFile.name,
            contentType: croppedFile.type,
            file: base64,
          },
        })
      }

      dialogRef.current?.close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog ref={dialogRef} className="item-dialog">
      <form onSubmit={handleSubmit}>
        <h2>{item ? 'Edit Item' : 'Add Item'}</h2>

        <label>
          Title
          <input name="Title" defaultValue={fields?.Title} required />
        </label>
        <label>
          Label Title
          <input name="Label Title" defaultValue={fields?.['Label Title']} />
        </label>
        <label>
          Label (printed on the label sheet — supports basic Markdown)
          <textarea name="Label" defaultValue={fields?.Label} rows={3} />
        </label>
        <label>
          Artist
          <input name="Artist" defaultValue={fields?.Artist} />
        </label>
        <label>
          Description / Notes
          <textarea name="Description" defaultValue={fields?.Description} rows={3} />
        </label>

        <div className="item-dialog__row">
          <label>
            Height
            <input name="Height" type="number" step="any" defaultValue={fields?.Height} />
          </label>
          <label>
            Width
            <input name="Width" type="number" step="any" defaultValue={fields?.Width} />
          </label>
          <label>
            Depth
            <input name="Depth" type="number" step="any" defaultValue={fields?.Depth} />
          </label>
          <label>
            Unit
            <select name="Unit of Measure" defaultValue={fields?.['Unit of Measure'] ?? ''}>
              <option value="">—</option>
              <option value="inches">inches</option>
              <option value="centimeters">centimeters</option>
            </select>
          </label>
        </div>

        <label>
          Condition
          <select name="Condition" defaultValue={fields?.Condition ?? ''}>
            <option value="">—</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Needs Restoration">Needs Restoration</option>
          </select>
        </label>
        <label>
          Location
          <input name="Location" defaultValue={fields?.Location} />
        </label>
        <label>
          Consigner
          <input name="Consigner" defaultValue={fields?.Consigner} />
        </label>

        <div className="item-dialog__row item-dialog__row--2col">
          <label>
            List Price
            <input name="List Price" type="number" step="any" min="0" defaultValue={fields?.['List Price']} />
          </label>
          <label>
            Discount
            <input name="Discount" type="number" step="any" min="0" defaultValue={fields?.Discount} />
          </label>
        </div>

        <label className="item-dialog__checkbox">
          <input name="Is Prop" type="checkbox" defaultChecked={fields?.['Is Prop']} />
          Is prop (not for sale)
        </label>

        <label>
          Photos
          <input name="Images" type="file" accept="image/*" multiple />
        </label>
        <label>
          Display (cropped) photo
          <input name="cropped image" type="file" accept="image/*" />
        </label>

        {error && (
          <p role="alert" className="item-dialog__error">
            {error}
          </p>
        )}

        <div className="item-dialog__actions">
          <button type="button" onClick={() => dialogRef.current?.close()} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
