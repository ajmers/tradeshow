import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { CreateWallInput } from '@shared'
import { useCreateWall } from '@/hooks/useWallMutations'

interface WallFormDialogProps {
  boothId: string
  existingColors: string[]
  onClose: () => void
}

const DEFAULT_WALL_COLOR = '#94a3b8'

export function WallFormDialog({ boothId, existingColors, onClose }: WallFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [color, setColor] = useState(existingColors[0] ?? DEFAULT_WALL_COLOR)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
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
      'Wall Color': getString('Wall Color'),
      Booths: [boothId],
    }

    setSubmitting(true)
    try {
      await createWall.mutateAsync(input)
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
        <h2>Add Wall</h2>

        <label>
          Wall Name
          <input name="Wall Name" required />
        </label>

        <div className="item-dialog__row item-dialog__row--2col">
          <label>
            Height (ft)
            <input name="Height" type="number" step="any" min="0" />
          </label>
          <label>
            Width (ft)
            <input name="Width" type="number" step="any" min="0" />
          </label>
        </div>

        <label>
          Wall Color
          <input
            name="Wall Color"
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          />
        </label>

        {existingColors.length > 0 && (
          <div className="wall-color-swatches">
            {existingColors.map((swatch) => (
              <button
                key={swatch}
                type="button"
                className={
                  swatch === color ? 'wall-color-swatch wall-color-swatch--selected' : 'wall-color-swatch'
                }
                style={{ backgroundColor: swatch }}
                onClick={() => setColor(swatch)}
                title={swatch}
                aria-label={`Use color ${swatch}`}
              />
            ))}
          </div>
        )}

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
