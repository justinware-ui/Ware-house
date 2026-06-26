export const INPUT_MIN_HEIGHT = 41

export const NODE_DEFAULT_WIDTH = 412

export const NODE_HANDLE_SIZE = 14
export const NODE_HANDLE_CLASS = '!bg-[#FC6839] !border-white !border-2'
export const NODE_HANDLE_STYLE = { width: NODE_HANDLE_SIZE, height: NODE_HANDLE_SIZE } as const
export const NODE_HANDLE_SIDE_STYLE = { ...NODE_HANDLE_STYLE, top: '50%' } as const
export const NODE_BODY_PADDING_RIGHT = 28
export const NODE_INPUT_INNER_CLASS = 'px-4 py-2.5'
/** With translate(50%, -50%), positions handle center on the node border. */
export const NODE_HANDLE_INLINE_OFFSET = -NODE_BODY_PADDING_RIGHT

export const ANSWER_ROW_GRIP_HEIGHT = 24
export const ANSWER_ROW_DRAG_BORDER = '#D0CBC6'
/** Vertical center of the answer line in a combined answer + description shell. */
export const ANSWER_INLINE_HANDLE_TOP = 20
export const ANSWER_INLINE_HANDLE_TOP_WITH_GRIP = 14

export const PLACEHOLDERS = {
  question: 'Type your question here',
  answer: 'Type your answer here',
  description: 'Type your description here (optional)',
  header: 'Type your header here',
  message: 'Type your message here',
  button: 'Type your button text here',
  url: 'Type button URL here',
  tooltip: 'Type your tool-tip here',
  screenshotName: 'Enter your screenshot name here',
  hotspotName: 'Type your hotspot name here',
} as const

export const QUESTION_FIELD_CLASS = 'text-base font-semibold text-gray-800'
export const QUESTION_INPUT_CLASS = `nodrag w-full ${QUESTION_FIELD_CLASS} placeholder:text-gray-800 placeholder:font-semibold placeholder:opacity-100 focus:placeholder:opacity-60 outline-none bg-transparent`

export const ANSWER_FIELD_CLASS = 'text-base text-gray-800'
export const ANSWER_INPUT_CLASS = `nodrag w-full flex-1 min-w-0 ${ANSWER_FIELD_CLASS} placeholder:text-gray-800 placeholder:opacity-100 focus:placeholder:opacity-60 outline-none bg-transparent`

export const DESCRIPTION_FIELD_CLASS = 'text-sm text-gray-800'
export const DESCRIPTION_PLACEHOLDER_CLASS = 'text-sm text-gray-800 opacity-60'
export const DESCRIPTION_INPUT_CLASS = `nodrag w-full ${DESCRIPTION_FIELD_CLASS} placeholder:text-gray-800 placeholder:opacity-60 focus:placeholder:opacity-60 outline-none bg-transparent`

export const HEADER_INPUT_CLASS = QUESTION_INPUT_CLASS
export const MESSAGE_FIELD_CLASS = 'text-base text-gray-800'
export const BUTTON_INPUT_CLASS = `nodrag w-full text-base text-[#FC6839] placeholder:text-[#FC6839] placeholder:opacity-100 focus:placeholder:opacity-60 outline-none bg-transparent`
export const URL_INPUT_CLASS = BUTTON_INPUT_CLASS
export const TOOLTIP_INPUT_CLASS = `nodrag w-full text-sm text-gray-800 placeholder:text-[#FC6839] placeholder:opacity-60 focus:placeholder:opacity-60 outline-none bg-transparent`

export const DESCRIPTION_RICH_TEXT_PLACEHOLDER_CLASS =
  '[&:empty]:before:content-[attr(data-placeholder)] before:block before:pointer-events-none before:text-gray-800 before:opacity-60'

export const RICH_TEXT_PLACEHOLDER_CLASS =
  'before:content-[attr(data-placeholder)] before:pointer-events-none before:text-[#FC6839] focus:before:opacity-60'

export const ANSWER_RICH_TEXT_PLACEHOLDER_CLASS =
  'before:content-[attr(data-placeholder)] before:pointer-events-none before:text-gray-800 before:opacity-100 focus:before:opacity-60'

export const BLUR_RETAIN_SELECTORS =
  '[data-toolbar], [data-cta-field], [data-answer-content]'

import { NODE_ERROR_COLOR } from './nodeValidation'

export { NODE_ERROR_COLOR } from './nodeValidation'

export function inputShellStyles(hovered: boolean, focused: boolean, invalid = false) {
  if (invalid) {
    return {
      borderRadius: 8.5,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: NODE_ERROR_COLOR,
      backgroundColor: 'white',
      boxShadow: `0 0 0 1px ${NODE_ERROR_COLOR}`,
      transition: 'border-color 0.15s, background-color 0.15s, box-shadow 0.15s',
    }
  }
  const showBorder = hovered || focused
  return {
    borderRadius: 8.5,
    borderWidth: 1,
    borderStyle: (focused ? 'solid' : 'dashed') as 'solid' | 'dashed',
    borderColor: showBorder ? (focused ? '#FC6839' : '#FF7A4A') : 'transparent',
    backgroundColor: focused ? '#FFF5EF' : 'white',
    boxShadow: focused ? '0 0 0 1px rgba(252, 104, 57, 0.12)' : undefined,
    transition: 'border-color 0.15s, background-color 0.15s, box-shadow 0.15s',
  }
}
