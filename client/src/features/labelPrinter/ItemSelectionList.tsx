import { useState } from 'react'
import type { Item } from '@shared'
import { getItemImageUrl } from '@/features/items/getItemImageUrl'

interface ItemSelectionListProps {
  items: Item[]
  selectedIds: Set<string>
  onChange: (selectedIds: Set<string>) => void
}

export function ItemSelectionList({ items, selectedIds, onChange }: ItemSelectionListProps) {
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()
  const visibleItems = query
    ? items.filter((item) => (item.fields.Title ?? '').toLowerCase().includes(query))
    : items

  function toggle(id: string, checked: boolean) {
    const next = new Set(selectedIds)
    if (checked) {
      next.add(id)
    } else {
      next.delete(id)
    }
    onChange(next)
  }

  function selectAllVisible() {
    onChange(new Set([...selectedIds, ...visibleItems.map((item) => item.id)]))
  }

  // Unlike "Select all" (deliberately scoped to what's visible, so search
  // doesn't silently pull in items you can't currently see), "Clear" clears
  // the whole selection — a search filter narrowing the list shouldn't leave
  // hidden items still selected behind it.
  function clearAll() {
    onChange(new Set())
  }

  return (
    <div className="label-printer-items">
      <div className="label-printer-items__toolbar">
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search items by name"
        />
        <button type="button" onClick={selectAllVisible}>
          Select all
        </button>
        <button type="button" onClick={clearAll}>
          Clear
        </button>
        <span className="label-printer-items__count">{selectedIds.size} selected</span>
      </div>

      {visibleItems.length === 0 ? (
        <p>No items match.</p>
      ) : (
        <ul className="label-printer-items__list">
          {visibleItems.map((item) => {
            const imageUrl = getItemImageUrl(item)
            const title = item.fields.Title ?? 'Untitled'
            return (
              <li key={item.id}>
                <label className="label-printer-items__item">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={(event) => toggle(item.id, event.target.checked)}
                  />
                  {imageUrl ? (
                    <img src={imageUrl} alt="" loading="lazy" />
                  ) : (
                    <div className="label-printer-items__placeholder" aria-hidden="true" />
                  )}
                  <span>{title}</span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
