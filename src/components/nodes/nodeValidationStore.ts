type Listener = () => void

type ErrorChecker = () => boolean

let saveGeneration = 0
const nodeMountGeneration = new Map<string, number>()
const fieldMountGeneration = new Map<string, number>()
const errorCheckers = new Map<string, ErrorChecker>()
const listeners = new Set<Listener>()

function fieldKey(nodeId: string, fieldId: string) {
  return `${nodeId}:${fieldId}`
}

function emit() {
  listeners.forEach((listener) => listener())
}

export function triggerGlobalNodeValidation() {
  saveGeneration += 1
  emit()
}

export function subscribeNodeValidation(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getValidationGeneration() {
  return saveGeneration
}

export function registerNodeErrorChecker(nodeId: string, checker: ErrorChecker) {
  errorCheckers.set(nodeId, checker)
}

export function unregisterNodeErrorChecker(nodeId: string) {
  errorCheckers.delete(nodeId)
}

export function hasAnyValidationErrors() {
  for (const checker of errorCheckers.values()) {
    if (checker()) return true
  }
  return false
}

export function registerNodeMount(nodeId: string) {
  if (!nodeMountGeneration.has(nodeId)) {
    nodeMountGeneration.set(nodeId, saveGeneration)
  }
}

export function unregisterNodeMount(nodeId: string) {
  nodeMountGeneration.delete(nodeId)
}

/** True only after Save and Continue, and only for nodes that existed before that save. */
export function shouldShowNodeValidation(nodeId: string) {
  if (saveGeneration === 0) return false
  const mountGeneration = nodeMountGeneration.get(nodeId)
  if (mountGeneration === undefined) return false
  return saveGeneration > mountGeneration
}

export function registerFieldMount(nodeId: string, fieldId: string) {
  const key = fieldKey(nodeId, fieldId)
  if (!fieldMountGeneration.has(key)) {
    fieldMountGeneration.set(key, saveGeneration)
  }
}

export function unregisterFieldMount(nodeId: string, fieldId: string) {
  fieldMountGeneration.delete(fieldKey(nodeId, fieldId))
}

/** True when a field (e.g. a newly added answer) should show validation after save. */
export function shouldShowFieldValidation(nodeId: string, fieldId: string) {
  if (saveGeneration === 0) return false
  const mountGeneration = fieldMountGeneration.get(fieldKey(nodeId, fieldId))
  if (mountGeneration === undefined) return false
  return saveGeneration > mountGeneration
}
