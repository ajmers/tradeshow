import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { CreateBoothInput } from '@shared'
import { useCreateBooth } from '@/hooks/useBoothMutations'

interface BoothFormDialogProps {
  onClose: () => void
}

export function BoothFormDialog({ onClose }: BoothFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const createBooth = useCreateBooth()

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

    const input: CreateBoothInput = {
      'Booth Name': getString('Booth Name') ?? '',
      'Event Start Date': getString('Event Start Date'),
      'Event End Date': getString('Event End Date'),
      'Event Location': getString('Event Location'),
      Organizer: getString('Organizer'),
      Notes: getString('Notes'),
    }

    try {
      await createBooth.mutateAsync(input)
      dialogRef.current?.close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <dialog ref={dialogRef} className="item-dialog">
      <form onSubmit={handleSubmit}>
        <h2>Add Booth</h2>

        <label>
          Booth Name
          <input name="Booth Name" required />
        </label>
        <div className="item-dialog__row item-dialog__row--2col">
          <label>
            Event Start Date
            <input name="Event Start Date" type="date" />
          </label>
          <label>
            Event End Date
            <input name="Event End Date" type="date" />
          </label>
        </div>

        <label>
          Event Location
          <input name="Event Location" />
        </label>
        <label>
          Organizer
          <input name="Organizer" />
        </label>
        <label>
          Notes
          <textarea name="Notes" rows={3} />
        </label>

        {error && (
          <p role="alert" className="item-dialog__error">
            {error}
          </p>
        )}

        <div className="item-dialog__actions">
          <button type="button" onClick={() => dialogRef.current?.close()} disabled={createBooth.isPending}>
            Cancel
          </button>
          <button type="submit" disabled={createBooth.isPending}>
            {createBooth.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
