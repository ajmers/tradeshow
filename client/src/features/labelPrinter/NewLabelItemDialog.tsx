import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Item } from '@shared'
import { useCreateItem } from '@/hooks/useItemMutations'
import { useItems } from '@/hooks/useItems'
import { LABEL_FIELDS } from '@/features/labelPrinter/labelFields'
import { EditableLabelField } from '@/features/labelPrinter/EditableLabelField'

const TITLE_FIELD = LABEL_FIELDS.find((field) => field.key === 'Title')
const LABEL_FIELD = LABEL_FIELDS.find((field) => field.key === 'Label')

interface NewLabelItemDialogProps {
  onClose: () => void
  onCreated: (item: Item) => void
}

// A lighter-weight sibling to ItemFormDialog: just the three fields a label
// actually needs (Title, Label Title, Label), for someone starting a new
// Item straight from the Label Printer rather than the Inventory page.
// Everything else on the item can be filled in later from Inventory.
//
// Two steps in the same dialog: fill in the basics and create the Item, then
// the dialog immediately shows that label for editing in place (via the same
// pencil-icon editors used in the main sheet) instead of closing — "New
// Label" is meant to feel like one continuous flow, not a form followed by
// a separate trip to go find and fix what you just made.
export function NewLabelItemDialog({ onClose, onCreated }: NewLabelItemDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [createdItemId, setCreatedItemId] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<'Title' | 'Label' | null>(null)
  const createItem = useCreateItem()
  const items = useItems()
  const queryClient = useQueryClient()

  // Reads the item back out of the live query (rather than holding a static
  // snapshot) so it reflects each edit as soon as EditableLabelField saves it.
  const createdItem = createdItemId ? items.data?.find((entry) => entry.id === createdItemId) : undefined

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const getString = (name: string) => {
      const value = formData.get(name)
      return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
    }

    try {
      const item = await createItem.mutateAsync({
        Title: getString('Title') ?? '',
        'Label Title': getString('Label Title'),
        Label: getString('Label'),
        'Label Size': getString('Label Size') as
          | 'Small'
          | 'Medium'
          | 'Large'
          | 'Full-page'
          | undefined,
      })
      // The mutation's own invalidateQueries triggers a background refetch, but
      // that's async — seed the cache with this exact response right away so
      // the preview step below (which reads the item back out of useItems())
      // has it on the very next render instead of a flash of "undefined".
      queryClient.setQueryData<Item[]>(['items'], (old) => (old ? [...old, item] : [item]))
      onCreated(item)
      setCreatedItemId(item.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (createdItem && TITLE_FIELD && LABEL_FIELD) {
    return (
      <dialog ref={dialogRef} className="item-dialog">
        <div className="new-label-preview">
          <h2>Your label</h2>
          <p className="item-dialog__hint">
            The item is saved. Click the pencil on either line below to adjust it.
          </p>
          <div className="new-label-preview__card">
            <EditableLabelField
              item={createdItem}
              field={TITLE_FIELD}
              value={TITLE_FIELD.getValue(createdItem) ?? ''}
              isEditing={editingKey === 'Title'}
              onStartEdit={() => setEditingKey('Title')}
              onStopEdit={() => setEditingKey(null)}
            />
            <EditableLabelField
              item={createdItem}
              field={LABEL_FIELD}
              value={LABEL_FIELD.getValue(createdItem) ?? ''}
              isEditing={editingKey === 'Label'}
              onStartEdit={() => setEditingKey('Label')}
              onStopEdit={() => setEditingKey(null)}
              placeholder="Click to add label text…"
            />
          </div>
          <div className="item-dialog__actions">
            <button type="button" onClick={() => dialogRef.current?.close()}>
              Done
            </button>
          </div>
        </div>
      </dialog>
    )
  }

  return (
    <dialog ref={dialogRef} className="item-dialog">
      <form onSubmit={handleSubmit}>
        <h2>New Label</h2>
        <p className="item-dialog__hint">
          Creates a new Item in your inventory. You can fill in the rest of its details — photos,
          dimensions, price, and so on — from the Inventory page afterward.
        </p>

        <label>
          Title
          <input name="Title" required />
        </label>
        <label>
          Label Title
          <input name="Label Title" />
        </label>
        <label>
          Label (printed on the label sheet — supports basic Markdown)
          <textarea name="Label" rows={3} />
        </label>
        <label>
          Label Size
          <select name="Label Size" defaultValue="">
            <option value="">Auto-size (based on content length)</option>
            <option value="Small">Small (8 per page)</option>
            <option value="Medium">Medium (4 per page)</option>
            <option value="Large">Large (2 per page)</option>
            <option value="Full-page">Full-page</option>
          </select>
        </label>

        {error && (
          <p role="alert" className="item-dialog__error">
            {error}
          </p>
        )}

        <div className="item-dialog__actions">
          <button type="button" onClick={() => dialogRef.current?.close()} disabled={createItem.isPending}>
            Cancel
          </button>
          <button type="submit" disabled={createItem.isPending}>
            {createItem.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
