import type { Booth, Sale, Item, Consigner } from '@shared'

export interface BoothReportRow {
  saleId: string
  itemTitle: string
  dateSold: string | undefined
  salePrice: number | undefined
  consignerName: string | undefined
  consignerRate: number | undefined
  net: number | undefined
}

export interface BoothReport {
  rows: BoothReportRow[]
  totalSales: number
  totalNet: number
}

export function computeBoothReport(
  booth: Booth,
  sales: Sale[],
  items: Item[],
  consigners: Consigner[],
): BoothReport {
  const boothSales = sales.filter((sale) => sale.fields.Venue?.includes(booth.id))

  const rows: BoothReportRow[] = boothSales.map((sale) => {
    const linkedItemIds = sale.fields['Items (Sale History Link)'] ?? []
    const linkedItems = linkedItemIds
      .map((id) => items.find((item) => item.id === id))
      .filter((item): item is Item => item !== undefined)

    const primaryItem = linkedItems[0]
    const itemTitle =
      linkedItems.length === 0
        ? 'Unknown item'
        : linkedItems.length === 1
          ? (primaryItem?.fields.Title ?? 'Untitled')
          : `${primaryItem?.fields.Title ?? 'Untitled'} +${linkedItems.length - 1} more`

    const consignerName = primaryItem?.fields.Consigner
    const consigner = consignerName
      ? consigners.find((entry) => entry.fields.Name === consignerName)
      : undefined
    const consignerRate = consigner?.fields['Consignment rate']
    const salePrice = sale.fields['Sale Price']

    // Net is what the business actually keeps. No consigner means the business owns
    // the piece outright, so it keeps the full sale price. With a consigner, the rate
    // is the business's commission cut — not the consigner's payout.
    let net: number | undefined
    if (salePrice === undefined) {
      net = undefined
    } else if (!consignerName) {
      net = salePrice
    } else if (consignerRate !== undefined) {
      net = salePrice * consignerRate
    } else {
      // A consigner is set but no matching rate was found — flag as unresolved
      // rather than silently assuming the business keeps the full amount.
      net = undefined
    }

    return {
      saleId: sale.id,
      itemTitle,
      dateSold: sale.fields['Date Sold'],
      salePrice,
      consignerName,
      consignerRate,
      net,
    }
  })

  const totalSales = rows.reduce((sum, row) => sum + (row.salePrice ?? 0), 0)
  const totalNet = rows.reduce((sum, row) => sum + (row.net ?? 0), 0)

  return { rows, totalSales, totalNet }
}

function toCsvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function buildBoothReportCsv(report: BoothReport): string {
  const header = ['Item', 'Date Sold', 'Sale Price', 'Consigner', 'Rate', 'Net']
  const rows = report.rows.map((row) => [
    row.itemTitle,
    row.dateSold ?? '',
    row.salePrice !== undefined ? row.salePrice.toFixed(2) : '',
    row.consignerName ?? '',
    row.consignerRate !== undefined ? `${Math.round(row.consignerRate * 100)}%` : '',
    row.net !== undefined ? row.net.toFixed(2) : '',
  ])
  const totalsRow = ['Totals', '', report.totalSales.toFixed(2), '', '', report.totalNet.toFixed(2)]

  return [header, ...rows, totalsRow]
    .map((line) => line.map(toCsvField).join(','))
    .join('\r\n')
}
