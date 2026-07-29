import { useEffect, useState } from 'react'
import { useItems } from '@/hooks/useItems'
import { useLabelLogo } from '@/hooks/useLabelLogo'
import { LabelPrinterConfigPanel } from '@/features/labelPrinter/LabelPrinterConfigPanel'
import { ItemSelectionList } from '@/features/labelPrinter/ItemSelectionList'
import { LabelSheet } from '@/features/labelPrinter/LabelSheet'
import {
  loadLabelPrinterConfig,
  saveLabelPrinterConfig,
  type LabelPrinterConfig,
} from '@/features/labelPrinter/labelPrinterConfig'

export function LabelPrinterPage() {
  const { data, isPending, isError, error } = useItems()
  const logo = useLabelLogo()
  const [config, setConfig] = useState<LabelPrinterConfig>(() => loadLabelPrinterConfig())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    saveLabelPrinterConfig(config)
  }, [config])

  if (isPending) {
    return <p>Loading…</p>
  }

  if (isError) {
    return <p role="alert">Error loading items: {error.message}</p>
  }

  const selectedItems = data.filter((item) => selectedIds.has(item.id))

  return (
    <main className="label-printer-page">
      <div className="label-printer-controls">
        <div className="page-toolbar">
          <h1>Label Printer</h1>
          <button type="button" onClick={() => window.print()} disabled={selectedItems.length === 0}>
            Print
          </button>
        </div>

        <LabelPrinterConfigPanel config={config} onChange={setConfig} />
        <ItemSelectionList items={data} selectedIds={selectedIds} onChange={setSelectedIds} />

        <h2>Preview</h2>
      </div>

      <LabelSheet
        items={selectedItems}
        fieldKeys={config.fieldKeys}
        labelsPerPage={config.labelsPerPage}
        showLogo={config.showLogo}
        logoDataUrl={logo.data ?? null}
      />
    </main>
  )
}
