import type { Item } from '@shared'
import { getItemImageUrl } from '@/features/items/getItemImageUrl'

interface AvailableItemsTrayProps {
  items: Item[]
  onSelect: (itemId: string) => void
}

export function AvailableItemsTray({ items, onSelect }: AvailableItemsTrayProps) {
  if (items.length === 0) {
    return <p>No available items to add.</p>
  }

  return (
    <div className="available-items-tray">
      {items.map((item) => {
        const imageUrl = getItemImageUrl(item)
        const title = item.fields.Title ?? 'Untitled'
        return (
          <button
            key={item.id}
            type="button"
            className="available-item"
            onClick={() => onSelect(item.id)}
            title={title}
          >
            {imageUrl ? (
              <img src={imageUrl} alt={title} loading="lazy" />
            ) : (
              <div className="available-item__placeholder" aria-hidden="true" />
            )}
            <span className="available-item__label">{title}</span>
          </button>
        )
      })}
    </div>
  )
}
