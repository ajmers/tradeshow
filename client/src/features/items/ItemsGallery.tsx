import { useMemo, useState } from 'react'
import type { Item } from '@shared'
import { useItems } from '@/hooks/useItems'
import { ItemCard } from '@/features/items/ItemCard'
import { ItemFormDialog } from '@/features/items/ItemFormDialog'

type SortOption = 'title-asc' | 'title-desc' | 'newest' | 'oldest'

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'title-asc', label: 'Title (A–Z)' },
  { value: 'title-desc', label: 'Title (Z–A)' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
]

function sortItems(items: Item[], sortBy: SortOption): Item[] {
  const sorted = [...items]
  switch (sortBy) {
    case 'title-asc':
      sorted.sort((a, b) => (a.fields.Title ?? '').localeCompare(b.fields.Title ?? ''))
      break
    case 'title-desc':
      sorted.sort((a, b) => (b.fields.Title ?? '').localeCompare(a.fields.Title ?? ''))
      break
    case 'newest':
      sorted.sort((a, b) => (b.createdTime ?? '').localeCompare(a.createdTime ?? ''))
      break
    case 'oldest':
      sorted.sort((a, b) => (a.createdTime ?? '').localeCompare(b.createdTime ?? ''))
      break
  }
  return sorted
}

export function ItemsGallery() {
  const { data, isPending, isError, error } = useItems()
  const [dialogState, setDialogState] = useState<Item | 'create' | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('title-asc')

  const visibleItems = useMemo(() => {
    if (!data) {
      return []
    }
    const query = search.trim().toLowerCase()
    const filtered = query
      ? data.filter((item) => (item.fields.Title ?? '').toLowerCase().includes(query))
      : data
    return sortItems(filtered, sortBy)
  }, [data, search, sortBy])

  return (
    <>
      <div className="gallery-toolbar">
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search items by name"
        />
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortOption)}
          aria-label="Sort items"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setDialogState('create')}>
          Add Item
        </button>
      </div>

      {isPending && <p>Loading items…</p>}
      {isError && <p role="alert">Error loading items: {error.message}</p>}
      {data && data.length === 0 && <p>No items yet.</p>}
      {data && data.length > 0 && visibleItems.length === 0 && <p>No items match your search.</p>}

      {visibleItems.length > 0 && (
        <div className="gallery">
          {visibleItems.map((item) => (
            <ItemCard key={item.id} item={item} onEdit={() => setDialogState(item)} />
          ))}
        </div>
      )}

      {dialogState && (
        <ItemFormDialog
          key={dialogState === 'create' ? 'create' : dialogState.id}
          item={dialogState === 'create' ? null : dialogState}
          onClose={() => setDialogState(null)}
        />
      )}
    </>
  )
}
