import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import type { Item } from '@shared'
import { LABEL_FIELDS } from '@/features/labelPrinter/labelFields'
import { PAGE_LAYOUTS } from '@/features/labelPrinter/labelPrinterConfig'
import {
  bucketItemsByWordCount,
  BUCKET_LABELS_PER_PAGE,
  BUCKET_TITLES,
} from '@/features/labelPrinter/labelBucketing'
import { EditableLabelField } from '@/features/labelPrinter/EditableLabelField'

interface LabelSheetProps {
  items: Item[]
  fieldKeys: string[]
  showLogo: boolean
  logoDataUrl: string | null
}

function chunk<T>(list: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size))
  }
  return chunks
}

// Only these two are actually "the label's own text" as opposed to data
// pulled in from the rest of the item record — Title edits write to Label
// Title specifically (see EditableLabelField), never to the item's real
// Title, so quick-editing a label can't rename it everywhere else.
const EDITABLE_FIELD_KEYS = new Set(['Title', 'Label'])

export function LabelSheet({ items, fieldKeys, showLogo, logoDataUrl }: LabelSheetProps) {
  const fields = LABEL_FIELDS.filter((field) => fieldKeys.includes(field.key))
  const hasLogo = showLogo && Boolean(logoDataUrl)
  // At most one field editing at a time, identified by "<itemId>:<fieldKey>".
  const [editingKey, setEditingKey] = useState<string | null>(null)

  if (items.length === 0) {
    return <p>Select at least one item to preview labels.</p>
  }

  const groups = bucketItemsByWordCount(items, fields)

  return (
    <div className="label-sheet">
      {groups.map(({ bucket, items: bucketItems }) => {
        const labelsPerPage = BUCKET_LABELS_PER_PAGE[bucket]
        const layout = PAGE_LAYOUTS[labelsPerPage] ?? { columns: 2, rows: 4 }
        const pages = chunk(bucketItems, labelsPerPage)

        return (
          <div key={bucket} className="label-sheet__group">
            <h3 className="label-sheet__group-title">{BUCKET_TITLES[bucket]}</h3>
            {pages.map((pageItems, pageIndex) => (
              <div
                key={pageIndex}
                className="label-sheet__page"
                style={{
                  // minmax(0, 1fr) rather than a bare 1fr — a bare 1fr track's automatic
                  // minimum size is its content's min-content size, so an oversized label
                  // grows its row (and the whole fixed-height page) instead of being
                  // constrained to its share of the page, which pushed pages taller than
                  // one printed sheet and made the next page overlap it.
                  gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
                }}
              >
                {pageItems.map((item) => (
                  <div
                    key={item.id}
                    className={
                      hasLogo ? 'label-sheet__label label-sheet__label--with-logo' : 'label-sheet__label'
                    }
                  >
                    {hasLogo && <img className="label-sheet__logo" src={logoDataUrl ?? undefined} alt="" />}
                    {fields.map((field) => {
                      const value = field.getValue(item)
                      if (!value) {
                        return null
                      }
                      if (!EDITABLE_FIELD_KEYS.has(field.key)) {
                        if (field.richText) {
                          return (
                            <div
                              key={field.key}
                              className={`label-sheet__field label-sheet__field--${field.key} label-sheet__field--richtext`}
                            >
                              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                {value}
                              </ReactMarkdown>
                            </div>
                          )
                        }
                        return (
                          <p
                            key={field.key}
                            className={`label-sheet__field label-sheet__field--${field.key}`}
                          >
                            {value}
                          </p>
                        )
                      }

                      const key = `${item.id}:${field.key}`
                      return (
                        <EditableLabelField
                          key={field.key}
                          item={item}
                          field={field}
                          value={value}
                          isEditing={editingKey === key}
                          onStartEdit={() => setEditingKey(key)}
                          onStopEdit={() => setEditingKey(null)}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
