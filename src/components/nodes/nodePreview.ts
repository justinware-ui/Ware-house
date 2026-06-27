import { isFieldEmpty } from './nodeValidation'
import type { AnswerImage } from './answerImage'
import type { QuestionOption } from '@/types/questionNode'

/** True when the node has user-entered content worth previewing. */
export function hasDiscoveryPreviewContent(question: string, options: QuestionOption[]) {
  if (!isFieldEmpty(question)) return true
  return options.some(
    (option) =>
      !isFieldEmpty(option.value) ||
      !isFieldEmpty(option.description) ||
      !!option.descriptionImage,
  )
}

export function hasAnswerListPreviewContent(
  question: string,
  answers: { value: string; image?: AnswerImage }[],
) {
  if (!isFieldEmpty(question)) return true
  return answers.some((answer) => !isFieldEmpty(answer.value) || !!answer.image)
}

export function hasDialogPreviewContent(
  header: string,
  message: string,
  messageImage: AnswerImage | null | undefined,
  buttons: { text: string; url?: string }[],
) {
  if (!isFieldEmpty(header)) return true
  if (!isFieldEmpty(message)) return true
  if (messageImage) return true
  return buttons.some((button) => !isFieldEmpty(button.text) || !isFieldEmpty(button.url))
}
