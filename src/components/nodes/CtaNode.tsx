'use client'

import { useState, useCallback, useMemo, useRef, useLayoutEffect, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { type NodeProps, useReactFlow, useUpdateNodeInternals } from '@xyflow/react'
import { Copy, X, CircleHelp, Plus } from 'lucide-react'
import {
  HeaderIconButton,
  DuplicateIcon,
  PreviewEyeIcon,
  DeleteIcon,
  NodeHeaderBar,
} from './NodeHeaderActions'
import InteractionPreviewModal from '../InteractionPreviewModal'
import FormattingToolbar, { type FormatOption } from './FormattingToolbar'
import NodeInputShell from './NodeInputShell'
import { clearOrRemoveField } from './NodeInputFieldRow'
import {
  PRIMARY_SINGLE_LINE_FIELD_STYLE,
  SINGLE_LINE_FIELD_MIN_HEIGHT,
  PLACEHOLDERS,
  QUESTION_INPUT_CLASS,
  TOOLTIP_INPUT_CLASS,
  ANSWER_FIELD_CLASS,
  ANSWER_RICH_TEXT_PLACEHOLDER_CLASS,
  NODE_DEFAULT_WIDTH,
  NODE_INPUT_INNER_CLASS,
  ANSWER_ROW_GRIP_HEIGHT,
  ANSWER_INLINE_HANDLE_TOP,
  ANSWER_INLINE_HANDLE_TOP_WITH_GRIP,
  answerRowReorderStyles,
  NODE_CARD_BORDER_RADIUS,
} from './nodeFieldStyles'
import { NodeSideTargetHandle } from './NodeConnectorHandles'
import { useNodeFormattingToolbar } from './useNodeFormattingToolbar'
import { useNodeActive } from './useNodeActive'
import { handleNodeCardClick } from './handleNodeCardClick'
import { useAutoResizeTextarea } from './useAutoResizeTextarea'
import NodeResizeHandle from './NodeResizeHandle'
import NodeRequiredBanner from './NodeRequiredBanner'
import RequiredFieldGroup from './RequiredFieldGroup'
import NodeInputSection from './NodeInputSection'
import { useNodeValidation } from './useNodeValidation'
import { useRegisterNodeFields } from './useRegisterNodeFields'
import { isFieldEmpty, NODE_ERROR_COLOR } from './nodeValidation'
import { hasAnswerListPreviewContent } from './nodePreview'
import {
  registerFieldMount,
  shouldShowFieldValidation,
  unregisterFieldMount,
} from './nodeValidationStore'

function DiscoveryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.966 12c.234 0 .431-.081.592-.242.161-.161.242-.358.242-.591 0-.234-.08-.431-.242-.592a.806.806 0 0 0-.592-.242.806.806 0 0 0-.592.242.806.806 0 0 0-.242.592c0 .233.08.43.241.591.162.161.359.242.593.242Zm.1-6.867c.31 0 .56.086.75.258.188.173.283.398.283.675 0 .19-.064.381-.191.575a3.64 3.64 0 0 1-.542.609c-.334.289-.578.567-.734.833-.155.267-.233.534-.233.8 0 .156.058.287.175.392a.498.498 0 0 0 .408.159.498.498 0 0 0 .417-.167.76.76 0 0 0 .233-.417c.034-.189.109-.364.226-.525.116-.161.308-.37.575-.625.344-.323.586-.617.725-.884.139-.266.208-.561.208-.883 0-.567-.213-1.031-.641-1.392-.428-.361-.981-.541-1.659-.541-.466 0-.88.089-1.241.266-.362.178-.642.45-.842.817a.583.583 0 0 0-.084.425c.023.138.1.253.234.341a.523.523 0 0 0 .475.084.556.556 0 0 0 .425-.284 1.04 1.04 0 0 1 .442-.383c.172-.089.369-.134.591-.134ZM8 14.666a6.65 6.65 0 0 1-2.584-.525 6.698 6.698 0 0 1-2.125-1.425 6.677 6.677 0 0 1-1.433-2.116A6.521 6.521 0 0 1 1.333 8c0-.922.175-1.789.525-2.6a6.682 6.682 0 0 1 1.434-2.117A6.692 6.692 0 0 1 5.416 1.858 6.649 6.649 0 0 1 8 1.333c.933 0 1.805.175 2.616.525a6.71 6.71 0 0 1 2.117 1.425A6.711 6.711 0 0 1 14.15 5.4c.344.811.516 1.678.516 2.6 0 .922-.172 1.789-.517 2.6a6.711 6.711 0 0 1-1.416 2.116 6.692 6.692 0 0 1-2.117 1.425 6.598 6.598 0 0 1-2.617.525ZM8 13.333c1.489 0 2.75-.52 3.783-1.558C12.816 10.736 13.333 9.478 13.333 8c0-1.478-.517-2.736-1.55-3.776C10.75 3.186 9.489 2.666 8 2.666c-1.456 0-2.709.52-3.759 1.558C3.191 5.264 2.666 6.522 2.666 8c0 1.478.525 2.736 1.575 3.775 1.05 1.039 2.303 1.558 3.759 1.558Z"
        fill="#61B08B"
      />
    </svg>
  )
}

interface AnswerImage {
  src: string
  width: number
  height: number
  naturalWidth: number
  naturalHeight: number
  float: 'left' | 'right' | 'none'
  offsetX: number
  offsetY: number
}

interface Answer {
  id: number
  value: string
  image?: AnswerImage
}

export default function CtaNode({ id, data }: NodeProps) {
  const { setNodes, setEdges, getNodes } = useReactFlow()
  const updateNodeInternals = useUpdateNodeInternals()
  const typedData = data as { question?: string; answers?: string[] }
  const [question, setQuestion] = useState(typedData.question ?? '')
  const [answers, setAnswers] = useState<Answer[]>(() => {
    if (typedData.answers && typedData.answers.length > 0) {
      return typedData.answers.map((v, i) => ({ id: i, value: v }))
    }
    return [{ id: 0, value: '' }]
  })

  const dataAnswersLen = typedData.answers?.length ?? 0
  useEffect(() => {
    if (typedData.answers && typedData.answers.length > answers.length) {
      const newEntries = typedData.answers.slice(answers.length)
      setAnswers((prev) => {
        const nextId = prev.length
        return [
          ...prev,
          ...newEntries.map((v, i) => ({ id: nextId + i, value: v })),
        ]
      })
    }
  }, [dataAnswersLen])

  const [showPreview, setShowPreview] = useState(false)

  const answerOrderKey = answers.map((a) => a.id).join(',')
  const answerFieldIds = useMemo(
    () => answers.map((a) => `answer-${a.id}`),
    [answerOrderKey],
  )
  useRegisterNodeFields(id, answerFieldIds)

  const getHasErrors = useCallback(() => {
    if (isFieldEmpty(question)) return true
    if (answers.some((a) => isFieldEmpty(a.value) && shouldShowFieldValidation(id, `answer-${a.id}`))) {
      return true
    }
    return false
  }, [question, answers, id])

  const { showValidation } = useNodeValidation(id, getHasErrors)
  const nodeHasErrors = showValidation && getHasErrors()
  const questionInvalid = showValidation && isFieldEmpty(question)
  const canPreview = useMemo(
    () => hasAnswerListPreviewContent(question, answers),
    [question, answers],
  )

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canPreview) return
    setShowPreview(true)
  }

  const [focusedField, setFocusedField] = useState<'question' | 'answer' | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [gripHoveredId, setGripHoveredId] = useState<number | null>(null)
  const [tooltipMode, setTooltipMode] = useState(false)
  const [tooltips, setTooltips] = useState<Record<number, string>>({})
  const [draftTooltips, setDraftTooltips] = useState<Record<number, string>>({})
  const [showOverlay, setShowOverlay] = useState(false)
  const [focusedAnswerId, setFocusedAnswerId] = useState<number | null>(null)
  const [focusedTooltipId, setFocusedTooltipId] = useState<number | null>(null)
  const [resizingImage, setResizingImage] = useState<{ answerId: number; startX: number; startY: number; startW: number; startH: number; corner: string } | null>(null)
  const [draggingImage, setDraggingImage] = useState<{ answerId: number; startX: number; startY: number; startOffX: number; startOffY: number } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const answerRefs = useRef<(HTMLDivElement | null)[]>([])
  const answersRef = useRef(answers)
  answersRef.current = answers
  const dragIndexRef = useRef<number | null>(null)

  const nodeActive = useNodeActive(cardRef)
  const {
    activeFormats,
    handleFieldFocus,
    handleFieldBlur,
    toggleRichFormat,
    toggleToggleFormat,
    toolbarVisible,
    toolbarRef,
    toolbarStyle,
    handleToolbarDragStart,
    anchorToolbarToField,
    hideToolbar,
  } = useNodeFormattingToolbar({
    nodeId: id,
    containerRef: cardRef,
    enabled: !tooltipMode,
    onBlurClear: () => setFocusedField(null),
  })

  useEffect(() => {
    updateNodeInternals(id)
  }, [answerOrderKey, id, updateNodeInternals])

  const addAnswer = () => {
    const newId = Date.now()
    registerFieldMount(id, `answer-${newId}`)
    setAnswers((prev) => [...prev, { id: newId, value: '' }])
  }

  const removeAnswer = (answerId: number) => {
    unregisterFieldMount(id, `answer-${answerId}`)
    setAnswers((prev) => prev.filter((a) => a.id !== answerId))
  }

  const updateQuestion = (raw: string) => setQuestion(raw)

  const updateAnswer = (answerId: number, raw: string) => {
    const cleaned = raw.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ')
    setAnswers((prev) =>
      prev.map((a) => (a.id === answerId ? { ...a, value: cleaned } : a)),
    )
  }

  useEffect(() => {
    const onMouseMove = (ev: MouseEvent) => {
      if (dragIndexRef.current === null) return
      const y = ev.clientY
      const currentIdx = dragIndexRef.current
      const len = answersRef.current.length
      for (let i = 0; i < len; i++) {
        const el = answerRefs.current[i]
        if (!el || i === currentIdx) continue
        const rect = el.getBoundingClientRect()
        const mid = rect.top + rect.height / 2
        if ((i < currentIdx && y < mid) || (i > currentIdx && y > mid)) {
          setAnswers((prev) => {
            const next = [...prev]
            const [item] = next.splice(currentIdx, 1)
            next.splice(i, 0, item)
            return next
          })
          dragIndexRef.current = i
          setDraggingIndex(i)
          break
        }
      }
    }

    const onMouseUp = () => {
      if (dragIndexRef.current === null) return
      dragIndexRef.current = null
      setDraggingIndex(null)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const handleGrabStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragIndexRef.current = index
    setDraggingIndex(index)
  }

  const handleImageClick = () => {
    const focused = answers.find((a) => a.id === focusedAnswerId) ?? answers[0]
    if (focused) setFocusedAnswerId(focused.id)
    setShowOverlay(true)
    setTimeout(() => fileInputRef.current?.click(), 100)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setShowOverlay(false)
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        const maxW = 200
        const scale = img.width > maxW ? maxW / img.width : 1
        const targetId = focusedAnswerId ?? answers[0]?.id
        if (targetId == null) return
        setAnswers((prev) =>
          prev.map((a) =>
            a.id === targetId
              ? { ...a, image: { src: reader.result as string, width: Math.round(img.width * scale), height: Math.round(img.height * scale), naturalWidth: img.width, naturalHeight: img.height, float: 'left', offsetX: 0, offsetY: 0 } }
              : a,
          ),
        )
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleImageDragStart = (answerId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const answer = answers.find((a) => a.id === answerId)
    if (!answer?.image) return
    setDraggingImage({ answerId, startX: e.clientX, startY: e.clientY, startOffX: answer.image.offsetX, startOffY: answer.image.offsetY })
  }

  useEffect(() => {
    if (!draggingImage) return
    const onMove = (e: MouseEvent) => {
      const { answerId, startX, startY, startOffX, startOffY } = draggingImage
      const answer = answersRef.current.find((a) => a.id === answerId)
      if (!answer?.image) return
      const idx = answersRef.current.indexOf(answer)
      const containerEl = answerRefs.current[idx]?.querySelector('[data-answer-content]') as HTMLElement | null
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      let newOffX = startOffX + dx
      let newOffY = startOffY + dy

      if (containerEl) {
        const containerW = containerEl.offsetWidth
        const containerH = containerEl.offsetHeight
        const imgW = answer.image.width
        const imgH = answer.image.height
        newOffX = Math.max(0, Math.min(newOffX, containerW - imgW - 16))
        newOffY = Math.max(0, Math.min(newOffY, Math.max(0, containerH - imgH)))
      } else {
        newOffX = Math.max(0, newOffX)
        newOffY = Math.max(0, newOffY)
      }

      setAnswers((prev) =>
        prev.map((a) =>
          a.id === answerId && a.image
            ? { ...a, image: { ...a.image, offsetX: newOffX, offsetY: newOffY, float: newOffX > 50 ? 'right' : 'left' } }
            : a,
        ),
      )
    }
    const onUp = () => setDraggingImage(null)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [draggingImage])

  const handleResizeStart = (answerId: number, corner: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const answer = answers.find((a) => a.id === answerId)
    if (!answer?.image) return
    setResizingImage({ answerId, startX: e.clientX, startY: e.clientY, startW: answer.image.width, startH: answer.image.height, corner })
  }

  useEffect(() => {
    if (!resizingImage) return
    const onMove = (e: MouseEvent) => {
      const { answerId, startX, startY, startW, startH } = resizingImage
      const answer = answers.find((a) => a.id === answerId)
      if (!answer?.image) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      let newW = Math.max(40, startW + dx)
      let newH = Math.max(40, startH + dy)
      if (e.shiftKey) {
        const ratio = answer.image.naturalWidth / answer.image.naturalHeight
        newH = Math.round(newW / ratio)
      }
      setAnswers((prev) =>
        prev.map((a) =>
          a.id === answerId && a.image ? { ...a, image: { ...a.image, width: newW, height: newH } } : a,
        ),
      )
    }
    const onUp = () => setResizingImage(null)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [resizingImage, answers])

  const toggleFormat = useCallback((fmt: FormatOption) => {
    if (fmt === 'image') {
      handleImageClick()
      return
    }
    if (fmt === 'bold' || fmt === 'italic' || fmt === 'underline') {
      toggleRichFormat(fmt)
      return
    }
    toggleToggleFormat(fmt)
  }, [toggleRichFormat, toggleToggleFormat])

  const toolbarDisabledKeys = useMemo(() => {
    const disabled = new Set<FormatOption>()
    if (focusedField !== 'answer') disabled.add('image')
    return disabled.size > 0 ? disabled : undefined
  }, [focusedField])

  const MAX_CHARS = 65
  const CARD_CHROME = 100
  const measureRef = useRef<HTMLSpanElement>(null)
  const [cardWidth, setCardWidth] = useState(NODE_DEFAULT_WIDTH)
  const [manualWidth, setManualWidth] = useState<number | null>(null)
  const nodeWidth = manualWidth ?? cardWidth
  const questionRef = useAutoResizeTextarea(question, SINGLE_LINE_FIELD_MIN_HEIGHT, nodeWidth)
  const resizing = useRef<{ startX: number; startW: number } | null>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizing.current) return
      const newW = Math.max(NODE_DEFAULT_WIDTH, resizing.current.startW + (e.clientX - resizing.current.startX))
      setManualWidth(newW)
    }
    const onUp = () => { resizing.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const handleDuplicate = useCallback(() => {
    const nodes = getNodes()
    const sourceNode = nodes.find((n) => n.id === id)
    if (!sourceNode) return
    const el = document.querySelector(`[data-id="${id}"]`) as HTMLElement | null
    const nodeW = el?.offsetWidth ?? 300
    const nodeH = el?.offsetHeight ?? 200
    const newId = `${sourceNode.type}_${Date.now()}`
    const newNode = {
      id: newId,
      type: sourceNode.type,
      position: {
        x: sourceNode.position.x + nodeW / 2,
        y: sourceNode.position.y + nodeH / 2,
      },
      data: { question, answers: answers.map((a) => a.value) },
      selected: true,
      zIndex: 1000,
    }
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })).concat(newNode))
  }, [id, getNodes, setNodes, question, answers])

  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
  }, [id, setNodes, setEdges])

  const longestLine = useMemo(() => {
    const allTexts = [
      question || PLACEHOLDERS.question,
      ...answers.map((a) => a.value || PLACEHOLDERS.answer),
    ]
    const allLines = allTexts.flatMap((t) => t.split('\n'))
    const longest = allLines.reduce((a, b) => (a.length > b.length ? a : b), '')
    return longest.length > MAX_CHARS ? longest.slice(0, MAX_CHARS) : longest
  }, [question, answers])

  useLayoutEffect(() => {
    if (!measureRef.current) return
    measureRef.current.textContent = longestLine
    setCardWidth(Math.max(measureRef.current.offsetWidth + CARD_CHROME, NODE_DEFAULT_WIDTH))
  }, [longestLine])

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const nodeIsEmpty =
      isFieldEmpty(question) &&
      answers.every((a) => isFieldEmpty(a.value) && !a.image)
    handleNodeCardClick(e, { nodeIsEmpty })
  }

  return (
    <div
      ref={cardRef}
      className={`bg-white border rounded-lg py-5 shadow-sm relative transition-[width,box-shadow,border-color] duration-150 overflow-visible ${nodeHasErrors ? '' : 'border-gray-200'}`}
      onClick={handleCardClick}
      style={{
        width: tooltipMode ? Math.max(manualWidth ?? cardWidth, 320) : (manualWidth ?? cardWidth),
        borderRadius: NODE_CARD_BORDER_RADIUS,
        ...(nodeHasErrors ? { borderColor: NODE_ERROR_COLOR } : {}),
      }}
    >
      {nodeHasErrors && <NodeRequiredBanner />}
      {toolbarVisible && (
        <FormattingToolbar
          toolbarRef={toolbarRef}
          style={toolbarStyle}
          onDragHandleMouseDown={handleToolbarDragStart}
          activeFormats={activeFormats}
          onToggle={toggleFormat}
          disabledKeys={toolbarDisabledKeys}
          sparkleId={`cta_${id}`}
        />
      )}
      <span
        ref={measureRef}
        className="invisible absolute whitespace-nowrap text-base font-semibold pointer-events-none"
        aria-hidden
      />

      <div className="relative flex flex-col flex-1 overflow-visible">
        <NodeSideTargetHandle />

      <NodeHeaderBar
        className="px-5 pt-5 -mt-5 mb-2"
        icon={<DiscoveryIcon />}
        title="Discovery Question"
        actions={
          <>
            <HeaderIconButton
              label="Preview"
              onClick={handlePreview}
              disabled={!canPreview}
            >
              <PreviewEyeIcon />
            </HeaderIconButton>
            <HeaderIconButton label="Duplicate" onClick={handleDuplicate}>
              <DuplicateIcon />
            </HeaderIconButton>
            <HeaderIconButton label="Delete" onClick={handleDelete} circular>
              <DeleteIcon />
            </HeaderIconButton>
          </>
        }
      />

      {showPreview && (
        <InteractionPreviewModal
          data={{ type: 'discovery', question, answers: answers.map((a) => a.value), tooltips: Object.fromEntries(answers.map((a, i) => [i, tooltips[a.id] ?? ''])), answerImages: Object.fromEntries(answers.map((a, i) => [i, a.image ? { src: a.image.src, float: a.image.float } : null]).filter(([, v]) => v !== null)) }}
          onClose={() => setShowPreview(false)}
        />
      )}

      {tooltipMode ? (
        <>
          {/* Tooltip title */}
          <div className="mb-5 px-1">
            <p className="text-base font-semibold italic text-gray-800">
              Create tooltips for your answers
            </p>
          </div>

          {/* Tooltip fields per answer */}
          <div className="flex flex-col gap-5">
            {answers.map((answer) => (
              <div key={answer.id}>
                {answer.value && (
                  <p className="text-xs text-gray-600 mb-1">
                    A: {answer.value.split('\n')[0]}
                  </p>
                )}
                <div className="flex items-start gap-3">
                  <NodeInputShell
                    focused={focusedTooltipId === answer.id}
                    className="flex-1 min-w-0"
                    padding={0}
                    hasContent={!!(draftTooltips[answer.id] ?? '').trim()}
                    onClear={() =>
                      setDraftTooltips((prev) => ({ ...prev, [answer.id]: '' }))
                    }
                  >
                    <input
                      type="text"
                      value={draftTooltips[answer.id] ?? ''}
                      onChange={(e) =>
                        setDraftTooltips((prev) => ({ ...prev, [answer.id]: e.target.value }))
                      }
                      placeholder={PLACEHOLDERS.tooltip}
                      className={`${TOOLTIP_INPUT_CLASS} px-4 py-2.5`}
                      data-cta-field
                      onFocus={() => setFocusedTooltipId(answer.id)}
                      onBlur={() => setFocusedTooltipId(null)}
                    />
                  </NodeInputShell>
                </div>
              </div>
            ))}
          </div>

          {/* Cancel / Apply */}
          <div className="flex items-center justify-between mt-5">
            <button
              className="text-sm font-bold text-gray-800 hover:text-gray-600 transition-colors"
              onClick={() => setTooltipMode(false)}
            >
              Cancel
            </button>
            <button
              className={`text-sm font-semibold transition-colors ${
                Object.values(draftTooltips).some((v) => v.trim())
                  ? 'text-brand-500 hover:text-brand-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              disabled={!Object.values(draftTooltips).some((v) => v.trim())}
              onClick={() => {
                setTooltips({ ...draftTooltips })
                setTooltipMode(false)
              }}
            >
              Apply
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Question */}
          <NodeInputSection className="mb-6" style={{ marginTop: 6 }}>
            <RequiredFieldGroup showMessage={questionInvalid}>
              <NodeInputShell
                focused={focusedField === 'question'}
                onBlur={handleFieldBlur}
                padding={0}
                invalid={questionInvalid}
                hasContent={!!question.trim()}
                onClear={() => updateQuestion('')}
                label="Question"
                nodeActive={nodeActive}
                primaryField
              >
                <textarea
                  ref={questionRef}
                  value={question}
                  onChange={(e) => updateQuestion(e.target.value)}
                  placeholder={PLACEHOLDERS.question}
                  rows={1}
                  className={`${QUESTION_INPUT_CLASS} ${NODE_INPUT_INNER_CLASS} resize-none overflow-hidden`}
                  style={PRIMARY_SINGLE_LINE_FIELD_STYLE}
                  data-cta-field
                  onFocus={() => {
                    hideToolbar()
                    setFocusedField('question')
                  }}
                  onBlur={handleFieldBlur}
                />
              </NodeInputShell>
            </RequiredFieldGroup>
          </NodeInputSection>

          {/* Answer fields */}
          <NodeInputSection className="flex flex-col gap-5">
            {answers.map((answer, index) => {
              const answerInvalid =
                showValidation &&
                isFieldEmpty(answer.value) &&
                shouldShowFieldValidation(id, `answer-${answer.id}`)
              const isRowFocused = focusedAnswerId === answer.id
              const showReorderHighlight =
                answers.length >= 2 &&
                (draggingIndex === index ||
                  (!isRowFocused && gripHoveredId === answer.id))
              return (
              <div
                key={answer.id}
                ref={(el) => {
                  answerRefs.current[index] = el
                  answerRefs.current.length = answers.length
                }}
                className={`nodrag relative overflow-visible ${
                  draggingIndex !== null && draggingIndex !== index ? 'opacity-50' : ''
                }`}
                style={{
                  paddingTop: answers.length >= 2 ? ANSWER_ROW_GRIP_HEIGHT : 0,
                  ...answerRowReorderStyles(showReorderHighlight, draggingIndex === index),
                }}
              >
                {answers.length >= 2 && (
                  <div
                    className="absolute left-0 right-0 flex items-center justify-center nodrag nopan"
                    style={{ top: 0, height: ANSWER_ROW_GRIP_HEIGHT }}
                    onMouseEnter={() => setGripHoveredId(answer.id)}
                    onMouseLeave={() => setGripHoveredId(null)}
                  >
                  <div
                    data-drag-grip
                    className="cursor-grab select-none rotate-90 opacity-50 hover:opacity-100 transition-opacity p-1"
                    onMouseDown={(e) => handleGrabStart(index, e)}
                  >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.5 16.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.163-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.326.326.49.718.49 1.177s-.164.851-.49 1.177c-.326.327-.718.49-1.177.49Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.164-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.327.326.49.718.49 1.177s-.163.851-.49 1.177c-.326.327-.718.49-1.177.49ZM7.5 11.666c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.163-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.326.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.164-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.326.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489ZM7.5 6.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.163-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.327.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.164-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.327.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489Z" fill="#8D8A87"/>
                      </svg>
                    </div>
                  </div>
                )}

                <RequiredFieldGroup
                  showMessage={answerInvalid}
                  handleId={`answer-${answer.id}`}
                  handleTop={answers.length >= 2 ? ANSWER_INLINE_HANDLE_TOP_WITH_GRIP : ANSWER_INLINE_HANDLE_TOP}
                  className="w-full"
                >
                <NodeInputShell
                  focused={focusedAnswerId === answer.id}
                  className="w-full"
                  padding={0}
                  onBlur={handleFieldBlur}
                  invalid={answerInvalid}
                  suppressHover={draggingIndex !== null && draggingIndex !== index}
                  showClearWhenEmpty={answers.length >= 2}
                  hasContent={!!answer.value.trim()}
                  label="Answer & Description"
                  nodeActive={nodeActive}
                  onClear={() => {
                    clearOrRemoveField(
                      answer.value,
                      () => {
                        updateAnswer(answer.id, '')
                        const row = answerRefs.current[index]
                        const el = row?.querySelector('[contenteditable]') as HTMLDivElement | null
                        if (el) el.textContent = ''
                      },
                      answers.length >= 2 ? () => removeAnswer(answer.id) : undefined,
                    )
                  }}
                >
                <div className={NODE_INPUT_INNER_CLASS} data-answer-content>
                  {answer.image && (
                    <div
                      className="relative inline-block nodrag group/img"
                      style={{
                        float: answer.image.float,
                        width: answer.image.width,
                        height: answer.image.height,
                        margin: 0,
                        marginTop: answer.image.offsetY,
                        marginBottom: 12,
                        ...(answer.image.float === 'left' ? { marginRight: 12 } : { marginLeft: 12 }),
                      }}
                    >
                      <img
                        src={answer.image.src}
                        alt=""
                        className="w-full h-full object-cover rounded cursor-move"
                        draggable={false}
                        onMouseDown={(e) => handleImageDragStart(answer.id, e)}
                      />
                      {/* Resize handles */}
                      {/* Top-left */}
                      <div
                        onMouseDown={(e) => handleResizeStart(answer.id, 'nw', e)}
                        className="absolute"
                        style={{ cursor: 'nwse-resize', top: 0, left: 0 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect y="6" width="6" height="13.008" rx="2" transform="rotate(-90 0 6)" fill="#FC6839"/><rect width="6" height="13.008" rx="2" fill="#FC6839"/></svg>
                      </div>
                      {/* Top-right */}
                      <div
                        onMouseDown={(e) => handleResizeStart(answer.id, 'ne', e)}
                        className="absolute"
                        style={{ cursor: 'nesw-resize', top: 0, right: 0 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="7.008" width="6" height="13.008" rx="2" fill="#FC6839"/><rect x="13.008" width="6" height="13.008" rx="2" transform="rotate(90 13.008 0)" fill="#FC6839"/></svg>
                      </div>
                      {/* Bottom-left */}
                      <div
                        onMouseDown={(e) => handleResizeStart(answer.id, 'sw', e)}
                        className="absolute"
                        style={{ cursor: 'nesw-resize', bottom: 0, left: 0 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="6" y="13.008" width="6" height="13.008" rx="2" transform="rotate(180 6 13.008)" fill="#FC6839"/><rect y="13.008" width="6" height="13.008" rx="2" transform="rotate(-90 0 13.008)" fill="#FC6839"/></svg>
                      </div>
                      {/* Bottom-right */}
                      <div
                        onMouseDown={(e) => handleResizeStart(answer.id, 'se', e)}
                        className="absolute"
                        style={{ cursor: 'nwse-resize', bottom: 0, right: 0 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="13.008" y="7.008" width="6" height="13.008" rx="2" transform="rotate(90 13.008 7.008)" fill="#FC6839"/><rect x="13.008" y="13.008" width="6" height="13.008" rx="2" transform="rotate(180 13.008 13.008)" fill="#FC6839"/></svg>
                      </div>
                      {/* Hover quick actions */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-black/30 absolute inset-0 rounded pointer-events-none" />
                        <div className="relative z-10 flex items-center bg-white rounded-full border border-[#D6D1CB] px-2 py-2 gap-1 shadow-lg pointer-events-auto">
                          {/* Replace image button */}
                          <div className="relative group/replace">
                            <button
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#73716F26] transition-colors cursor-pointer"
                              onClick={() => {
                                setFocusedAnswerId(answer.id)
                                setShowOverlay(true)
                                setTimeout(() => fileInputRef.current?.click(), 100)
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <mask id={`mask_replace_${answer.id}`} style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                                  <rect width="20" height="20" fill="#D9D9D9"/>
                                </mask>
                                <g mask={`url(#mask_replace_${answer.id})`}>
                                  <path d="M10.0417 16.6667C8.18056 16.6667 6.59722 16.0209 5.29167 14.7292C3.98611 13.4375 3.33333 11.8612 3.33333 10V9.85421L2.58333 10.6042C2.43056 10.757 2.23611 10.8334 2 10.8334C1.76389 10.8334 1.56944 10.757 1.41667 10.6042C1.26389 10.4514 1.1875 10.257 1.1875 10.0209C1.1875 9.78476 1.26389 9.59032 1.41667 9.43754L3.58333 7.27087C3.66667 7.18754 3.75694 7.12837 3.85417 7.09337C3.95139 7.05893 4.05556 7.04171 4.16667 7.04171C4.27778 7.04171 4.38194 7.05893 4.47917 7.09337C4.57639 7.12837 4.66667 7.18754 4.75 7.27087L6.91667 9.43754C7.06944 9.59032 7.14583 9.78476 7.14583 10.0209C7.14583 10.257 7.06944 10.4514 6.91667 10.6042C6.76389 10.757 6.56944 10.8334 6.33333 10.8334C6.09722 10.8334 5.90278 10.757 5.75 10.6042L5 9.85421V10C5 11.3889 5.48972 12.5695 6.46917 13.5417C7.44806 14.5139 8.63889 15 10.0417 15C10.3194 15 10.5903 14.9759 10.8542 14.9275C11.1181 14.8787 11.3819 14.8056 11.6458 14.7084C11.7847 14.6528 11.9342 14.6389 12.0942 14.6667C12.2536 14.6945 12.3889 14.7639 12.5 14.875C12.75 15.125 12.8508 15.3923 12.8025 15.6767C12.7536 15.9617 12.5694 16.1598 12.25 16.2709C11.8889 16.3959 11.5244 16.4931 11.1567 16.5625C10.7883 16.632 10.4167 16.6667 10.0417 16.6667ZM15.8333 12.9584C15.7222 12.9584 15.6181 12.9409 15.5208 12.9059C15.4236 12.8714 15.3333 12.8125 15.25 12.7292L13.0833 10.5625C12.9306 10.4098 12.8542 10.2153 12.8542 9.97921C12.8542 9.7431 12.9306 9.54865 13.0833 9.39587C13.2361 9.2431 13.4306 9.16671 13.6667 9.16671C13.9028 9.16671 14.0972 9.2431 14.25 9.39587L15 10.1459V10C15 8.61115 14.5106 7.4306 13.5317 6.45837C12.5522 5.48615 11.3611 5.00004 9.95833 5.00004C9.68056 5.00004 9.40972 5.02448 9.14583 5.07337C8.88194 5.12171 8.61806 5.19449 8.35417 5.29171C8.21528 5.34726 8.06611 5.36115 7.90667 5.33337C7.74667 5.3056 7.61111 5.23615 7.5 5.12504C7.25 4.87504 7.14917 4.60754 7.1975 4.32254C7.24639 4.0381 7.43056 3.84032 7.75 3.72921C8.11111 3.60421 8.47583 3.50699 8.84417 3.43754C9.21194 3.3681 9.58333 3.33337 9.95833 3.33337C11.8194 3.33337 13.4028 3.97921 14.7083 5.27087C16.0139 6.56254 16.6667 8.13893 16.6667 10V10.1459L17.4167 9.39587C17.5694 9.2431 17.7639 9.16671 18 9.16671C18.2361 9.16671 18.4306 9.2431 18.5833 9.39587C18.7361 9.54865 18.8125 9.7431 18.8125 9.97921C18.8125 10.2153 18.7361 10.4098 18.5833 10.5625L16.4167 12.7292C16.3333 12.8125 16.2431 12.8714 16.1458 12.9059C16.0486 12.9409 15.9444 12.9584 15.8333 12.9584Z" fill="#172537"/>
                                </g>
                              </svg>
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-gray-800 text-white text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover/replace:opacity-100 transition-opacity">
                              Replace
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                            </div>
                          </div>
                          {/* Delete image button */}
                          <div className="relative group/remove">
                            <button
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#73716F26] transition-colors cursor-pointer"
                              onClick={() => setAnswers((prev) => prev.map((a) => a.id === answer.id ? { ...a, image: undefined } : a))}
                            >
                              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 10.05L5.325 13.725a.706.706 0 0 1-.525.206.706.706 0 0 1-.525-.206.706.706 0 0 1-.206-.525c0-.213.069-.388.206-.525L7.95 9 4.275 5.325a.706.706 0 0 1-.206-.525c0-.213.069-.388.206-.525a.706.706 0 0 1 .525-.206c.213 0 .388.069.525.206L9 7.95l3.675-3.675a.706.706 0 0 1 .525-.206c.213 0 .388.069.525.206a.706.706 0 0 1 .206.525.706.706 0 0 1-.206.525L10.05 9l3.675 3.675a.706.706 0 0 1 .206.525.706.706 0 0 1-.206.525.706.706 0 0 1-.525.206.706.706 0 0 1-.525-.206L9 10.05Z" fill="#293748"/>
                              </svg>
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-gray-800 text-white text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover/remove:opacity-100 transition-opacity">
                              Remove
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    data-cta-field
                    data-placeholder={PLACEHOLDERS.answer}
                    className={`${ANSWER_FIELD_CLASS} outline-none min-h-[1.5em] [&_*]:leading-[inherit] ${!answer.value ? ANSWER_RICH_TEXT_PLACEHOLDER_CLASS : ''}`}
                    style={{ wordBreak: 'break-word', lineHeight: 1.5 }}
                    ref={(el) => {
                      if (el && !el.dataset.initialized) {
                        el.textContent = answer.value
                        el.dataset.initialized = 'true'
                      }
                    }}
                    onInput={(e) => {
                      const el = e.target as HTMLDivElement
                      const text = el.textContent || ''
                      updateAnswer(answer.id, text)
                    }}
                    onFocus={(e) => {
                      setGripHoveredId(null)
                      anchorToolbarToField(e.target)
                      handleFieldFocus()
                      setFocusedField('answer')
                      setFocusedAnswerId(answer.id)
                    }}
                    onBlur={(e) => {
                      handleFieldBlur(e as unknown as React.FocusEvent)
                      setFocusedAnswerId(null)
                    }}
                  />
                  {answer.image && <div style={{ clear: 'both' }} />}
                </div>
                </NodeInputShell>
                </RequiredFieldGroup>

                <div className="absolute flex items-center nodrag nopan" style={{ top: 10, right: 0, gap: 10 }}>
                  {tooltips[answer.id]?.trim() && (
                    <div className="relative group/tip">
                      <CircleHelp size={14} className="text-gray-800 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 text-white text-xs opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity shadow-lg" style={{ width: 'max-content', maxWidth: 320 }}>
                        {tooltips[answer.id]}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                      </div>
                    </div>
                  )}
                  {answers.length >= 2 && (
                    <button
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() => removeAnswer(answer.id)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              )
            })}
          </NodeInputSection>

          {/* Add answer */}
          <NodeInputSection>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={addAnswer}
              className="group/add nodrag nopan inline-flex items-center gap-2 h-8 px-4 rounded-2xl transition-colors hover:bg-[#FC6839]/15"
            >
              <span className="text-sm font-semibold text-[#FC6839] group-hover/add:text-[#F44C10]">
                Add Answer
              </span>
              <Plus size={16} strokeWidth={2} className="shrink-0 text-[#FC6839] group-hover/add:text-[#F44C10]" aria-hidden />
            </button>
          </div>
          </NodeInputSection>


        </>
      )}

      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <NodeResizeHandle
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          resizing.current = { startX: e.clientX, startW: manualWidth ?? cardWidth }
        }}
      />

      {/* Darkened overlay when file picker is open */}
      {showOverlay && createPortal(
        <div
          className="fixed inset-0 bg-black/50"
          style={{ zIndex: 9999 }}
          onClick={() => setShowOverlay(false)}
        />,
        document.body,
      )}
    </div>
  )
}
