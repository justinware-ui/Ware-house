'use client'

import { useState } from 'react'
import { INPUT_MIN_HEIGHT, inputShellStyles } from './nodeFieldStyles'

export default function NodeInputShell({
  focused,
  onClick,
  onBlur,
  children,
  className = '',
  minHeight = INPUT_MIN_HEIGHT,
  padding = '10px 16px',
  onHoverChange,
}: {
  focused: boolean
  onClick?: () => void
  onBlur?: (e: React.FocusEvent) => void
  onHoverChange?: (hovered: boolean) => void
  children: React.ReactNode
  className?: string
  minHeight?: number
  padding?: string | number
}) {
  const [hovered, setHovered] = useState(false)

  const setHover = (next: boolean) => {
    setHovered(next)
    onHoverChange?.(next)
  }

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
        ...inputShellStyles(hovered, focused),
        cursor: onClick && !focused ? 'text' : undefined,
      }}
    >
      {children}
    </div>
  )
}
