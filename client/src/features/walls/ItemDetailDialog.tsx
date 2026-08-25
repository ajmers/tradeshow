import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Item, Wall } from '@shared'
import { getItemImageUrl } from '@/features/items/getItemImageUrl'
import { useCreateSale } from '@/hooks/useSaleMutations'

function RemoveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  )
}

function MoveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 3v18M3 12h18" />
      <path d="M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M11 3.5h6.5a1 1 0 0 1 1 1V11a1 1 0 0 1-.29.71l-8 8a1 1 0 0 1-1.42 0l-6.5-6.5a1 1 0 0 1 0-1.42l8-8a1 1 0 0 1 .71-.29z" />
      <circle cx="15.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

interface MoveOptions {
  otherWalls: Wall[]
  onMove: (targetWallId: string) => Promise<unknown>
}

export type LabelState = 'default' | 'shown' | 'hidden'

interface LabelOptions {
  // "default" follows the wall's own Show Labels setting; "shown"/"hidden"
  // force this item's label regardless of it.
  state: LabelState
  onSetState: (next: LabelState) => Promise<unknown>
}

const NEXT_LABEL_STATE: Record<LabelState, LabelState> = {
  default: 'shown',
  shown: 'hidden',
  hidden: 'default',
}

const LABEL_STATE_TEXT: Record<LabelState, string> = {
  default: 'Label: Default',
  shown: 'Label: Shown',
  hidden: 'Label: Hidden',
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
  /** Omit for floor placements — a floor item has no on-wall label to hide. */
  labelOptions?: LabelOptions
}

export function ItemDetailDialog({
  item,
  boothId,
  removeLabel,
  onRemove,
  onClose,
  moveOptions,
  labelOptions,
}: ItemDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const moveMenuRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'details' | 'sell'>('details')
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const [salePrice, setSalePrice] = useState('')
  const [saleNotes, setSaleNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [moving, setMoving] = useState(false)
  const [togglingLabel, setTogglingLabel] = useState(false)

  const createSale = useCreateSale()

  useEffect(() => {
    if (!showMoveMenu) {
      return
    }
    function handleClickOutside(event: MouseEvent) {
      if (moveMenuRef.current && !moveMenuRef.current.contains(event.target as Node)) {
        setShowMoveMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMoveMenu])

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
      setShowMoveMenu(false)
      dialogRef.current?.close()
    } finally {
      setMoving(false)
    }
  }

  const handleToggleLabel = async () => {
    if (!labelOptions) {
      return
    }
    setTogglingLabel(true)
    try {
      await labelOptions.onSetState(NEXT_LABEL_STATE[labelOptions.state])
    } finally {
      setTogglingLabel(false)
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
              <RemoveIcon />
              {removing ? 'Removing…' : removeLabel}
            </button>
            {moveOptions && moveOptions.otherWalls.length > 0 && (
              <div className="item-detail__move-menu" ref={moveMenuRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={showMoveMenu}
                  disabled={moving}
                  onClick={() => setShowMoveMenu((prev) => !prev)}
                >
                  <MoveIcon />
                  {moving ? 'Moving…' : 'Move to Another Wall'}
                </button>
                {showMoveMenu && (
                  <div className="item-detail__move-menu__dropdown" role="menu">
                    {moveOptions.otherWalls.map((wall) => (
                      <button
                        key={wall.id}
                        type="button"
                        role="menuitem"
                        disabled={moving}
                        onClick={() => handleMove(wall.id)}
                      >
                        {wall.fields['Wall Name'] ?? 'Untitled wall'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {labelOptions && (
              <button
                type="button"
                onClick={handleToggleLabel}
                disabled={togglingLabel}
                title="Cycles between following the wall's default, always showing, and always hiding this item's label"
              >
                <TagIcon />
                {togglingLabel ? 'Updating…' : LABEL_STATE_TEXT[labelOptions.state]}
              </button>
            )}
            {!fields['Is Prop'] && (
              <button type="button" className="item-detail__sell-button" onClick={() => setMode('sell')}>
                $ Sell
              </button>
            )}
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
