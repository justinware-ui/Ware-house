'use client'

import NodeInputClearButton from './NodeInputClearButton'

export function NodeInputFieldRow({
  showClear,
  onClear,
  clearLabel = 'Clear',
  className = '',
  clearButtonClassName = '-translate-x-2',
  children,
}: {
  showClear: boolean
  onClear: () => void
  clearLabel?: string
  className?: string
  clearButtonClassName?: string
  children: React.ReactNode
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 min-w-0">{children}</div>
      <NodeInputClearButton
        onClear={onClear}
        ariaLabel={clearLabel}
        className={`shrink-0 ${clearButtonClassName} ${showClear ? '' : 'invisible pointer-events-none'}`}
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
