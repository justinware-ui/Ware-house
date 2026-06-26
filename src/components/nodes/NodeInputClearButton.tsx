'use client'

import { X } from 'lucide-react'

export default function NodeInputClearButton({
  onClear,
  ariaLabel = 'Clear',
  className = '',
}: {
  onClear: () => void
  ariaLabel?: string
  className?: string
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClear}
      className={`p-0.5 rounded text-gray-400 hover:text-red-500 shrink-0 nodrag nopan ${className}`}
      aria-label={ariaLabel}
    >
      <X size={14} />
    </button>
  )
}
