import { DEFAULT_FIELD_KEYS } from '@/features/labelPrinter/labelFields'

const STORAGE_KEY = 'tradeshow:labelPrinterConfig'

export interface LabelPrinterConfig {
  fieldKeys: string[]
  showLogo: boolean
}

// Maps a "labels per page" count to a grid shape. Deliberately a fixed set of
// options rather than free-form rows/columns, since what matters to the user is
// how many labels come out of the printer per sheet, not the grid dimensions.
export const PAGE_LAYOUTS: Record<number, { columns: number; rows: number }> = {
  1: { columns: 1, rows: 1 },
  2: { columns: 1, rows: 2 },
  4: { columns: 2, rows: 2 },
  6: { columns: 2, rows: 3 },
  8: { columns: 2, rows: 4 },
  9: { columns: 3, rows: 3 },
  12: { columns: 3, rows: 4 },
  16: { columns: 4, rows: 4 },
}

const DEFAULT_CONFIG: LabelPrinterConfig = {
  fieldKeys: DEFAULT_FIELD_KEYS,
  showLogo: true,
}

export function loadLabelPrinterConfig(): LabelPrinterConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_CONFIG
    }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_CONFIG, ...parsed }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function saveLabelPrinterConfig(config: LabelPrinterConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // Storage full/unavailable (e.g. private browsing) — config just won't persist.
  }
}
