import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { CreateWallInput } from '@shared'
import { useCreateWall } from '@/hooks/useWallMutations'

interface WallFormDialogProps {
  boothId: string
  onClose: () => void
}

export function WallFormDialog({ boothId, onClose }: WallFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const createWall = useCreateWall()

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
    const getNumber = (name: string) => {
      const value = getString(name)
      return value === undefined ? undefined : Number(value)
    }

    const input: CreateWallInput = {
      'Wall Name': getString('Wall Name') ?? '',
      Height: getNumber('Height'),
      Width: getNumber('Width'),
      'Unit of Measure': getString('Unit of Measure') as CreateWallInput['Unit of Measure'],
      'Wall Color': getString('Wall Color'),
      Description: getString('Description'),
      Location: getString('Location'),
      Booths: [boothId],
    }

    try {
      await createWall.mutateAsync(input)
      dialogRef.current?.close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <dialog ref={dialogRef} className="item-dialog">
      <form onSubmit={handleSubmit}>
        <h2>Add Wall</h2>

        <label>
          Wall Name
          <input name="Wall Name" required />
        </label>

        <div className="item-dialog__row item-dialog__row--3col">
          <label>
            Height
            <input name="Height" type="number" step="any" />
          </label>
          <label>
            Width
            <input name="Width" type="number" step="any" />
          </label>
          <label>
            Unit
            <select name="Unit of Measure" defaultValue="">
              <option value="">—</option>
              <option value="inches">inches</option>
              <option value="centimeters">centimeters</option>
              <option value="cm">cm</option>
            </select>
          </label>
        </div>

        <label>
          Wall Color
          <input name="Wall Color" type="color" defaultValue="#e4e4e7" />
        </label>

        <label>
          Location
          <input name="Location" />
        </label>
        <label>
          Description
          <textarea name="Description" rows={3} />
        </label>

        {error && (
          <p role="alert" className="item-dialog__error">
            {error}
          </p>
        )}

        <div className="item-dialog__actions">
          <button type="button" onClick={() => dialogRef.current?.close()} disabled={createWall.isPending}>
            Cancel
          </button>
          <button type="submit" disabled={createWall.isPending}>
            {createWall.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
