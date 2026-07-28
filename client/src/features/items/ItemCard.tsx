import type { Item } from '@shared'
import { useDeleteItem } from '@/hooks/useItemMutations'
import { getItemImageUrl } from '@/features/items/getItemImageUrl'

interface ItemCardProps {
  item: Item
  onEdit: () => void
}

export function ItemCard({ item, onEdit }: ItemCardProps) {
  const fields = item.fields
  const imageUrl = getItemImageUrl(item)
  const deleteItem = useDeleteItem()

  function handleDelete() {
    if (!window.confirm(`Delete "${fields.Title ?? 'this item'}"? This cannot be undone.`)) {
      return
    }
    deleteItem.mutate(item.id)
  }

  return (
    <article className="item-card">
      {imageUrl ? (
        <img src={imageUrl} alt={fields.Title ?? 'Untitled artwork'} loading="lazy" />
      ) : (
        <div className="item-card__placeholder" aria-hidden="true" />
      )}
      <div className="item-card__body">
        <h3>{fields.Title ?? 'Untitled'}</h3>
        {fields.Artist && <p className="item-card__artist">{fields.Artist}</p>}
        {(fields.Height ?? fields.Width) && (
          <p className="item-card__dimensions">
            {fields.Height ?? '?'} × {fields.Width ?? '?'}
            {fields.Depth ? ` × ${fields.Depth}` : ''} {fields['Unit of Measure'] ?? ''}
          </p>
        )}
        {fields.Condition && <span className="item-card__condition">{fields.Condition}</span>}
        <div className="item-card__actions">
          <button type="button" onClick={onEdit}>
            Edit
          </button>
          <button type="button" onClick={handleDelete} disabled={deleteItem.isPending}>
            {deleteItem.isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  )
}
