'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { NODE_DEFAULT_WIDTH } from './nodeFieldStyles'

export function useNodeWidthResize(
  initialWidth = NODE_DEFAULT_WIDTH,
  minWidth = NODE_DEFAULT_WIDTH,
) {
  const [width, setWidth] = useState(initialWidth)
  const resizing = useRef<{ startX: number; startW: number } | null>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizing.current) return
      setWidth(Math.max(minWidth, resizing.current.startW + (e.clientX - resizing.current.startX)))
    }
    const onUp = () => {
      resizing.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [minWidth])

  const startResize = useCallback(
    (e: React.MouseEvent, currentWidth?: number) => {
      e.preventDefault()
      e.stopPropagation()
      resizing.current = { startX: e.clientX, startW: currentWidth ?? width }
    },
    [width],
  )

  return { width, setWidth, startResize }
}
