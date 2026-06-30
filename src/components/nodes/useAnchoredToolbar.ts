'use client'

import { useStore } from '@xyflow/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const DEFAULT_TOP = 8

type ToolbarPosition = {
  top: number
  left: number
}

function resolveInputShell(anchor: HTMLElement): HTMLElement {
  if (anchor.matches('[data-input-shell]')) return anchor
  const shell = anchor.closest('[data-input-shell]')
  return shell instanceof HTMLElement ? shell : anchor
}

function getLocalScale(element: HTMLElement): number {
  const layoutWidth = element.offsetWidth
  if (layoutWidth <= 0) return 1
  return element.getBoundingClientRect().width / layoutWidth
}

function measureShellToolbarPosition(
  container: HTMLElement,
  shell: HTMLElement,
): ToolbarPosition {
  const scale = getLocalScale(container)
  const containerRect = container.getBoundingClientRect()
  const shellRect = shell.getBoundingClientRect()

  const label = shell
    .closest('[data-field-anchor]')
    ?.querySelector<HTMLElement>('[data-input-label]')

  const labelRect = label?.getBoundingClientRect()
  const screenTop = labelRect
    ? labelRect.top - containerRect.top + labelRect.height / 2
    : shellRect.top - containerRect.top
  const screenLeft = shellRect.left - containerRect.left + shellRect.width / 2

  return {
    top: screenTop / scale,
    left: screenLeft / scale,
  }
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
  const viewportZoom = useStore((state) => state.transform[2])
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
      const shell = resolveInputShell(anchor)
      const next = measureShellToolbarPosition(container, shell)
      setPosition((prev) => {
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
  }, [showToolbar, anchorVersion, manualPos, measurePosition, viewportZoom])

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
      const fieldAnchor = shell.closest('[data-field-anchor]')
      if (fieldAnchor instanceof HTMLElement) observer.observe(fieldAnchor)
      const label = fieldAnchor?.querySelector('[data-input-label]')
      if (label instanceof HTMLElement) observer.observe(label)
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

      const scale = getLocalScale(container)
      const containerRect = container.getBoundingClientRect()
      const toolbarRect = toolbar.getBoundingClientRect()
      const startX = e.clientX
      const startY = e.clientY
      const originCenterY =
        (toolbarRect.top + toolbarRect.height / 2 - containerRect.top) / scale
      const originCenterX =
        (toolbarRect.left + toolbarRect.width / 2 - containerRect.left) / scale

      const onMove = (ev: MouseEvent) => {
        const next = {
          top: originCenterY + (ev.clientY - startY) / scale,
          left: originCenterX + (ev.clientX - startX) / scale,
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
