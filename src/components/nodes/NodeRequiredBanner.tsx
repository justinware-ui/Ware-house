'use client'

import { NODE_ERROR_BANNER_BG } from './nodeValidation'

export default function NodeRequiredBanner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`text-white text-sm font-medium px-4 py-2 shrink-0 rounded-t-lg relative z-0 ${className}`}
      style={{ backgroundColor: NODE_ERROR_BANNER_BG }}
    >
      Required
    </div>
  )
}
