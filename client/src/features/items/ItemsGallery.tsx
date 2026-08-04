import { useMemo, useState } from 'react'
import type { Item } from '@shared'
import { useItems } from '@/hooks/useItems'
import { ItemCard } from '@/features/items/ItemCard'
import { ItemFormDialog } from '@/features/items/ItemFormDialog'

type SortOption = 'title-asc' | 'title-desc' | 'newest' | 'oldest'
type PropsFilter = 'all' | 'props' | 'non-props'

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'title-asc', label: 'Title (A–Z)' },
  { value: 'title-desc', label: 'Title (Z–A)' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
]

const propsFilterOptions: Array<{ value: PropsFilter; label: string }> = [
  { value: 'all', label: 'All items' },
  { value: 'props', label: 'Props only' },
  { value: 'non-props', label: 'Exclude props' },
]

function filterByPropsStatus(items: Item[], propsFilter: PropsFilter): Item[] {
  switch (propsFilter) {
    case 'props':
      return items.filter((item) => item.fields['Is Prop'])
    case 'non-props':
      return items.filter((item) => !item.fields['Is Prop'])
    case 'all':
      return items
  }
}

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
  const [propsFilter, setPropsFilter] = useState<PropsFilter>('all')

  const visibleItems = useMemo(() => {
    if (!data) {
      return []
    }
    const query = search.trim().toLowerCase()
    const searched = query
      ? data.filter((item) => (item.fields.Title ?? '').toLowerCase().includes(query))
      : data
    const filtered = filterByPropsStatus(searched, propsFilter)
    return sortItems(filtered, sortBy)
  }, [data, search, sortBy, propsFilter])

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
        <select
          value={propsFilter}
          onChange={(event) => setPropsFilter(event.target.value as PropsFilter)}
          aria-label="Filter by prop status"
        >
          {propsFilterOptions.map((option) => (
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
      {data && data.length > 0 && visibleItems.length === 0 && (
        <p>No items match your search and filters.</p>
      )}

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
