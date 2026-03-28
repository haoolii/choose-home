import type { ICellRendererParams } from 'ag-grid-community'
import { Button } from '@carbon/react'
import type { EmptyRoom } from '../hooks/useEmptyRoomData'

export interface AppContext {
  shortlist: Set<string>
  addToShortlist: (id: string) => void
}

export function ActionCell({ data, context }: ICellRendererParams<EmptyRoom> & { context: AppContext }) {
  const id = data?.房屋編號 ?? ''
  const isAdded = context.shortlist.has(id)

  return (
    <Button
      kind="primary"
      size="sm"
      disabled={isAdded}
      onClick={() => context.addToShortlist(id)}
    >
      {isAdded ? '已加入' : '加入'}
    </Button>
  )
}
