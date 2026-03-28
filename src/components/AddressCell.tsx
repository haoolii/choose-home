import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ICellRendererParams } from 'ag-grid-community'
import type { EmptyRoom } from '../hooks/useEmptyRoomData'
import { parseFloor, parseStreetNo } from '../utils/parse'
import { Image } from '@carbon/icons-react'

export function AddressCell({ data }: ICellRendererParams<EmptyRoom>) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!data) return null

  const floor = parseFloor(data.房屋地址)
  const streetNo = parseStreetNo(data.房屋地址)
  const imgSrc = `/floor/${data.棟別}${streetNo}-${floor}F.jpg`

  const show = (e: React.MouseEvent) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPos({ x: e.clientX, y: e.clientY })
    setVisible(true)
  }

  const hide = () => {
    timerRef.current = setTimeout(() => setVisible(false), 100)
  }

  const tooltip = visible ? createPortal(
    <div
      onMouseEnter={() => { if (timerRef.current) clearTimeout(timerRef.current) }}
      onMouseLeave={hide}
      style={{
        position: 'fixed',
        left: pos.x + 12,
        top: pos.y + 12,
        zIndex: 9999,
        background: '#fff',
        border: '1px solid var(--cds-border-subtle)',
        borderRadius: 4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: 4,
        pointerEvents: 'auto',
      }}
    >
      <img
        src={imgSrc}
        alt={`${data.棟別}${streetNo}-${floor}F`}
        style={{ display: 'block', maxWidth: 1200, maxHeight: 800, objectFit: 'contain' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    </div>,
    document.body
  ) : null

  return (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.25rem', width: '100%' }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {data.房屋地址}
      </span>
      <span
        onMouseEnter={show}
        onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
        onMouseLeave={hide}
        style={{ flexShrink: 0, cursor: 'pointer', color: 'var(--cds-link-primary)', display: 'flex', alignItems: 'center' }}
      >
        <Image size={16} />
      </span>
      {tooltip}
    </span>
  )
}
