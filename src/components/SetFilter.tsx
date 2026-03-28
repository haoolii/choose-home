import { useState, useEffect, useRef } from 'react'
import { useGridFilter } from 'ag-grid-react'
import type { CustomFilterProps } from 'ag-grid-react'
import { Checkbox, Button } from '@carbon/react'

type Model = string[] | null   // null = no filter (all pass), [] = nothing passes

const BLANK = '__BLANK__'
const toDisplay = (val: string) => val === BLANK ? '(空白)' : val

export function SetFilter({ model, onModelChange, getValue, api }: CustomFilterProps<any, any, Model>) {
  const [allValues, setAllValues] = useState<string[]>([])
  const modelRef = useRef<Model>(model)

  useEffect(() => { modelRef.current = model }, [model])

  useEffect(() => {
    const vals = new Set<string>()
    let hasBlank = false
    api.forEachNode(node => {
      const v = String(getValue(node) ?? '')
      if (v.trim() === '') { hasBlank = true } else { vals.add(v) }
    })
    const sorted = Array.from(vals).sort()
    if (hasBlank) sorted.push(BLANK)
    setAllValues(sorted)
  }, [])

  useGridFilter({
    doesFilterPass({ node }) {
      if (modelRef.current === null) return true
      const raw = String(getValue(node) ?? '')
      const key = raw.trim() === '' ? BLANK : raw
      return modelRef.current.includes(key)
    },
  })

  const selected = model ?? allValues
  const selectedSet = new Set(selected)

  return (
    <div style={{ minWidth: 200 }}>
      <div style={{ maxHeight: 280, overflowY: 'auto', padding: '0.5rem 0.75rem' }}>
        {allValues.map(val => (
          <Checkbox
            key={val}
            id={`sf-${val}`}
            labelText={toDisplay(val)}
            checked={selectedSet.has(val)}
            onChange={(_: unknown, { checked }: { checked: boolean }) => {
              const next = checked
                ? [...selected, val]
                : selected.filter(v => v !== val)
              onModelChange(next.length === allValues.length ? null : next)
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid var(--cds-border-subtle)' }}>
        <Button
          kind="ghost"
          size="sm"
          onClick={() => onModelChange(null)}
          style={{ flex: 1 }}
        >
          全選
        </Button>
        <Button
          kind="ghost"
          size="sm"
          onClick={() => onModelChange([])}
          style={{ flex: 1 }}
        >
          清除
        </Button>
      </div>
    </div>
  )
}
