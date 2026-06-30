'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const DEFAULT_TOP = 8

type ToolbarPosition = {
  top: number
  left: number
}

function resolveInputShell(anchor: HTMLElement) {
  if (anchor.matches('[data-input-shell]')) return anchor
  return anchor.closest('[data-input-shell]') ?? anchor
}

export function useAnchoredToolbar({
  containerRef,
  anchorRef,
  anchorVersion,
  showToolbar,
  draggingRef,
  onManualPositionChange,
}: {
  containerRef: React.RefObject<HTMLElement | null>
  anchorRef: React.RefObject<HTMLElement | null>
  anchorVersion: number
  showToolbar: boolean
  draggingRef?: React.MutableRefObject<boolean>
  onManualPositionChange?: (pinned: boolean) => void
}) {
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const [manualPos, setManualPos] = useState<ToolbarPosition | null>(null)
  const manualPosRef = useRef<ToolbarPosition | null>(null)
  manualPosRef.current = manualPos
  const [position, setPosition] = useState<ToolbarPosition>({
    top: DEFAULT_TOP,
    left: 0,
  })

  useEffect(() => {
    if (!showToolbar) {
      setManualPos(null)
      manualPosRef.current = null
      onManualPositionChange?.(false)
    }
  }, [onManualPositionChange, showToolbar])

  const resetManualPosition = useCallback(() => {
    setManualPos(null)
    manualPosRef.current = null
    onManualPositionChange?.(false)
  }, [onManualPositionChange])

  const measurePosition = useCallback(() => {
    if (manualPosRef.current || draggingRef?.current) return

    const container = containerRef.current
    if (!container) return

    const anchor = anchorRef.current

    if (anchor) {
      const containerRect = container.getBoundingClientRect()
      const shell = resolveInputShell(anchor)
      const shellRect = shell.getBoundingClientRect()
      setPosition((prev) => {
        const next = {
          top: shellRect.top - containerRect.top,
          left: shellRect.left - containerRect.left + shellRect.width / 2,
        }
        if (prev.top === next.top && prev.left === next.left) return prev
        return next
      })
      return
    }

    setPosition((prev) => {
      const next = {
        top: DEFAULT_TOP,
        left: container.clientWidth / 2,
      }
      if (prev.top === next.top && prev.left === next.left) return prev
      return next
    })
  }, [anchorRef, containerRef, draggingRef])

  useLayoutEffect(() => {
    if (!showToolbar) return
    if (manualPos) {
      setPosition(manualPos)
      return
    }
    measurePosition()
    const frame = requestAnimationFrame(() => {
      measurePosition()
      requestAnimationFrame(measurePosition)
    })
    return () => cancelAnimationFrame(frame)
  }, [showToolbar, anchorVersion, manualPos, measurePosition])

  useEffect(() => {
    if (!showToolbar) return
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => measurePosition())
    observer.observe(container)

    const anchor = anchorRef.current
    const shell = anchor ? resolveInputShell(anchor) : null
    if (shell instanceof HTMLElement) {
      observer.observe(shell)
      const row = shell.closest('[data-answer-row]')
      if (row instanceof HTMLElement) observer.observe(row)
    }

    const onScroll = () => measurePosition()
    window.addEventListener('scroll', onScroll, true)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [anchorRef, anchorVersion, containerRef, measurePosition, showToolbar])

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const container = containerRef.current
      const toolbar = toolbarRef.current
      if (!container || !toolbar) return

      if (draggingRef) draggingRef.current = true
      onManualPositionChange?.(true)

      const anchor = anchorRef.current
      const focusTarget =
        anchor instanceof HTMLElement
          ? anchor.matches('input, textarea, [contenteditable="true"]')
            ? anchor
            : anchor.querySelector<HTMLElement>('input, textarea, [contenteditable="true"]')
          : null

      const containerRect = container.getBoundingClientRect()
      const toolbarRect = toolbar.getBoundingClientRect()
      const startX = e.clientX
      const startY = e.clientY
      const originCenterY =
        toolbarRect.top + toolbarRect.height / 2 - containerRect.top
      const originCenterX =
        toolbarRect.left + toolbarRect.width / 2 - containerRect.left

      const onMove = (ev: MouseEvent) => {
        const next = {
          top: originCenterY + (ev.clientY - startY),
          left: originCenterX + (ev.clientX - startX),
        }
        manualPosRef.current = next
        setManualPos(next)
        setPosition(next)
      }

      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        requestAnimationFrame(() => {
          focusTarget?.focus()
          window.setTimeout(() => {
            if (draggingRef) draggingRef.current = false
          }, 150)
        })
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [anchorRef, containerRef, draggingRef, onManualPositionChange],
  )

  const toolbarStyle: React.CSSProperties = {
    top: position.top,
    left: position.left,
    transform: 'translate(-50%, -50%)',
  }

  return { toolbarRef, toolbarStyle, handleDragStart, resetManualPosition, remeasure: measurePosition }
}
