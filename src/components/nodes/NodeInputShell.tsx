'use client'

import { useState } from 'react'
import { INPUT_MIN_HEIGHT, inputShellStyles } from './nodeFieldStyles'
import { NodeInputFieldRow } from './NodeInputFieldRow'

export default function NodeInputShell({
  focused,
  onClick,
  onBlur,
  onClear,
  clearLabel = 'Clear',
  hasContent = false,
  showClearWhenEmpty = false,
  children,
  className = '',
  minHeight = INPUT_MIN_HEIGHT,
  padding = '10px 16px',
  onHoverChange,
  invalid = false,
}: {
  focused: boolean
  onClick?: () => void
  onBlur?: (e: React.FocusEvent) => void
  onClear?: () => void
  clearLabel?: string
  /** When false (default), clear button only appears once the field has content. */
  hasContent?: boolean
  /** Answer fields show clear while focused even when empty. */
  showClearWhenEmpty?: boolean
  onHoverChange?: (hovered: boolean) => void
  children: React.ReactNode
  className?: string
  minHeight?: number
  padding?: string | number
  invalid?: boolean
}) {
  const [hovered, setHovered] = useState(false)

  const setHover = (next: boolean) => {
    setHovered(next)
    onHoverChange?.(next)
  }

  const showClearButton = focused && !!onClear && (showClearWhenEmpty || hasContent)

  const content =
    showClearButton && onClear ? (
      <NodeInputFieldRow showClear onClear={onClear} clearLabel={clearLabel}>
        {children}
      </NodeInputFieldRow>
    ) : (
      children
    )

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onBlur={onBlur}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`nodrag nopan ${className}`}
      style={{
        minHeight,
        padding: typeof padding === 'number' ? `${padding}px` : padding,
        ...inputShellStyles(hovered, focused, invalid),
        cursor: onClick && !focused ? 'text' : undefined,
      }}
    >
      {content}
    </div>
  )
}
