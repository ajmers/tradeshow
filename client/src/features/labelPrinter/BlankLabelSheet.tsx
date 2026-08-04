import { PAGE_LAYOUTS } from '@/features/labelPrinter/labelPrinterConfig'
import { PAGE_WIDTH_INCHES, PAGE_HEIGHT_INCHES } from '@/features/labelPrinter/labelBucketing'

export type LabelOrientation = 'portrait' | 'landscape'

interface BlankLabelSheetProps {
  labelsPerPage: number
  showLogo: boolean
  logoDataUrl: string | null
  orientation: LabelOrientation
}

export function BlankLabelSheet({
  labelsPerPage,
  showLogo,
  logoDataUrl,
  orientation,
}: BlankLabelSheetProps) {
  const hasLogo = showLogo && Boolean(logoDataUrl)
  const baseLayout = PAGE_LAYOUTS[labelsPerPage] ?? { columns: 2, rows: 2 }
  // Landscape isn't just a wider page frame around the same arrangement — it's
  // the whole thing rotated 90°, so what was stacked in columns becomes a row
  // and vice versa, same as physically turning a printed portrait page sideways.
  const layout =
    orientation === 'landscape'
      ? { columns: baseLayout.rows, rows: baseLayout.columns }
      : baseLayout
  const pageWidthInches = orientation === 'landscape' ? PAGE_HEIGHT_INCHES : PAGE_WIDTH_INCHES
  const pageHeightInches = orientation === 'landscape' ? PAGE_WIDTH_INCHES : PAGE_HEIGHT_INCHES

  return (
    <div className="label-sheet">
      <div
        className="label-sheet__page"
        style={{
          width: `${pageWidthInches}in`,
          height: `${pageHeightInches}in`,
          gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: labelsPerPage }, (_, index) => (
          <div
            key={index}
            className={
              hasLogo ? 'label-sheet__label label-sheet__label--with-logo' : 'label-sheet__label'
            }
          >
            {hasLogo && <img className="label-sheet__logo" src={logoDataUrl ?? undefined} alt="" />}
          </div>
        ))}
      </div>
    </div>
  )
}
