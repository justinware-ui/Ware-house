'use client'

import { NODE_BODY_PADDING_RIGHT } from './nodeFieldStyles'

export default function NodeInputSection({
  className = '',
  style,
  children,
}: {
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <div
      className={`px-5 overflow-visible ${className}`}
      style={{ paddingRight: NODE_BODY_PADDING_RIGHT, ...style }}
    >
      {children}
    </div>
  )
}
