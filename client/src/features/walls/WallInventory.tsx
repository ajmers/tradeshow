import { useState } from 'react'
import type { PlacedItem } from '@/features/walls/PlacedItem'
import { getItemImageUrl } from '@/features/items/getItemImageUrl'

interface WallInventoryProps {
  placedItems: PlacedItem[]
  selectedAssignmentId: string | null
  onSelect: (assignmentId: string) => void
}

export function WallInventory({ placedItems, selectedAssignmentId, onSelect }: WallInventoryProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <aside className={isOpen ? 'wall-inventory' : 'wall-inventory wall-inventory--collapsed'}>
      <button
        type="button"
        className="wall-inventory__toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Collapse wall inventory' : 'Expand wall inventory'}
      >
        {isOpen ? '›' : '‹'}
      </button>
      {isOpen && (
        <div className="wall-inventory__content">
          <h2>On this wall ({placedItems.length})</h2>
          {placedItems.length === 0 ? (
            <p>Nothing placed yet.</p>
          ) : (
            <ul>
              {placedItems.map(({ assignment, item, isSold }) => {
                const imageUrl = getItemImageUrl(item)
                const title = item.fields.Title ?? 'Untitled'
                const isSelected = assignment.id === selectedAssignmentId

                return (
                  <li key={assignment.id}>
                    <button
                      type="button"
                      className={
                        isSelected
                          ? 'wall-inventory-item wall-inventory-item--selected'
                          : 'wall-inventory-item'
                      }
                      onClick={() => onSelect(assignment.id)}
                    >
                      {imageUrl ? (
                        <img src={imageUrl} alt={title} loading="lazy" />
                      ) : (
                        <div className="wall-inventory-item__placeholder" aria-hidden="true" />
                      )}
                      <span className="wall-inventory-item__title">{title}</span>
                      {isSold && <span className="wall-inventory-item__sold">Sold</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </aside>
  )
}
