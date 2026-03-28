import { useState } from 'react'
import { Button, Checkbox, Popover, PopoverContent } from '@carbon/react'
import { Settings } from '@carbon/icons-react'
import type { GridApi } from 'ag-grid-community'

export interface PickerCol { colId: string; label: string }

interface Props {
  columns: PickerCol[]
  api: GridApi | null
}

export function ColumnPicker({ columns, api }: Props) {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const toggle = (colId: string, visible: boolean) => {
    api?.setColumnsVisible([colId], visible)
    setHidden(prev => {
      const next = new Set(prev)
      visible ? next.delete(colId) : next.add(colId)
      return next
    })
  }

  return (
    <Popover open={open} align="bottom-right" onRequestClose={() => setOpen(false)}>
      <Button kind="ghost" size="sm" renderIcon={Settings} hasIconOnly iconDescription="欄位設定" onClick={() => setOpen(o => !o)} />
      <PopoverContent>
        <div style={{ padding: '0.75rem 1rem', minWidth: 160 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cds-text-secondary)', marginBottom: '0.5rem' }}>
            顯示欄位
          </p>
          {columns.map(col => (
            <Checkbox
              key={col.colId}
              id={`cp-${col.colId}`}
              labelText={col.label}
              checked={!hidden.has(col.colId)}
              onChange={(_: unknown, { checked }: { checked: boolean }) => toggle(col.colId, checked)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
