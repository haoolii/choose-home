import { useRef, useEffect } from 'react'
import { useGridFilter } from 'ag-grid-react'
import type { CustomFilterProps } from 'ag-grid-react'
import { RadioButton, RadioButtonGroup } from '@carbon/react'
import type { AppContext } from './ActionCell'

type Model = 'selected' | 'unselected' | null   // null = 全部

export function ShortlistFilter({
  model,
  onModelChange,
  context,
}: CustomFilterProps<any, any, Model> & { context: AppContext }) {
  const modelRef = useRef<Model>(model)
  const contextRef = useRef<AppContext>(context)

  useEffect(() => {
    modelRef.current = model
    contextRef.current = context
  }, [model, context])

  useGridFilter({
    doesFilterPass({ node }) {
      const m = modelRef.current
      if (!m) return true
      const isAdded = contextRef.current.shortlist.has(node.data?.房屋編號 ?? '')
      return m === 'selected' ? isAdded : !isAdded
    },
  })

  return (
    <div style={{ padding: '0.75rem', minWidth: 160 }}>
      <RadioButtonGroup
        name="shortlist-filter"
        valueSelected={model ?? 'all'}
        onChange={(val) => onModelChange(val === 'all' ? null : val as Model)}
        orientation="vertical"
        legendText=""
      >
        <RadioButton labelText="全部" value="all" id="slr-all" />
        <RadioButton labelText="已加入" value="selected" id="slr-selected" />
        <RadioButton labelText="未加入" value="unselected" id="slr-unselected" />
      </RadioButtonGroup>
    </div>
  )
}
