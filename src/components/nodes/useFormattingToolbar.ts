'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormatOption } from './FormattingToolbar'
import { BLUR_RETAIN_SELECTORS } from './nodeFieldStyles'

type UseFormattingToolbarOptions = {
  nodeId: string
  /** Return true to keep toolbar open during blur */
  shouldRetainFocus?: () => boolean
  onFocusClear?: () => void
  onBlurClear?: () => void
}

export function useFormattingToolbar({
  nodeId,
  shouldRetainFocus,
  onFocusClear,
  onBlurClear,
}: UseFormattingToolbarOptions) {
  const [showToolbar, setShowToolbar] = useState(false)
  const [activeFormats, setActiveFormats] = useState<Set<FormatOption>>(new Set())
  const suppressSelectionRef = useRef(false)
  const blurHideTimerRef = useRef<number | null>(null)

  const handleFieldFocus = useCallback(() => {
    if (blurHideTimerRef.current !== null) {
      window.clearTimeout(blurHideTimerRef.current)
      blurHideTimerRef.current = null
    }
    suppressSelectionRef.current = true
    setActiveFormats(new Set())
    onFocusClear?.()
    setShowToolbar(true)
    document.dispatchEvent(new CustomEvent('toolbar-open', { detail: nodeId }))
    requestAnimationFrame(() => {
      suppressSelectionRef.current = false
    })
  }, [nodeId, onFocusClear])

  const handleFieldBlur = useCallback(
    (e: React.FocusEvent) => {
      if (blurHideTimerRef.current !== null) {
        window.clearTimeout(blurHideTimerRef.current)
      }

      blurHideTimerRef.current = window.setTimeout(() => {
        blurHideTimerRef.current = null
        if (shouldRetainFocus?.()) return
        const related = e.relatedTarget as HTMLElement | null
        if (related?.closest(BLUR_RETAIN_SELECTORS)) return
        if (document.activeElement?.closest(BLUR_RETAIN_SELECTORS)) return
        setShowToolbar(false)
        onBlurClear?.()
      }, 120)
    },
    [shouldRetainFocus, onBlurClear],
  )

  const toggleRichFormat = useCallback((fmt: 'bold' | 'italic' | 'underline') => {
    document.execCommand(fmt)
    setActiveFormats((prev) => {
      const next = new Set(prev)
      if (document.queryCommandState(fmt)) next.add(fmt)
      else next.delete(fmt)
      return next
    })
  }, [])

  const toggleToggleFormat = useCallback((fmt: FormatOption) => {
    setActiveFormats((prev) => {
      const next = new Set(prev)
      if (next.has(fmt)) next.delete(fmt)
      else next.add(fmt)
      return next
    })
  }, [])

  useEffect(() => {
    if (!showToolbar) return
    const handleSelectionChange = () => {
      if (suppressSelectionRef.current) return
      const active = document.activeElement as HTMLElement | null
      if (!active?.closest('[data-cta-field]')) {
        const sel = window.getSelection()
        const anchor = sel?.anchorNode
        if (!anchor) {
          setActiveFormats(new Set())
          return
        }
        const el =
          anchor.nodeType === 3 ? anchor.parentElement : (anchor as Element)
        if (!el?.closest?.('[contenteditable]')) {
          setActiveFormats(new Set())
          return
        }
      } else if (active.matches('input, textarea')) {
        return
      }

      const sel = window.getSelection()
      const anchor = sel?.anchorNode
      const el =
        active?.closest('[data-cta-field]') ??
        (anchor instanceof Node
          ? anchor.nodeType === 3
            ? anchor.parentElement
            : (anchor as Element)
          : null)
      if (!el) {
        setActiveFormats(new Set())
        return
      }
      if (el.matches('input, textarea')) return

      setActiveFormats((prev) => {
        const next = new Set<FormatOption>()
        for (const f of ['bold', 'italic', 'underline'] as FormatOption[]) {
          if (document.queryCommandState(f)) next.add(f)
        }
        if (next.size !== prev.size || [...next].some((v) => !prev.has(v))) return next
        return prev
      })
    }
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [showToolbar])

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail !== nodeId) setShowToolbar(false)
    }
    document.addEventListener('toolbar-open', handler)
    return () => {
      document.removeEventListener('toolbar-open', handler)
      if (blurHideTimerRef.current !== null) {
        window.clearTimeout(blurHideTimerRef.current)
      }
    }
  }, [nodeId])

  return {
    showToolbar,
    setShowToolbar,
    activeFormats,
    setActiveFormats,
    handleFieldFocus,
    handleFieldBlur,
    toggleRichFormat,
    toggleToggleFormat,
  }
}
