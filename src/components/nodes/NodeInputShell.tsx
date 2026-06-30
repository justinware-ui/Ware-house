'use client'

import { useRef, useState } from 'react'
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
  onMouseDown,
  suppressHover = false,
  invalid = false,
  label,
  nodeActive = false,
  primaryField = false,
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
  onMouseDown?: (e: React.MouseEvent) => void
  /** Hide dashed hover border — e.g. while another row is being dragged to reorder. */
  suppressHover?: boolean
  children: React.ReactNode
  className?: string
  minHeight?: number
  padding?: string | number
  invalid?: boolean
  /** When provided, a small floating label appears above the field while focused. */
  label?: string
  /** When true, all shells on the card show the dashed-orange affordance + label together. */
  nodeActive?: boolean
  /** Header / Question / Screengrab name — auto-focus on card click only while the node is empty. */
  primaryField?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)

  const setHover = (next: boolean) => {
    setHovered(next)
    onHoverChange?.(next)
  }

  const showClearButton = focused && !!onClear && (showClearWhenEmpty || hasContent)

  // Keep a stable DOM tree when onClear is set — toggling the wrapper remounts inputs and drops focus.
  const content = onClear ? (
    <NodeInputFieldRow showClear={showClearButton} onClear={onClear} clearLabel={clearLabel}>
      {children}
    </NodeInputFieldRow>
  ) : (
    children
  )

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) { onClick(); return }
    // If the click landed on a native input / contenteditable / button, let the browser handle it
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.closest('button')
    ) return
    // Otherwise focus the first focusable element inside the shell
    shellRef.current
      ?.querySelector<HTMLElement>('input, textarea, [contenteditable="true"]')
      ?.focus()
  }

  const shell = (
    <div
      ref={shellRef}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={handleClick}
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
      onMouseDown={(e) => {
        e.stopPropagation()
        onMouseDown?.(e)
      }}
      className={`nodrag nopan ${className}`}
      style={{
        minHeight,
        padding: typeof padding === 'number' ? `${padding}px` : padding,
        ...inputShellStyles((hovered || nodeActive) && !suppressHover, focused, invalid),
        cursor: 'text',
      }}
      data-input-shell
      {...(primaryField ? { 'data-primary-field': true } : {})}
    >
      {content}
    </div>
  )

  if (!label) return shell

  return (
    <div data-field-anchor style={{ position: 'relative', paddingTop: 20 }}>
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: 1,
          fontSize: 11,
          lineHeight: 1,
          fontWeight: 500,
          color: '#8D8A87',
          opacity: focused || nodeActive ? 1 : 0,
          transition: 'opacity 0.15s ease',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {label}
      </span>
      {shell}
    </div>
  )
}
