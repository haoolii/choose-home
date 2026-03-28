import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ValueGetterParams, GridApi } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { Button, InlineNotification, DataTableSkeleton } from "@carbon/react";
import { Bookmark } from "@carbon/icons-react";
import { useEmptyRoomData, type EmptyRoom } from "./hooks/useEmptyRoomData";
import { parsePrice, parseFloor } from "./utils/parse";
import { SetFilter } from "./components/SetFilter";
import { ActionCell } from "./components/ActionCell";
import { ShortlistFilter } from "./components/ShortlistFilter";
import { ShortlistPage } from "./components/ShortlistPage";
import { ColumnPicker, type PickerCol } from "./components/ColumnPicker";

ModuleRegistry.registerModules([AllCommunityModule]);

const DEFAULT_COL_DEF: ColDef = {
  sortable: true,
  resizable: true,
  suppressHeaderMenuButton: false,
  suppressHeaderFilterButton: false,
};

export default function App() {
  const { data, loading, error } = useEmptyRoomData();
  const [shortlist, setShortlist] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("shortlist") || "[]"));
    } catch {
      return new Set();
    }
  });
  const [showShortlist, setShowShortlist] = useState(false);
  const gridApiRef = useRef<GridApi | null>(null);

  const addToShortlist = useCallback((id: string) => {
    setShortlist((prev) => new Set([...prev, id]));
  }, []);

  const removeFromShortlist = useCallback((id: string) => {
    setShortlist((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("shortlist", JSON.stringify([...shortlist]));
    gridApiRef.current?.onFilterChanged();
    gridApiRef.current?.refreshCells({ force: true });
  }, [shortlist]);

  const context = useMemo(
    () => ({ shortlist, addToShortlist }),
    [shortlist, addToShortlist],
  );

  const colDefs = useMemo<ColDef<EmptyRoom>[]>(
    () => [
      {
        colId: "房屋編號",
        field: "房屋編號",
        headerName: "房屋編號",
        filter: false,
        width: 100,
        comparator: (a: string, b: string) => parseInt(a) - parseInt(b),
      },
      {
        colId: "房屋地址",
        field: "房屋地址",
        headerName: "房屋地址",
        filter: "agTextColumnFilter",
        flex: 2,
      },
      {
        colId: "樓層",
        headerName: "樓層",
        filter: "agNumberColumnFilter",
        width: 90,
        valueGetter: (p: ValueGetterParams<EmptyRoom>) =>
          p.data ? parseFloor(p.data.房屋地址) : null,
      },
      {
        colId: "房型",
        field: "房型",
        headerName: "房型",
        filter: SetFilter,
        width: 110,
      },
      {
        colId: "坪數",
        field: "坪數",
        headerName: "坪數",
        filter: SetFilter,
        width: 90,
      },
      {
        colId: "棟別",
        field: "棟別",
        headerName: "棟別",
        filter: SetFilter,
        width: 90,
      },
      {
        colId: "戶別",
        field: "戶別",
        headerName: "戶別",
        filter: SetFilter,
        width: 90,
      },
      {
        colId: "租金",
        field: "租金(含管理費)",
        headerName: "租金(含管理費)",
        filter: "agNumberColumnFilter",
        width: 150,
        sort: "asc",
        valueGetter: (p: ValueGetterParams<EmptyRoom>) =>
          p.data ? parsePrice(p.data["租金(含管理費)"]) : 0,
        valueFormatter: (p) => p.value.toLocaleString(),
      },
      {
        colId: "備註",
        field: "備註",
        headerName: "備註",
        filter: SetFilter,
        flex: 1,
      },
      {
        colId: "備選",
        headerName: "備選",
        pinned: "right",
        width: 110,
        sortable: false,
        filter: ShortlistFilter,
        cellRenderer: ActionCell,
      },
    ],
    [],
  );

  const PICKER_COLS: PickerCol[] = [
    { colId: "房屋編號", label: "房屋編號" },
    { colId: "房屋地址", label: "房屋地址" },
    { colId: "樓層", label: "樓層" },
    { colId: "房型", label: "房型" },
    { colId: "坪數", label: "坪數" },
    { colId: "棟別", label: "棟別" },
    { colId: "戶別", label: "戶別" },
    { colId: "租金", label: "租金(含管理費)" },
    { colId: "備註", label: "備註" },
  ];

  const headers = useMemo(
    () =>
      colDefs
        .filter((c) => c.field)
        .map((c) => ({
          key: c.field as string,
          header: c.headerName as string,
        })),
    [colDefs],
  );

  if (loading) return <DataTableSkeleton headers={headers} rowCount={8} />;
  if (error)
    return (
      <InlineNotification
        kind="error"
        title="載入失敗"
        subtitle={error.message}
      />
    );

  const shortlistData = data.filter((d) => shortlist.has(d.房屋編號));

  return (
    <>
      <div
        style={{
          display: showShortlist ? "none" : "flex",
          flexDirection: "column",
          height: "100dvh",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            borderBottom: "1px solid var(--cds-border-subtle)",
          }}
        >
          <ColumnPicker columns={PICKER_COLS} api={gridApiRef.current} />
          <Button
            kind={shortlist.size > 0 ? "primary" : "ghost"}
            size="sm"
            renderIcon={Bookmark}
            onClick={() => setShowShortlist(true)}
          >
            備選清單{shortlist.size > 0 ? `（${shortlist.size}）` : ""}
          </Button>
        </div>
        <div className="ag-theme-alpine" style={{ flex: 1 }}>
          <AgGridReact<EmptyRoom>
            rowData={data}
            columnDefs={colDefs}
            defaultColDef={DEFAULT_COL_DEF}
            context={context}
            rowModelType="clientSide"
            suppressCellFocus
            suppressMovableColumns
            suppressMenuHide
            onGridReady={(p) => {
              gridApiRef.current = p.api;
            }}
          />
        </div>
        <div
          style={{
            padding: "0.5rem 1rem",
            borderTop: "1px solid var(--cds-border-subtle)",
            fontSize: "0.75rem",
            color: "var(--cds-text-secondary)",
            textAlign: "center",
          }}
        >
          南港機廠社會住宅1區 - 選屋小工具 | 聯繫：
          <a href="mailto:unnhao@gmail.com" style={{ color: "inherit" }}>
            unnhao@gmail.com
          </a>
        </div>
      </div>
      <div
        style={{
          display: showShortlist ? "flex" : "none",
          flexDirection: "column",
          height: "100dvh",
        }}
      >
        <ShortlistPage
          data={shortlistData}
          onRemove={removeFromShortlist}
          onBack={() => setShowShortlist(false)}
        />
      </div>
    </>
  );
}
