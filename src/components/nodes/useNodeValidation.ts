'use client'

import { useLayoutEffect, useSyncExternalStore } from 'react'
import {
  registerNodeErrorChecker,
  unregisterNodeErrorChecker,
  registerNodeMount,
  shouldShowNodeValidation,
  subscribeNodeValidation,
  unregisterNodeMount,
  getValidationGeneration,
} from './nodeValidationStore'

/** Validation UI appears only after Save and Continue, not on Preview or when a node is first placed. */
export function useNodeValidation(nodeId: string, getHasErrors?: () => boolean) {
  useSyncExternalStore(
    subscribeNodeValidation,
    getValidationGeneration,
    getValidationGeneration,
  )

  useLayoutEffect(() => {
    registerNodeMount(nodeId)
    if (getHasErrors) registerNodeErrorChecker(nodeId, getHasErrors)
    return () => {
      unregisterNodeMount(nodeId)
      if (getHasErrors) unregisterNodeErrorChecker(nodeId)
    }
  }, [nodeId, getHasErrors])

  const showValidation = shouldShowNodeValidation(nodeId)

  return { showValidation }
}
