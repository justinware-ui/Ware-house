import { triggerGlobalNodeValidation } from './nodeValidationStore'

export const NODE_VALIDATION_REQUEST = 'node-validation-request'

export const NODE_ERROR_COLOR = '#D02A2A'
export const NODE_ERROR_BANNER_BG = '#D02A2A'
export const REQUIRED_FIELD_MESSAGE = 'Required field'

export function isFieldEmpty(value?: string) {
  return !value?.trim()
}

export function requestGlobalNodeValidation() {
  triggerGlobalNodeValidation()
  document.dispatchEvent(new CustomEvent(NODE_VALIDATION_REQUEST))
}
