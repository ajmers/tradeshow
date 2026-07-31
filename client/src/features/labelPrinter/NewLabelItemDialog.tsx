import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Item } from '@shared'
import { useCreateItem } from '@/hooks/useItemMutations'

interface NewLabelItemDialogProps {
  onClose: () => void
  onCreated: (item: Item) => void
}

// A lighter-weight sibling to ItemFormDialog: just the three fields a label
// actually needs (Title, Label Title, Label), for someone starting a new
// Item straight from the Label Printer rather than the Inventory page.
// Everything else on the item can be filled in later from Inventory.
export function NewLabelItemDialog({ onClose, onCreated }: NewLabelItemDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const createItem = useCreateItem()

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
      })
      onCreated(item)
      dialogRef.current?.close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
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
