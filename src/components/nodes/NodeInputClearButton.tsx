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
      className={`p-0.5 rounded text-gray-400 hover:text-red-500 shrink-0 nodrag nopan ${className}`}
      aria-label={ariaLabel}
    >
      <X size={14} />
    </button>
  )
}
