import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { CreateBoothInput } from '@shared'
import { useCreateBooth } from '@/hooks/useBoothMutations'

interface BoothFormDialogProps {
  onClose: () => void
}

const boothTypes = ['Solo', 'Group', 'Gallery', 'Fair', 'Pop-Up', 'Other'] as const

export function BoothFormDialog({ onClose }: BoothFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
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
      'Booth Type': getString('Booth Type') as CreateBoothInput['Booth Type'],
      'Event Location': getString('Event Location'),
      Organizer: getString('Organizer'),
      Notes: getString('Notes'),
    }

    setSubmitting(true)
    try {
      await createBooth.mutateAsync(input)
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
        <h2>Add Booth</h2>

        <label>
          Booth Name
          <input name="Booth Name" required />
        </label>
        <label>
          Start Date
          <input name="Event Start Date" type="date" />
        </label>
        <label>
          End Date
          <input name="Event End Date" type="date" />
        </label>
        <label>
          Booth Type
          <select name="Booth Type" defaultValue="">
            <option value="">—</option>
            {boothTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
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
