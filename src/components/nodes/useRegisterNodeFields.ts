'use client'

import { useLayoutEffect } from 'react'
import { registerFieldMount, unregisterFieldMount } from './nodeValidationStore'

/** Registers answer/button fields so validation only applies after the next save. */
export function useRegisterNodeFields(nodeId: string, fieldIds: string[]) {
  const fieldKey = fieldIds.join(',')

  useLayoutEffect(() => {
    fieldIds.forEach((fieldId) => registerFieldMount(nodeId, fieldId))
    return () => {
      fieldIds.forEach((fieldId) => unregisterFieldMount(nodeId, fieldId))
    }
  }, [nodeId, fieldKey])
}
