import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@carbon/react'
import { Close, Edit, TrashCan } from '@carbon/icons-react'

export interface Mark { x: number; y: number; w: number; h: number } // ratios 0–1

const STORAGE_KEY = 'floorMarks'

export function loadAllMarks(): Record<string, Record<string, Mark>> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

export function loadMark(imgKey: string, unitId: string): Mark | null {
  return loadAllMarks()[imgKey]?.[unitId] ?? null
}

function saveMark(imgKey: string, unitId: string, mark: Mark) {
  const all = loadAllMarks()
  all[imgKey] = { ...(all[imgKey] ?? {}), [unitId]: mark }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

function removeMark(imgKey: string, unitId: string) {
  const all = loadAllMarks()
  delete all[imgKey]?.[unitId]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

interface Props {
  imgSrc: string
  imgKey: string  // e.g. "南10-5F"
  unitId: string  // e.g. "S9"
  onClose: () => void
}

export function FloorImageModal({ imgSrc, imgKey, unitId, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [marking, setMarking] = useState(false)
  const [mark, setMark] = useState<Mark | null>(() => loadMark(imgKey, unitId))
  const dragRef = useRef<{ startX: number; startY: number } | null>(null)

  const draw = useCallback((override?: Mark | null) => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const box = override !== undefined ? override : mark
    if (box) {
      ctx.strokeStyle = '#ff0000'
      ctx.lineWidth = 2
      ctx.strokeRect(
        box.x * canvas.width,
        box.y * canvas.height,
        box.w * canvas.width,
        box.h * canvas.height,
      )
    }
  }, [mark])

  useEffect(() => {
    const img = new window.Image()
    img.onload = () => {
      imgRef.current = img
      const canvas = canvasRef.current
      if (!canvas) return
      const maxW = Math.min(window.innerWidth * 0.9, 960)
      const maxH = Math.min(window.innerHeight * 0.8, 720)
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
      canvas.width = img.naturalWidth * scale
      canvas.height = img.naturalHeight * scale
      draw()
    }
    img.src = imgSrc
  }, [imgSrc]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { draw() }, [draw])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'e' || e.key === 'E') setMarking(m => !m)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const relPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    }
  }

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!marking) return
    const p = relPos(e)
    dragRef.current = { startX: p.x, startY: p.y }
  }

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!marking || !dragRef.current) return
    const p = relPos(e)
    const { startX, startY } = dragRef.current
    draw({
      x: Math.min(startX, p.x), y: Math.min(startY, p.y),
      w: Math.abs(p.x - startX), h: Math.abs(p.y - startY),
    })
  }

  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!marking || !dragRef.current) return
    const p = relPos(e)
    const { startX, startY } = dragRef.current
    dragRef.current = null
    const newMark = {
      x: Math.min(startX, p.x), y: Math.min(startY, p.y),
      w: Math.abs(p.x - startX), h: Math.abs(p.y - startY),
    }
    if (newMark.w > 0.005 && newMark.h > 0.005) {
      saveMark(imgKey, unitId, newMark)
      setMark(newMark)
    }
    setMarking(false)
  }

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: '95vw' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem' }}>
            {imgKey}　戶別：{unitId}
          </span>
          <Button
            kind={marking ? 'primary' : 'ghost'}
            size="sm"
            renderIcon={Edit}
            onClick={() => setMarking(m => !m)}
          >
            {marking ? '拖曳畫框中…' : '標記位置'}
          </Button>
          {mark && (
            <Button
              kind="danger--ghost" size="sm" renderIcon={TrashCan}
              hasIconOnly iconDescription="清除標記"
              onClick={() => { removeMark(imgKey, unitId); setMark(null) }}
            />
          )}
          <Button kind="ghost" size="sm" renderIcon={Close} hasIconOnly iconDescription="關閉" onClick={onClose} />
        </div>

        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            maxWidth: '100%',
            cursor: marking ? 'crosshair' : 'default',
            border: marking ? '2px dashed #ff0000' : '1px solid var(--cds-border-subtle)',
            borderRadius: 4,
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        />

        {marking && (
          <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', margin: 0 }}>
            在圖片上拖曳選取房間位置，放開滑鼠即儲存
          </p>
        )}
      </div>
    </div>,
    document.body
  )
}
