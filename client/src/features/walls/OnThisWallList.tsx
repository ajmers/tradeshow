import type { PlacedItem } from '@/features/walls/PlacedItem'
import { getItemImageUrl } from '@/features/items/getItemImageUrl'

interface OnThisWallListProps {
  placedItems: PlacedItem[]
  selectedAssignmentId: string | null
  onSelect: (assignmentId: string) => void
}

export function OnThisWallList({ placedItems, selectedAssignmentId, onSelect }: OnThisWallListProps) {
  return (
    <>
      <h2>On this wall ({placedItems.length})</h2>
      {placedItems.length === 0 ? (
        <p>Nothing placed yet.</p>
      ) : (
        <ul className="wall-editor-on-wall-list">
          {placedItems.map(({ assignment, item, isSold }) => {
            const imageUrl = getItemImageUrl(item)
            const title = item.fields.Title ?? 'Untitled'
            const isSelected = assignment.id === selectedAssignmentId

            return (
              <li key={assignment.id}>
                <button
                  type="button"
                  className={
                    isSelected ? 'on-this-wall-item on-this-wall-item--selected' : 'on-this-wall-item'
                  }
                  onClick={() => onSelect(assignment.id)}
                  title={title}
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt={title} loading="lazy" />
                  ) : (
                    <div className="on-this-wall-item__placeholder" aria-hidden="true" />
                  )}
                  <span className="on-this-wall-item__title">{title}</span>
                  {isSold && <span className="on-this-wall-item__sold">Sold</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
