'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BLUR_RETAIN_SELECTORS } from './nodeFieldStyles'
import { useAnchoredToolbar } from './useAnchoredToolbar'
import { useFormattingToolbar } from './useFormattingToolbar'

type UseNodeFormattingToolbarOptions = {
  nodeId: string
  containerRef: React.RefObject<HTMLElement | null>
  /** Extra visibility gate — e.g. !tooltipMode or !suppressFieldAffordances */
  enabled?: boolean
  shouldRetainFocus?: () => boolean
  onBlurClear?: () => void
  onFocusClear?: () => void
}

export function useNodeFormattingToolbar({
  nodeId,
  containerRef,
  enabled = true,
  shouldRetainFocus,
  onBlurClear,
  onFocusClear,
}: UseNodeFormattingToolbarOptions) {
  const toolbarAnchorRef = useRef<HTMLElement | null>(null)
  const toolbarDraggingRef = useRef(false)
  const toolbarPointerRef = useRef(false)
  const toolbarPinnedRef = useRef(false)
  const [toolbarAnchorVersion, setToolbarAnchorVersion] = useState(0)

  const formatting = useFormattingToolbar({
    nodeId,
    shouldRetainFocus: () =>
      toolbarDraggingRef.current ||
      toolbarPointerRef.current ||
      toolbarPinnedRef.current ||
      (shouldRetainFocus?.() ?? false),
    onBlurClear,
    onFocusClear,
  })

  const { setShowToolbar } = formatting

  const toolbarVisible = formatting.showToolbar && enabled

  const onManualPositionChange = useCallback((pinned: boolean) => {
    toolbarPinnedRef.current = pinned
  }, [])

  const { toolbarRef, toolbarStyle, handleDragStart, resetManualPosition, remeasure } =
    useAnchoredToolbar({
    containerRef,
    anchorRef: toolbarAnchorRef,
    anchorVersion: toolbarAnchorVersion,
    showToolbar: toolbarVisible,
    draggingRef: toolbarDraggingRef,
    onManualPositionChange,
  })

  useEffect(() => {
    if (!formatting.showToolbar) {
      toolbarPinnedRef.current = false
      return
    }

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      toolbarPointerRef.current = !!target.closest('[data-toolbar]')
    }

    const onPointerUp = () => {
      window.setTimeout(() => {
        toolbarPointerRef.current = false
      }, 150)
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('pointerup', onPointerUp, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('pointerup', onPointerUp, true)
    }
  }, [formatting.showToolbar])

  useEffect(() => {
    if (!formatting.showToolbar) return

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-toolbar]') || target.closest(BLUR_RETAIN_SELECTORS)) return
      if (!containerRef.current?.contains(target)) {
        toolbarPinnedRef.current = false
        resetManualPosition()
      }
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [containerRef, formatting.showToolbar, resetManualPosition])

  const followToolbarToShell = useCallback(
    (shell: HTMLElement | null) => {
      toolbarPinnedRef.current = false
      resetManualPosition()
      const resolved =
        shell == null
          ? null
          : shell.matches('[data-input-shell]')
            ? shell
            : shell.closest('[data-input-shell]')
      toolbarAnchorRef.current = resolved instanceof HTMLElement ? resolved : null
      setToolbarAnchorVersion((version) => version + 1)
    },
    [resetManualPosition],
  )

  const followToolbarToField = useCallback(
    (target: EventTarget | null) => {
      const el = target as HTMLElement | null
      followToolbarToShell(el?.closest?.('[data-input-shell]') ?? null)
    },
    [followToolbarToShell],
  )

  const anchorToolbarToField = followToolbarToField

  const anchorToolbarToShell = useCallback(
    (shell: HTMLElement | null) => {
      if (shell == null) {
        followToolbarToShell(null)
        return
      }
      const resolved = shell.matches('[data-input-shell]')
        ? shell
        : shell.closest('[data-input-shell]')
      if (resolved === toolbarAnchorRef.current) {
        toolbarPinnedRef.current = false
        resetManualPosition()
        setToolbarAnchorVersion((version) => version + 1)
        return
      }
      followToolbarToShell(resolved instanceof HTMLElement ? resolved : null)
    },
    [followToolbarToShell, resetManualPosition],
  )

  const hideToolbar = useCallback(() => {
    setShowToolbar(false)
    toolbarPinnedRef.current = false
    resetManualPosition()
  }, [resetManualPosition, setShowToolbar])

  return {
    ...formatting,
    toolbarVisible,
    toolbarRef,
    toolbarStyle,
    handleToolbarDragStart: handleDragStart,
    anchorToolbarToField,
    anchorToolbarToShell,
    followToolbarToField,
    followToolbarToShell,
    remeasure,
    hideToolbar,
  }
}
