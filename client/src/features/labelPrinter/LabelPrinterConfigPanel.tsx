import type { ChangeEvent } from 'react'
import { LABEL_FIELDS } from '@/features/labelPrinter/labelFields'
import { PAGE_LAYOUTS, type LabelPrinterConfig } from '@/features/labelPrinter/labelPrinterConfig'
import { useLabelLogo, useUpdateLabelLogo } from '@/hooks/useLabelLogo'

const MAX_LOGO_BYTES = 2 * 1024 * 1024

interface LabelPrinterConfigPanelProps {
  config: LabelPrinterConfig
  onChange: (config: LabelPrinterConfig) => void
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function LabelPrinterConfigPanel({ config, onChange }: LabelPrinterConfigPanelProps) {
  const logo = useLabelLogo()
  const updateLogo = useUpdateLabelLogo()

  function toggleField(key: string, checked: boolean) {
    onChange({
      ...config,
      fieldKeys: checked ? [...config.fieldKeys, key] : config.fieldKeys.filter((k) => k !== key),
    })
  }

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      window.alert('Please choose an image smaller than 2MB.')
      event.target.value = ''
      return
    }
    const dataUrl = await fileToDataUrl(file)
    updateLogo.mutate(dataUrl)
  }

  return (
    <div className="label-printer-config">
      <fieldset>
        <legend>Fields to include</legend>
        <div className="label-printer-config__fields">
          {LABEL_FIELDS.map((field) => (
            <label key={field.key} className="label-printer-config__checkbox">
              <input
                type="checkbox"
                checked={config.fieldKeys.includes(field.key)}
                onChange={(event) => toggleField(field.key, event.target.checked)}
              />
              {field.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="label-printer-config__row">
        Labels per page
        <select
          value={config.labelsPerPage}
          onChange={(event) => onChange({ ...config, labelsPerPage: Number(event.target.value) })}
        >
          {Object.keys(PAGE_LAYOUTS)
            .map(Number)
            .sort((a, b) => a - b)
            .map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
        </select>
      </label>

      <div className="label-printer-config__logo">
        <label className="label-printer-config__checkbox">
          <input
            type="checkbox"
            checked={config.showLogo}
            onChange={(event) => onChange({ ...config, showLogo: event.target.checked })}
          />
          Show logo on labels
        </label>
        <label className="label-printer-config__row">
          Logo image
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            disabled={updateLogo.isPending}
          />
        </label>
        {logo.isPending && <p>Loading logo…</p>}
        {logo.error && <p role="alert">Error: {logo.error.message}</p>}
        {logo.data && (
          <div className="label-printer-config__logo-preview">
            <img src={logo.data} alt="Logo preview" />
            <button
              type="button"
              onClick={() => updateLogo.mutate(null)}
              disabled={updateLogo.isPending}
            >
              Remove logo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
