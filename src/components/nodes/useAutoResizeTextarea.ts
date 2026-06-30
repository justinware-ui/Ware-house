import { useEffect, useRef } from 'react'
import { INPUT_MIN_HEIGHT } from './nodeFieldStyles'

export function useAutoResizeTextarea(
  value: string,
  minHeight = INPUT_MIN_HEIGHT - 2,
  /** Re-measure when the field container width changes (e.g. node resize). */
  layoutWidth?: number,
) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`
  }, [value, minHeight, layoutWidth])

  return ref
}
