import type { Item } from '@shared'
import { LABEL_FIELDS } from '@/features/labelPrinter/labelFields'
import { PAGE_LAYOUTS } from '@/features/labelPrinter/labelPrinterConfig'

interface LabelSheetProps {
  items: Item[]
  fieldKeys: string[]
  labelsPerPage: number
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

export function LabelSheet({ items, fieldKeys, labelsPerPage, showLogo, logoDataUrl }: LabelSheetProps) {
  const layout = PAGE_LAYOUTS[labelsPerPage] ?? { columns: 2, rows: 4 }
  const fields = LABEL_FIELDS.filter((field) => fieldKeys.includes(field.key))
  const pages = chunk(items, labelsPerPage)

  if (items.length === 0) {
    return <p>Select at least one item to preview labels.</p>
  }

  return (
    <div className="label-sheet">
      {pages.map((pageItems, pageIndex) => (
        <div
          key={pageIndex}
          className="label-sheet__page"
          style={{
            gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
            gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
          }}
        >
          {pageItems.map((item) => (
            <div key={item.id} className="label-sheet__label">
              {showLogo && logoDataUrl && (
                <img className="label-sheet__logo" src={logoDataUrl} alt="" />
              )}
              {fields.map((field) => {
                const value = field.getValue(item)
                if (!value) {
                  return null
                }
                return (
                  <p key={field.key} className={`label-sheet__field label-sheet__field--${field.key}`}>
                    {value}
                  </p>
                )
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
