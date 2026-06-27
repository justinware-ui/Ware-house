'use client'

import { X } from 'lucide-react'

export default function NodeInputClearButton({
  onClear,
  ariaLabel = 'Clear',
  className = '',
  tabIndex,
  'aria-hidden': ariaHidden,
}: {
  onClear: () => void
  ariaLabel?: string
  className?: string
  tabIndex?: number
  'aria-hidden'?: boolean
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClear}
      tabIndex={tabIndex}
      aria-hidden={ariaHidden}
      className={`p-0.5 rounded shrink-0 nodrag nopan text-[#172537] hover:text-[#172537] hover:opacity-70 ${className}`}
      aria-label={ariaLabel}
    >
      <X size={14} />
    </button>
  )
}
