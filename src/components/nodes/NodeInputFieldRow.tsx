'use client'

import NodeInputClearButton from './NodeInputClearButton'

export function NodeInputFieldRow({
  showClear,
  onClear,
  clearLabel = 'Clear',
  className = '',
  children,
}: {
  showClear: boolean
  onClear: () => void
  clearLabel?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <div className="flex-1 min-w-0">{children}</div>
      <NodeInputClearButton
        onClear={onClear}
        ariaLabel={clearLabel}
        className={`mt-0.5 shrink-0 ${showClear ? '' : 'invisible pointer-events-none'}`}
        tabIndex={showClear ? 0 : -1}
        aria-hidden={!showClear}
      />
    </div>
  )
}

/** Clear field text, or remove the row when already empty. */
export function clearOrRemoveField(
  value: string,
  onClear: () => void,
  onRemove?: () => void,
) {
  if (value.trim()) {
    onClear()
  } else if (onRemove) {
    onRemove()
  }
}
