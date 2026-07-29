import { useEffect, useRef } from 'react'
import type { Booth } from '@shared'
import { useSales } from '@/hooks/useSales'
import { useItems } from '@/hooks/useItems'
import { useConsigners } from '@/hooks/useConsigners'
import { computeBoothReport, buildBoothReportCsv, type BoothReport } from '@/features/booths/boothReport'

interface BoothReportDialogProps {
  booth: Booth
  onClose: () => void
}

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
})

function formatCurrency(value: number | undefined): string {
  return value === undefined ? '—' : currencyFormatter.format(value)
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatRate(value: number | undefined): string {
  return value === undefined ? '—' : `${Math.round(value * 100)}%`
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'booth'
}

function downloadCsv(filename: string, report: BoothReport) {
  // BOM prefix so Excel correctly detects UTF-8 rather than mangling non-ASCII titles/names.
  const blob = new Blob(['﻿' + buildBoothReportCsv(report)], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function BoothReportDialog({ booth, onClose }: BoothReportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const sales = useSales()
  const items = useItems()
  const consigners = useConsigners()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }
    dialog.showModal()
    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  const isPending = sales.isPending || items.isPending || consigners.isPending
  const firstError = sales.error ?? items.error ?? consigners.error

  const boothName = booth.fields['Booth Name'] ?? 'Untitled booth'
  const report =
    sales.data && items.data && consigners.data
      ? computeBoothReport(booth, sales.data, items.data, consigners.data)
      : null

  return (
    <dialog ref={dialogRef} className="item-dialog booth-report-dialog">
      <button
        type="button"
        className="item-detail__close"
        onClick={() => dialogRef.current?.close()}
        aria-label="Close"
      >
        ×
      </button>
      <div className="booth-report">
        <div className="booth-report__header">
          <h2>Booth Report: {boothName}</h2>
          {report && report.rows.length > 0 && (
            <button
              type="button"
              onClick={() =>
                downloadCsv(`booth-report-${sanitizeFilename(boothName)}.csv`, report)
              }
            >
              Download CSV
            </button>
          )}
        </div>

        {isPending && <p>Loading…</p>}
        {firstError && <p role="alert">Error: {firstError.message}</p>}

        {report && report.rows.length === 0 && <p>No sales recorded for this booth yet.</p>}

        {report && report.rows.length > 0 && (
          <div className="booth-report__table-wrapper">
            <table className="booth-report__table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Date Sold</th>
                  <th>Sale Price</th>
                  <th>Consigner</th>
                  <th>Rate</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.saleId}>
                    <td>{row.itemTitle}</td>
                    <td>{formatDate(row.dateSold)}</td>
                    <td>{formatCurrency(row.salePrice)}</td>
                    <td>{row.consignerName ?? '—'}</td>
                    <td>{formatRate(row.consignerRate)}</td>
                    <td>{formatCurrency(row.net)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={2}>Totals</th>
                  <th>{formatCurrency(report.totalSales)}</th>
                  <th colSpan={2} />
                  <th>{formatCurrency(report.totalNet)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </dialog>
  )
}
