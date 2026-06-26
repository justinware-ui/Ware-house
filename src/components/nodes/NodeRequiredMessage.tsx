'use client'

import { NODE_ERROR_COLOR, REQUIRED_FIELD_MESSAGE } from './nodeValidation'

export default function NodeRequiredMessage({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <p className="text-sm mt-1.5" style={{ color: NODE_ERROR_COLOR }}>
      {REQUIRED_FIELD_MESSAGE}
    </p>
  )
}
