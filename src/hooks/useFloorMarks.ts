import { useEffect } from 'react'
import type { Mark } from '../components/FloorImageModal'

const STORAGE_KEY = 'floorMarks'

export const useFloorMarks = () => {
  useEffect(() => {
    fetch('/data/room-rect.json')
      .then(res => res.json())
      .then((json: Record<string, Record<string, Mark>>) => {
        // Merge: remote data fills in missing keys, existing localStorage entries win
        let stored: Record<string, Record<string, Mark>> = {}
        try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
        catch { /* ignore */ }

        const merged: Record<string, Record<string, Mark>> = { ...json }
        for (const imgKey of Object.keys(stored)) {
          merged[imgKey] = { ...(merged[imgKey] ?? {}), ...stored[imgKey] }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      })
      .catch(() => { /* no remote file yet, silent fail */ })
  }, [])
}
