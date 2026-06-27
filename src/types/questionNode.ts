import type { AnswerImage } from '@/components/nodes/answerImage'

export type QuestionOption = {
  id: number
  value: string
  description?: string
  descriptionImage?: AnswerImage
}

export type QuestionNodeData = {
  label: string
  question: string
  options: QuestionOption[]
}

export const DEFAULT_QUESTION_DATA: QuestionNodeData = {
  label: 'Discovery Question',
  question: '',
  options: [],
}

export function optionsFromValues(values: string[]): QuestionOption[] {
  const base = Date.now()
  return values.map((value, i) => ({ id: base + i, value }))
}
