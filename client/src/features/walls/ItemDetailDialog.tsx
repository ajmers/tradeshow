import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Item, Wall } from '@shared'
import { getItemImageUrl } from '@/features/items/getItemImageUrl'
import { useCreateSale } from '@/hooks/useSaleMutations'

interface MoveOptions {
  otherWalls: Wall[]
  onMove: (targetWallId: string) => Promise<unknown>
}

interface ItemDetailDialogProps {
  item: Item
  boothId: string
  /** Label for the removal action, e.g. "Remove from wall" or "Remove from floor". */
  removeLabel: string
  /** Deletes whatever placed this item (a wall assignment or a floor placement) — the
   *  dialog awaits it and closes on success, same as it already does for selling. */
  onRemove: () => Promise<unknown>
  onClose: () => void
  /** Omit for floor placements — "move to another wall" only makes sense for an
   *  item that's actually on a wall. */
  moveOptions?: MoveOptions
}

export function ItemDetailDialog({
  item,
  boothId,
  removeLabel,
  onRemove,
  onClose,
  moveOptions,
}: ItemDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState<'details' | 'sell' | 'move'>('details')
  const [salePrice, setSalePrice] = useState('')
  const [saleNotes, setSaleNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [moving, setMoving] = useState(false)

  const createSale = useCreateSale()

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

  const fields = item.fields
  const imageUrl = getItemImageUrl(item)
  const title = fields.Title ?? 'Untitled'

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await onRemove()
      dialogRef.current?.close()
    } finally {
      setRemoving(false)
    }
  }

  const handleMove = async (targetWallId: string) => {
    if (!moveOptions) {
      return
    }
    setMoving(true)
    try {
      await moveOptions.onMove(targetWallId)
      dialogRef.current?.close()
    } finally {
      setMoving(false)
    }
  }

  const handleSell = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createSale.mutateAsync({
        'Sale Price': salePrice ? Number(salePrice) : undefined,
        'Date Sold': new Date().toISOString().slice(0, 10),
        Venue: [boothId],
        'Sale Notes': saleNotes || undefined,
        'Items (Sale History Link)': [item.id],
      })
      dialogRef.current?.close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog ref={dialogRef} className="item-detail-dialog">
      <button
        type="button"
        className="item-detail__close"
        onClick={() => dialogRef.current?.close()}
        aria-label="Close"
      >
        ×
      </button>
      {mode === 'details' && (
        <div className="item-detail">
          {imageUrl ? (
            <img src={imageUrl} alt={title} />
          ) : (
            <div className="item-detail__placeholder" aria-hidden="true" />
          )}
          <h2>{title}</h2>
          {fields.Artist && <p className="item-detail__artist">{fields.Artist}</p>}
          {(fields.Height ?? fields.Width) && (
            <p className="item-detail__dimensions">
              {fields.Height ?? '?'} × {fields.Width ?? '?'}
              {fields.Depth ? ` × ${fields.Depth}` : ''} {fields['Unit of Measure'] ?? ''}
            </p>
          )}
          {fields.Condition && (
            <p>
              <strong>Condition:</strong> {fields.Condition}
            </p>
          )}
          {fields.Consigner && (
            <p>
              <strong>Consigner:</strong> {fields.Consigner}
            </p>
          )}
          {fields.Description && <p className="item-detail__description">{fields.Description}</p>}
          {fields['Is Prop'] && <p className="item-detail__prop-note">Prop — not for sale</p>}

          <div className="item-detail__actions">
            <button type="button" onClick={handleRemove} disabled={removing}>
              {removing ? 'Removing…' : removeLabel}
            </button>
            {!fields['Is Prop'] && (
              <button type="button" onClick={() => setMode('sell')}>
                Sell
              </button>
            )}
            {moveOptions && moveOptions.otherWalls.length > 0 && (
              <button type="button" onClick={() => setMode('move')}>
                Move to Another Wall
              </button>
            )}
          </div>
        </div>
      )}
      {mode === 'move' && moveOptions && (
        <div className="item-detail">
          <h2>Move &quot;{title}&quot;</h2>
          <ul className="item-detail__wall-list">
            {moveOptions.otherWalls.map((wall) => (
              <li key={wall.id}>
                <button type="button" onClick={() => handleMove(wall.id)} disabled={moving}>
                  {wall.fields['Wall Name'] ?? 'Untitled wall'}
                </button>
              </li>
            ))}
          </ul>
          <div className="item-detail__actions">
            <button type="button" onClick={() => setMode('details')} disabled={moving}>
              Back
            </button>
          </div>
        </div>
      )}
      {mode === 'sell' && (
        <form className="item-detail" onSubmit={handleSell}>
          <h2>Sell &quot;{title}&quot;</h2>
          <label>
            Sale price
            <input
              type="number"
              step="any"
              min="0"
              required
              value={salePrice}
              onChange={(event) => setSalePrice(event.target.value)}
            />
          </label>
          <label>
            Notes
            <textarea
              value={saleNotes}
              onChange={(event) => setSaleNotes(event.target.value)}
              rows={3}
            />
          </label>
          {error && (
            <p role="alert" className="item-detail__error">
              {error}
            </p>
          )}
          <div className="item-detail__actions">
            <button type="button" onClick={() => setMode('details')} disabled={submitting}>
              Back
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Recording sale…' : 'Confirm sale'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}
