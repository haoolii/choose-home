import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@carbon/react'
import { Close } from '@carbon/icons-react'
import type { Mark } from './FloorImageModal'

interface Props {
  imgSrc: string
  imgKey: string
  unitId: string
  mark: Mark | null
  onClose: () => void
}

export function BottomSheet({ imgSrc, imgKey, unitId, mark, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Animate in
  useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    el.style.transform = 'translateY(100%)'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transform = 'translateY(0)'
      })
    })
  }, [])

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          height: '60%',
          background: '#fff',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          transform: 'translateY(100%)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--cds-border-subtle)',
          flexShrink: 0,
        }}>
          <span style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem' }}>
            {imgKey}　{unitId}
          </span>
          <Button kind="ghost" size="sm" renderIcon={Close} hasIconOnly iconDescription="關閉" onClick={onClose} />
        </div>

        {/* Image area */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
          <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '100%' }}>
            <img
              src={imgSrc}
              alt={imgKey}
              style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).alt = '圖片不存在' }}
            />
            {mark && (
              <div style={{
                position: 'absolute',
                left: `${mark.x * 100}%`,
                top: `${mark.y * 100}%`,
                width: `${mark.w * 100}%`,
                height: `${mark.h * 100}%`,
                border: '4px solid #ff0000',
                pointerEvents: 'none',
                boxSizing: 'border-box',
              }} />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
