import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, ICellRendererParams, GridApi } from 'ag-grid-community'
import { Button } from '@carbon/react'
import { ArrowLeft, TrashCan, Download } from '@carbon/icons-react'
import type { EmptyRoom } from '../hooks/useEmptyRoomData'
import { parsePrice, parseFloor } from '../utils/parse'
import { AddressCell } from './AddressCell'

interface Props {
  data: EmptyRoom[]
  onRemove: (id: string) => void
  onBack: () => void
}

export function ShortlistPage({ data, onRemove, onBack }: Props) {
  const [rows, setRows] = useState<EmptyRoom[]>(data)
  const gridApiRef = useRef<GridApi | null>(null)
  const handleExport = useCallback(() => {
    const COLS: { label: string; getValue: (r: EmptyRoom) => string; w: number }[] = [
      { label: '房屋編號',     getValue: r => r.房屋編號,                                      w: 80  },
      { label: '地址',         getValue: r => r.房屋地址,                                      w: 260 },
      { label: '樓層',         getValue: r => `${parseFloor(r.房屋地址)}F`,                    w: 50  },
      { label: '房型',         getValue: r => r.房型,                                          w: 80  },
      { label: '坪數',         getValue: r => r.坪數,                                          w: 50  },
      { label: '棟別',         getValue: r => r.棟別,                                          w: 50  },
      { label: '戶別',         getValue: r => r.戶別,                                          w: 60  },
      { label: '租金(含管費)', getValue: r => parsePrice(r['租金(含管理費)']).toLocaleString(), w: 110 },
      { label: '備註',         getValue: r => r.備註 || '—',                                   w: 120 },
    ]

    const SCALE   = 2
    const PAD     = 24
    const ROW_H   = 36
    const FONT    = '14px "Noto Sans TC", sans-serif'
    const TITLE_H = 56
    const totalW  = COLS.reduce((s, c) => s + c.w, 0) + PAD * 2
    const totalH  = TITLE_H + ROW_H + ROW_H * rows.length + PAD

    const canvas  = document.createElement('canvas')
    canvas.width  = totalW  * SCALE
    canvas.height = totalH  * SCALE
    const ctx     = canvas.getContext('2d')!
    ctx.scale(SCALE, SCALE)

    // background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, totalW, totalH)

    // title
    ctx.fillStyle = '#161616'
    ctx.font = `600 18px "Noto Sans TC", sans-serif`
    ctx.fillText(`備選清單（${rows.length} 間）`, PAD, 36)

    // header row
    let y = TITLE_H
    ctx.fillStyle = '#e0e0e0'
    ctx.fillRect(PAD, y, totalW - PAD * 2, ROW_H)
    ctx.fillStyle = '#161616'
    ctx.font = `600 ${FONT}`
    let x = PAD + 8
    for (const col of COLS) {
      ctx.fillText(col.label, x, y + 23, col.w - 8)
      x += col.w
    }

    // data rows
    for (let i = 0; i < rows.length; i++) {
      y += ROW_H
      ctx.fillStyle = i % 2 === 0 ? '#f4f4f4' : '#ffffff'
      ctx.fillRect(PAD, y, totalW - PAD * 2, ROW_H)
      ctx.fillStyle = '#393939'
      ctx.font = `400 ${FONT}`
      x = PAD + 8
      for (const col of COLS) {
        ctx.fillText(col.getValue(rows[i]), x, y + 23, col.w - 8)
        x += col.w
      }
    }

    // border
    ctx.strokeStyle = '#c6c6c6'
    ctx.lineWidth = 1
    ctx.strokeRect(PAD, TITLE_H, totalW - PAD * 2, ROW_H * (rows.length + 1))

    const link = document.createElement('a')
    link.download = `備選清單_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}_${+new Date()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [rows])

  // Sync newly added items from parent without resetting existing order
  useEffect(() => {
    setRows(prev => {
      const existingIds = new Set(prev.map(r => r.房屋編號))
      const added = data.filter(d => !existingIds.has(d.房屋編號))
      return added.length ? [...prev, ...added] : prev
    })
  }, [data])

  const handleRemove = useCallback((id: string) => {
    setRows(prev => prev.filter(r => r.房屋編號 !== id))
    onRemove(id)
  }, [onRemove])

  const colDefs = useMemo<ColDef<EmptyRoom>[]>(() => [
    {
      headerName: '#',
      width: 48,
      maxWidth: 48,
      sortable: false,
      filter: false,
      resizable: false,
      suppressHeaderMenuButton: true,
      suppressHeaderFilterButton: true,
      valueGetter: p => p.node ? (p.node.rowIndex ?? 0) + 1 : null,
    },
    {
      rowDrag: true,
      width: 48,
      maxWidth: 48,
      sortable: false,
      filter: false,
      resizable: false,
      suppressHeaderMenuButton: true,
      suppressHeaderFilterButton: true,
    },
    { field: '房屋編號', headerName: '房屋編號', width: 100 },
    { field: '房屋地址', headerName: '房屋地址', flex: 2, cellRenderer: AddressCell },
    {
      headerName: '樓層',
      width: 90,
      valueGetter: p => p.data ? parseFloor(p.data.房屋地址) : null,
    },
    { field: '房型',     headerName: '房型',     width: 110 },
    { field: '坪數',     headerName: '坪數',     width: 90 },
    { field: '棟別',     headerName: '棟別',     width: 90 },
    { field: '戶別',     headerName: '戶別',     width: 90 },
    {
      field: '租金(含管理費)',
      headerName: '租金(含管理費)',
      width: 150,
      valueGetter: p => p.data ? parsePrice(p.data['租金(含管理費)']) : 0,
      valueFormatter: p => p.value.toLocaleString(),
    },
    { field: '備註', headerName: '備註', flex: 1 },
    {
      headerName: '',
      pinned: 'right',
      width: 56,
      sortable: false,
      filter: false,
      resizable: false,
      suppressHeaderMenuButton: true,
      suppressHeaderFilterButton: true,
      cellRenderer: ({ data: row }: ICellRendererParams<EmptyRoom>) => (
        <Button
          kind="danger--ghost"
          size="sm"
          hasIconOnly
          renderIcon={TrashCan}
          iconDescription="從清單移除"
          onClick={() => row && handleRemove(row.房屋編號)}
        />
      ),
    },
  ], [handleRemove])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--cds-border-subtle)',
      }}>
        <Button kind="ghost" size="sm" renderIcon={ArrowLeft} onClick={onBack}>
          返回列表
        </Button>
        <span style={{ fontWeight: 600, fontSize: '1.125rem', flex: 1 }}>
          備選({rows.length})
        </span>
        <Button kind="secondary" size="sm" renderIcon={Download} onClick={handleExport}>
          匯出
        </Button>
      </div>
      <div className="ag-theme-alpine" style={{ flex: 1 }}>
        <AgGridReact<EmptyRoom>
          rowData={rows}
          columnDefs={colDefs}
          defaultColDef={{ sortable: false, resizable: true }}
          rowDragManaged
          rowDragEntireRow
          suppressCellFocus
          suppressMovableColumns
          onGridReady={p => { gridApiRef.current = p.api }}
          onRowDragEnd={() => gridApiRef.current?.refreshCells({ force: true })}
        />
      </div>
    </div>
  )
}
