import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, ValueGetterParams, GridApi } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { Button, InlineNotification, DataTableSkeleton } from '@carbon/react'
import { Bookmark } from '@carbon/icons-react'
import { useEmptyRoomData, type EmptyRoom } from './hooks/useEmptyRoomData'
import { parsePrice, parseFloor } from './utils/parse'
import { SetFilter } from './components/SetFilter'
import { ActionCell } from './components/ActionCell'
import { ShortlistFilter } from './components/ShortlistFilter'
import { ShortlistPage } from './components/ShortlistPage'

ModuleRegistry.registerModules([AllCommunityModule])


const DEFAULT_COL_DEF: ColDef = {
  sortable: true,
  resizable: true,
  suppressHeaderMenuButton: false,
  suppressHeaderFilterButton: false,
}

export default function App() {
  const { data, loading, error } = useEmptyRoomData()
  const [shortlist, setShortlist] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('shortlist') || '[]')) }
    catch { return new Set() }
  })
  const [showShortlist, setShowShortlist] = useState(false)
  const gridApiRef = useRef<GridApi | null>(null)

  const addToShortlist = useCallback((id: string) => {
    setShortlist(prev => new Set([...prev, id]))
  }, [])

  const removeFromShortlist = useCallback((id: string) => {
    setShortlist(prev => { const next = new Set(prev); next.delete(id); return next })
  }, [])

  useEffect(() => {
    localStorage.setItem('shortlist', JSON.stringify([...shortlist]))
    gridApiRef.current?.onFilterChanged()
  }, [shortlist])

  const context = useMemo(
    () => ({ shortlist, addToShortlist }),
    [shortlist, addToShortlist]
  )

  const colDefs = useMemo<ColDef<EmptyRoom>[]>(() => [
    { field: '房屋編號', headerName: '房屋編號', filter: false,                    width: 100 },
    { field: '房屋地址', headerName: '房屋地址', filter: 'agTextColumnFilter',     flex: 2 },
    {
      headerName: '樓層',
      filter: 'agNumberColumnFilter',
      width: 90,
      valueGetter: (p: ValueGetterParams<EmptyRoom>) =>
        p.data ? parseFloor(p.data.房屋地址) : null,
    },
    { field: '房型',     headerName: '房型',     filter: SetFilter,               width: 110 },
    { field: '坪數',     headerName: '坪數',     filter: SetFilter,               width: 90 },
    { field: '棟別',     headerName: '棟別',     filter: SetFilter,               width: 90 },
    { field: '戶別',     headerName: '戶別',     filter: SetFilter,               width: 90 },
    {
      field: '租金(含管理費)',
      headerName: '租金(含管理費)',
      filter: 'agNumberColumnFilter',
      width: 150,
      sort: 'asc',
      valueGetter: (p: ValueGetterParams<EmptyRoom>) =>
        p.data ? parsePrice(p.data['租金(含管理費)']) : 0,
      valueFormatter: p => p.value.toLocaleString(),
    },
    { field: '備註', headerName: '備註', filter: SetFilter, flex: 1 },
    {
      headerName: '備選',
      pinned: 'right',
      width: 110,
      sortable: false,
      filter: ShortlistFilter,
      cellRenderer: ActionCell,
    },
  ], [])

  const headers = useMemo(() =>
    colDefs.filter(c => c.field).map(c => ({ key: c.field as string, header: c.headerName as string })),
    [colDefs]
  )

  if (loading) return <DataTableSkeleton headers={headers} rowCount={8} />
  if (error)   return <InlineNotification kind="error" title="載入失敗" subtitle={error.message} />

  const shortlistData = data.filter(d => shortlist.has(d.房屋編號))

  return (
    <>
      <div style={{ display: showShortlist ? 'none' : 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '0.5rem 1rem',
          borderBottom: '1px solid var(--cds-border-subtle)',
        }}>
          <Button
            kind={shortlist.size > 0 ? 'primary' : 'ghost'}
            size="sm"
            renderIcon={Bookmark}
            onClick={() => setShowShortlist(true)}
          >
            備選清單{shortlist.size > 0 ? `（${shortlist.size}）` : ''}
          </Button>
        </div>
        <div className="ag-theme-alpine" style={{ flex: 1 }}>
          <AgGridReact<EmptyRoom>
            rowData={data}
            columnDefs={colDefs}
            defaultColDef={DEFAULT_COL_DEF}
            context={context}
            rowModelType="clientSide"
            suppressMovableColumns
            suppressMenuHide
            onGridReady={p => { gridApiRef.current = p.api }}
          />
        </div>
      </div>
      <div style={{ display: showShortlist ? 'flex' : 'none', flexDirection: 'column', height: '100vh' }}>
        <ShortlistPage
          data={shortlistData}
          onRemove={removeFromShortlist}
          onBack={() => setShowShortlist(false)}
        />
      </div>
    </>
  )
}
