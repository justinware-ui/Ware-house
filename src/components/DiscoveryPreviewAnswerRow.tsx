'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { AnswerImage } from './nodes/answerImage'
import { DescriptionPreviewContent } from './nodes/AnswerInlineImage'

function PreviewCircleIconButton({
  label,
  expanded,
  onClick,
  children,
}: {
  label: string
  expanded: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={expanded}
      className="group/icon relative flex items-center justify-center shrink-0 transition-all cursor-pointer"
      style={{ width: 32, height: 32, borderRadius: 16 }}
    >
      <div
        className="absolute inset-0 rounded-full opacity-0 group-hover/icon:opacity-100 transition-opacity"
        style={{ backgroundColor: 'rgba(115,113,111,0.15)' }}
      />
      <span className="relative">{children}</span>
    </button>
  )
}

export function DiscoveryPreviewAnswerRow({
  answer,
  description,
  descriptionImage,
  answerImage,
}: {
  answer: string
  description?: string
  descriptionImage?: AnswerImage
  answerImage?: { src: string; float?: 'left' | 'right' | 'none' }
}) {
  const [expanded, setExpanded] = useState(false)
  const hasDescription = !!(description?.trim() || descriptionImage)

  return (
    <div className="flex items-start gap-3">
      <div
        className={`flex-1 min-w-0 text-left px-5 py-4 rounded-xl border text-sm text-gray-800 transition-colors ${
          expanded && hasDescription
            ? 'border-[#FC6839] bg-orange-50'
            : 'border-gray-200'
        }`}
      >
        {answerImage && (
          <img src={answerImage.src} alt="" className="rounded mb-3 max-h-40 object-contain" />
        )}
        {answer.trim() ? <span className="block">{answer}</span> : null}
        {expanded && hasDescription && (
          <div className="mt-2">
            <DescriptionPreviewContent description={description} image={descriptionImage} />
          </div>
        )}
      </div>
      {hasDescription && (
        <div className="shrink-0 self-center">
          <PreviewCircleIconButton
            label={expanded ? 'Collapse description' : 'Expand description'}
            expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? (
              <ChevronUp size={20} strokeWidth={2} color="#293748" />
            ) : (
              <ChevronDown size={20} strokeWidth={2} color="#293748" />
            )}
          </PreviewCircleIconButton>
        </div>
      )}
    </div>
  )
}
