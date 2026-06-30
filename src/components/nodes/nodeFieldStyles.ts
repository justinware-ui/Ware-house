import type { CSSProperties } from 'react'

export const INPUT_MIN_HEIGHT = 41
/** Single-line fields with NODE_INPUT_INNER_CLASS inside a shell with padding={0}. */
export const SINGLE_LINE_FIELD_MIN_HEIGHT = INPUT_MIN_HEIGHT
/** text-lg primary fields use a tighter line-height so shell height matches text-base message/button rows. */
export const PRIMARY_FIELD_LINE_HEIGHT = 24 / 18
export const PRIMARY_SINGLE_LINE_FIELD_STYLE: CSSProperties = {
  lineHeight: PRIMARY_FIELD_LINE_HEIGHT,
  minHeight: SINGLE_LINE_FIELD_MIN_HEIGHT,
}

export const NODE_DEFAULT_WIDTH = 412

export const NODE_HANDLE_SIZE = 18
export const NODE_HANDLE_CLASS = '!bg-[#FC6839] !border-white !border-2'
export const NODE_HANDLE_STYLE = { width: NODE_HANDLE_SIZE, height: NODE_HANDLE_SIZE } as const
export const NODE_HANDLE_SIDE_STYLE = { ...NODE_HANDLE_STYLE, top: '50%' } as const
export const NODE_BODY_PADDING_RIGHT = 28
export const NODE_INPUT_INNER_CLASS = 'px-4 py-2.5'
/** With translate(50%, -50%), positions handle center on the node border. */
export const NODE_HANDLE_INLINE_OFFSET = -NODE_BODY_PADDING_RIGHT

/** Inset inside draggable rows so inputs don't touch the drag border. */
export const DRAG_ROW_INSET = 8
/** Left lane for the drag grip when rows are reorderable. */
export const GRIP_LANE_WIDTH = 28
/** Right lane for the trash remove button — sized to center a 28px button. */
export const FIELD_REMOVE_LANE_PADDING = 36
export const TRASH_BUTTON_SIZE = 28

export const NODE_HEADER_BAR_CLASS = 'px-5 pt-5'
export const NODE_INPUT_SECTION_CLASS = 'pt-3 pb-[33px] flex-1 flex flex-col nodrag nopan'

export const NODE_CARD_MIN_HEIGHT = 307
export const NODE_CARD_BORDER_RADIUS = 8
export const NODE_INPUT_BORDER_RADIUS = 8.5
export const NODE_CARD_SHADOW = '0 20px 20px rgba(48, 41, 33, 0.12)'
export const NODE_CARD_BORDER_DEFAULT = '#E5E7EB'
export const NODE_CARD_BORDER_SELECTED = '#FC6839'

export function nodeContentPaddingLeft(hasReorderLanes = false) {
  return DRAG_ROW_INSET + (hasReorderLanes ? GRIP_LANE_WIDTH : 0)
}

export function nodeContentPaddingRight(hasReorderLanes = false) {
  return DRAG_ROW_INSET + (hasReorderLanes ? FIELD_REMOVE_LANE_PADDING : 0)
}

export function nodeContentInsetStyle(hasReorderLanes = false): CSSProperties {
  return {
    paddingLeft: nodeContentPaddingLeft(hasReorderLanes),
    paddingRight: nodeContentPaddingRight(hasReorderLanes),
  }
}

export function answerHandleRightOffset(hasReorderLanes = false) {
  return -(NODE_BODY_PADDING_RIGHT + nodeContentPaddingRight(hasReorderLanes))
}

/** Distance from a row's right edge to center the trash icon in the right margin lane. */
export function trashRightInset() {
  return DRAG_ROW_INSET + (FIELD_REMOVE_LANE_PADDING - TRASH_BUTTON_SIZE) / 2
}

export const ANSWER_ROW_GRIP_HEIGHT = 24
export const ANSWER_ROW_DRAG_BORDER = '#D0CBC6'
export const ANSWER_ROW_DRAG_SHADOW = '0 2px 8px rgba(41, 55, 72, 0.1)'
export const ANSWER_ROW_DRAGGING_SHADOW = '0 4px 14px rgba(41, 55, 72, 0.14)'

/** Hover/drag highlight for reorderable answer (or button) rows. */
export function answerRowReorderStyles(active: boolean, dragging: boolean) {
  if (!active) {
    return {
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: 'transparent',
      boxShadow: 'none',
      transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
    }
  }
  return {
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: ANSWER_ROW_DRAG_BORDER,
    boxShadow: dragging ? ANSWER_ROW_DRAGGING_SHADOW : ANSWER_ROW_DRAG_SHADOW,
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
  }
}
/** Vertical center of the answer line in a combined answer + description shell. */
export const ANSWER_INLINE_HANDLE_TOP = 20
export const ANSWER_INLINE_HANDLE_TOP_WITH_GRIP = 14

export const PLACEHOLDERS = {
  question: 'Question...',
  answer: 'Answer...',
  description: 'Description (optional)',
  header: 'Header...',
  message: 'Message...',
  button: 'Button text...',
  url: 'Button URL...',
  tooltip: 'Enter your tool-tip here',
  screenshotName: 'Screengrab name...',
  hotspotName: 'Hotspot name...',
} as const

export const QUESTION_FIELD_CLASS = 'text-lg font-semibold text-gray-800'
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
  '[data-toolbar], [data-toolbar-drag], [data-cta-field], [data-answer-content]'

import { NODE_ERROR_COLOR } from './nodeValidation'

export { NODE_ERROR_COLOR } from './nodeValidation'

export function inputShellStyles(hovered: boolean, focused: boolean, invalid = false) {
  if (invalid) {
    return {
      borderRadius: NODE_INPUT_BORDER_RADIUS,
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
    borderRadius: NODE_INPUT_BORDER_RADIUS,
    borderWidth: 1,
    borderStyle: (focused ? 'solid' : 'dashed') as 'solid' | 'dashed',
    borderColor: showBorder ? (focused ? '#FC6839' : '#FF7A4A') : 'transparent',
    backgroundColor: focused ? '#FFF5EF' : 'white',
    boxShadow: focused ? '0 0 0 1px rgba(252, 104, 57, 0.12)' : undefined,
    transition: 'border-color 0.15s, background-color 0.15s, box-shadow 0.15s',
  }
}
