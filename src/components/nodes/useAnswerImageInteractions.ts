'use client'

import { useEffect, useState, type MutableRefObject } from 'react'
import type { AnswerImage } from './answerImage'

type DragState = {
  itemId: number
  startX: number
  startY: number
  startOffX: number
  startOffY: number
}

type ResizeState = {
  itemId: number
  startX: number
  startY: number
  startW: number
  startH: number
}

type ItemWithImage = {
  id: number
  image?: AnswerImage
}

export function useAnswerImageInteractions<T extends ItemWithImage>({
  items,
  rowRefs,
  onUpdateImage,
}: {
  items: T[]
  rowRefs: MutableRefObject<(HTMLElement | null)[]>
  onUpdateImage: (itemId: number, image: AnswerImage | undefined) => void
}) {
  const [draggingImage, setDraggingImage] = useState<DragState | null>(null)
  const [resizingImage, setResizingImage] = useState<ResizeState | null>(null)
  const itemsRef = { current: items }
  itemsRef.current = items

  const handleImageDragStart = (itemId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const item = items.find((entry) => entry.id === itemId)
    if (!item?.image) return
    setDraggingImage({
      itemId,
      startX: e.clientX,
      startY: e.clientY,
      startOffX: item.image.offsetX,
      startOffY: item.image.offsetY,
    })
  }

  const handleResizeStart = (itemId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const item = items.find((entry) => entry.id === itemId)
    if (!item?.image) return
    setResizingImage({
      itemId,
      startX: e.clientX,
      startY: e.clientY,
      startW: item.image.width,
      startH: item.image.height,
    })
  }

  useEffect(() => {
    if (!draggingImage) return
    const onMove = (e: MouseEvent) => {
      const { itemId, startX, startY, startOffX, startOffY } = draggingImage
      const item = itemsRef.current.find((entry) => entry.id === itemId)
      if (!item?.image) return
      const idx = itemsRef.current.indexOf(item)
      const containerEl = rowRefs.current[idx]?.querySelector('[data-answer-content]') as HTMLElement | null
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      let newOffX = startOffX + dx
      let newOffY = startOffY + dy

      if (containerEl) {
        const containerW = containerEl.offsetWidth
        const containerH = containerEl.offsetHeight
        const imgW = item.image.width
        const imgH = item.image.height
        newOffX = Math.max(0, Math.min(newOffX, containerW - imgW - 16))
        newOffY = Math.max(0, Math.min(newOffY, Math.max(0, containerH - imgH)))
      } else {
        newOffX = Math.max(0, newOffX)
        newOffY = Math.max(0, newOffY)
      }

      onUpdateImage(itemId, {
        ...item.image,
        offsetX: newOffX,
        offsetY: newOffY,
        float: newOffX > 50 ? 'right' : 'left',
      })
    }
    const onUp = () => setDraggingImage(null)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [draggingImage, onUpdateImage, rowRefs])

  useEffect(() => {
    if (!resizingImage) return
    const onMove = (e: MouseEvent) => {
      const { itemId, startX, startY, startW, startH } = resizingImage
      const item = itemsRef.current.find((entry) => entry.id === itemId)
      if (!item?.image) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      let newW = Math.max(40, startW + dx)
      let newH = Math.max(40, startH + dy)
      if (e.shiftKey) {
        const ratio = item.image.naturalWidth / item.image.naturalHeight
        newH = Math.round(newW / ratio)
      }
      onUpdateImage(itemId, { ...item.image, width: newW, height: newH })
    }
    const onUp = () => setResizingImage(null)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [onUpdateImage, resizingImage])

  return { handleImageDragStart, handleResizeStart }
}
