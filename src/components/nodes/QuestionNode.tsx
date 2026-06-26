'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Handle, Position, type NodeProps, useReactFlow, useUpdateNodeInternals } from '@xyflow/react'
import {
  HeaderIconButton,
  DuplicateIcon,
  PreviewEyeIcon,
  DeleteIcon,
  NodeHeaderBar,
} from './NodeHeaderActions'
import { X } from 'lucide-react'
import InteractionPreviewModal from '../InteractionPreviewModal'
import FormattingToolbar, { type FormatOption } from './FormattingToolbar'
import NodeInputShell from './NodeInputShell'
import {
  INPUT_MIN_HEIGHT,
  PLACEHOLDERS,
  QUESTION_INPUT_CLASS,
  ANSWER_FIELD_CLASS,
  ANSWER_INPUT_CLASS,
  DESCRIPTION_FIELD_CLASS,
  DESCRIPTION_PLACEHOLDER_CLASS,
  DESCRIPTION_INPUT_CLASS,
  NODE_HANDLE_CLASS,
  NODE_HANDLE_SIDE_STYLE,
  NODE_HANDLE_INLINE_CLASS,
  NODE_HANDLE_INLINE_STYLE,
  NODE_HANDLE_INLINE_OFFSET,
  NODE_HANDLE_SIZE,
  NODE_DEFAULT_WIDTH,
  ANSWER_ROW_GRIP_HEIGHT,
  ANSWER_ROW_DRAG_BORDER,
} from './nodeFieldStyles'
import { useFormattingToolbar } from './useFormattingToolbar'
import type { QuestionNodeData, QuestionOption } from '@/types/questionNode'
import { DEFAULT_QUESTION_DATA } from '@/types/questionNode'

const CARD_MIN_HEIGHT = 307

function DragGripIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M7.5 16.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.163-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.326.326.49.718.49 1.177s-.164.851-.49 1.177c-.326.327-.718.49-1.177.49Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.164-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.327.326.49.718.49 1.177s-.163.851-.49 1.177c-.326.327-.718.49-1.177.49ZM7.5 11.666c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.163-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.326.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.164-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.326.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489ZM7.5 6.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.163-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.327.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.164-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.327.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489Z"
        fill="#8D8A87"
      />
    </svg>
  )
}

function DiscoveryIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.966 12c.234 0 .431-.081.592-.242.161-.161.242-.358.242-.591 0-.234-.08-.431-.242-.592a.806.806 0 0 0-.592-.242.806.806 0 0 0-.592.242.806.806 0 0 0-.242.592c0 .233.08.43.241.591.162.161.359.242.593.242Zm.1-6.867c.31 0 .56.086.75.258.188.173.283.398.283.675 0 .19-.064.381-.191.575a3.64 3.64 0 0 1-.542.609c-.334.289-.578.567-.734.833-.155.267-.233.534-.233.8 0 .156.058.287.175.392a.498.498 0 0 0 .408.159.498.498 0 0 0 .417-.167.76.76 0 0 0 .233-.417c.034-.189.109-.364.226-.525.116-.161.308-.37.575-.625.344-.323.586-.617.725-.884.139-.266.208-.561.208-.883 0-.567-.213-1.031-.641-1.392-.428-.361-.981-.541-1.659-.541-.466 0-.88.089-1.241.266-.362.178-.642.45-.842.817a.583.583 0 0 0-.084.425c.023.138.1.253.234.341a.523.523 0 0 0 .475.084.556.556 0 0 0 .425-.284 1.04 1.04 0 0 1 .442-.383c.172-.089.369-.134.591-.134ZM8 14.666a6.65 6.65 0 0 1-2.584-.525 6.698 6.698 0 0 1-2.125-1.425 6.677 6.677 0 0 1-1.433-2.116A6.521 6.521 0 0 1 1.333 8c0-.922.175-1.789.525-2.6a6.682 6.682 0 0 1 1.434-2.117A6.692 6.692 0 0 1 5.416 1.858 6.649 6.649 0 0 1 8 1.333c.933 0 1.805.175 2.616.525a6.71 6.71 0 0 1 2.117 1.425A6.711 6.711 0 0 1 14.15 5.4c.344.811.516 1.678.516 2.6 0 .922-.172 1.789-.517 2.6a6.711 6.711 0 0 1-1.416 2.116 6.692 6.692 0 0 1-2.117 1.425 6.598 6.598 0 0 1-2.617.525ZM8 13.333c1.489 0 2.75-.52 3.783-1.558C12.816 10.736 13.333 9.478 13.333 8c0-1.478-.517-2.736-1.55-3.776C10.75 3.186 9.489 2.666 8 2.666c-1.456 0-2.709.52-3.759 1.558C3.191 5.264 2.666 6.522 2.666 8c0 1.478.525 2.736 1.575 3.775 1.05 1.039 2.303 1.558 3.759 1.558Z"
        fill="#61B08B"
      />
    </svg>
  )
}

const QUESTION_PLACEHOLDER = PLACEHOLDERS.question
const ANSWER_PLACEHOLDER = PLACEHOLDERS.answer
const DESCRIPTION_PLACEHOLDER = PLACEHOLDERS.description

function QuestionField({
  value,
  onChange,
  focused,
  onFocus,
  onBlur,
}: {
  value: string
  onChange: (value: string) => void
  focused: boolean
  onFocus: () => void
  onBlur: (e: React.FocusEvent) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(INPUT_MIN_HEIGHT - 2, el.scrollHeight)}px`
  }, [value])

  return (
    <NodeInputShell focused={focused} onBlur={onBlur} minHeight={INPUT_MIN_HEIGHT} padding={0}>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={QUESTION_PLACEHOLDER}
        rows={1}
        className={`${QUESTION_INPUT_CLASS} resize-none overflow-hidden`}
        data-cta-field
        style={{
          lineHeight: 1.5,
          padding: '10px 16px',
          minHeight: INPUT_MIN_HEIGHT - 2,
        }}
      />
    </NodeInputShell>
  )
}

function AnswerInputShell({
  focused,
  onClick,
  onBlur,
  onHoverChange,
  children,
  className = '',
}: {
  focused: boolean
  onClick?: () => void
  onBlur?: (e: React.FocusEvent) => void
  onHoverChange?: (hovered: boolean) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <NodeInputShell
      focused={focused}
      onClick={onClick}
      onBlur={onBlur}
      onHoverChange={onHoverChange}
      className={className}
      padding={0}
    >
      {children}
    </NodeInputShell>
  )
}

export default function QuestionNode({ id, data, selected }: NodeProps) {
  const { setNodes, setEdges, getNodes } = useReactFlow()
  const updateNodeInternals = useUpdateNodeInternals()
  const nodeData = data as QuestionNodeData

  const [question, setQuestion] = useState(nodeData.question ?? DEFAULT_QUESTION_DATA.question)
  const [options, setOptions] = useState<QuestionOption[]>(() => nodeData.options ?? [])
  const [editingQuestion, setEditingQuestion] = useState(false)
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [focusedField, setFocusedField] = useState<'question' | 'answer' | 'description' | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [gripHoveredId, setGripHoveredId] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageTargetOptionIdRef = useRef<number | null>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])
  const optionsRef = useRef(options)
  optionsRef.current = options
  const dragIndexRef = useRef<number | null>(null)

  const {
    showToolbar,
    activeFormats,
    handleFieldFocus,
    handleFieldBlur,
    toggleRichFormat,
    toggleToggleFormat,
  } = useFormattingToolbar({
    nodeId: id,
    onBlurClear: () => setFocusedField(null),
  })

  const optionOrderKey = options.map((o) => o.id).join(',')
  const showGhostAnswers = options.length === 0
  const hasContent = question.trim().length > 0 || options.some((o) => o.value.trim())
  const validOptions = options.filter((o) => o.value.trim())

  useEffect(() => {
    updateNodeInternals(id)
  }, [id, optionOrderKey, updateNodeInternals])

  const toggleFormat = useCallback((fmt: FormatOption) => {
    if (fmt === 'image') {
      if (focusedField !== 'description' || imageTargetOptionIdRef.current == null) return
      setTimeout(() => fileInputRef.current?.click(), 100)
      return
    }
    if (fmt === 'bold' || fmt === 'italic' || fmt === 'underline') {
      toggleRichFormat(fmt)
      return
    }
    toggleToggleFormat(fmt)
  }, [focusedField, toggleRichFormat, toggleToggleFormat])

  const syncData = useCallback(
    (patch: Partial<QuestionNodeData>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
      )
    },
    [id, setNodes],
  )

  useEffect(() => {
    const onMouseMove = (ev: MouseEvent) => {
      if (dragIndexRef.current === null) return
      const y = ev.clientY
      const currentIdx = dragIndexRef.current
      const len = optionsRef.current.length
      for (let i = 0; i < len; i++) {
        const el = optionRefs.current[i]
        if (!el || i === currentIdx) continue
        const rect = el.getBoundingClientRect()
        const mid = rect.top + rect.height / 2
        if ((i < currentIdx && y < mid) || (i > currentIdx && y > mid)) {
          setOptions((prev) => {
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
      setOptions((prev) => {
        syncData({ options: prev })
        return prev
      })
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [syncData])

  const handleGrabStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragIndexRef.current = index
    setDraggingIndex(index)
  }

  const canReorder = options.length >= 2

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !file.type.startsWith('image/')) return
      const optionId = imageTargetOptionIdRef.current
      if (optionId == null) return
      const reader = new FileReader()
      reader.onload = () => {
        const img = new window.Image()
        img.onload = () => {
          const maxW = 120
          const scale = img.width > maxW ? maxW / img.width : 1
          const descriptionImage = {
            src: reader.result as string,
            width: Math.round(img.width * scale),
            height: Math.round(img.height * scale),
          }
          setOptions((prev) => {
            const next = prev.map((opt) =>
              opt.id === optionId ? { ...opt, descriptionImage } : opt,
            )
            syncData({ options: next })
            return next
          })
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    },
    [syncData],
  )

  const handleQuestionChange = (value: string) => {
    setQuestion(value)
    syncData({ question: value })
  }

  const handleAddAnswer = () => {
    const newOption = { id: Date.now(), value: '' }
    const next = [...options, newOption]
    setOptions(next)
    syncData({ options: next })
    setEditingOptionId(newOption.id)
  }

  const handleOptionChange = (optionId: number, value: string) => {
    const next = options.map((opt) => (opt.id === optionId ? { ...opt, value } : opt))
    setOptions(next)
    syncData({ options: next })
  }

  const handleDescriptionChange = (optionId: number, description: string) => {
    const next = options.map((opt) => (opt.id === optionId ? { ...opt, description } : opt))
    setOptions(next)
    syncData({ options: next })
  }

  const handleDeleteOption = (optionId: number) => {
    const next = options.filter((opt) => opt.id !== optionId)
    setOptions(next)
    syncData({ options: next })
    setEdges((eds) =>
      eds.filter((e) => !(e.source === id && e.sourceHandle === `option-${optionId}`)),
    )
    if (editingOptionId === optionId) setEditingOptionId(null)
  }

  const handleDuplicate = () => {
    const source = getNodes().find((n) => n.id === id)
    if (!source) return
    setNodes((nds) =>
      nds
        .map((n) => ({ ...n, selected: false }))
        .concat({
          ...source,
          id: `questionNode_${Date.now()}`,
          position: { x: source.position.x + 40, y: source.position.y + 40 },
          selected: true,
          data: { ...source.data },
        }),
    )
  }

  const handleDelete = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
  }

  return (
    <div
      className="bg-white rounded-lg relative flex flex-col"
      style={{
        width: NODE_DEFAULT_WIDTH,
        minHeight: CARD_MIN_HEIGHT,
        boxShadow: '0 20px 20px rgba(48, 41, 33, 0.12)',
        border: selected ? '1px solid #FC6839' : '1px solid #E5E7EB',
        borderRadius: 8,
      }}
    >
      {showToolbar && (
        <FormattingToolbar
          activeFormats={activeFormats}
          onToggle={toggleFormat}
          disabledKeys={focusedField === 'description' ? undefined : new Set<FormatOption>(['image'])}
          sparkleId={`question_${id}`}
        />
      )}

      <Handle
        type="target"
        position={Position.Left}
        className={NODE_HANDLE_CLASS}
        style={NODE_HANDLE_SIDE_STYLE}
      />

      <NodeHeaderBar
        className="px-5 pt-5"
        icon={<DiscoveryIcon />}
        title="Discovery Question"
        actions={
          <>
            <HeaderIconButton
              label="Preview"
              onClick={() => hasContent && setShowPreview(true)}
              disabled={!hasContent}
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

      {/* Body */}
      <div className="px-5 pt-3 pb-[33px] flex-1 flex flex-col nodrag nopan">
        <QuestionField
          value={question}
          onChange={handleQuestionChange}
          focused={editingQuestion}
          onFocus={() => {
            handleFieldFocus()
            setFocusedField('question')
            setEditingQuestion(true)
            setEditingOptionId(null)
          }}
          onBlur={(e) => {
            setEditingQuestion(false)
            handleFieldBlur(e)
          }}
        />

        {/* Ghost placeholders — hover shows dashed indicator on all inputs */}
        {showGhostAnswers && (
          <div className="mt-4 relative">
            <AnswerInputShell focused={false} onClick={handleAddAnswer}>
              <div className="px-4 py-2.5">
                <p className={`leading-relaxed ${ANSWER_FIELD_CLASS}`}>{ANSWER_PLACEHOLDER}</p>
                <p className={`mt-1 leading-relaxed ${DESCRIPTION_PLACEHOLDER_CLASS}`}>
                  {DESCRIPTION_PLACEHOLDER}
                </p>
              </div>
            </AnswerInputShell>
            <div
              className="absolute rounded-full bg-[#FC6839] border-2 border-white pointer-events-none"
              style={{ width: NODE_HANDLE_SIZE, height: NODE_HANDLE_SIZE, top: '50%', right: NODE_HANDLE_INLINE_OFFSET, transform: 'translateY(-50%)' }}
            />
          </div>
        )}

        {/* Real answer rows */}
        {options.length > 0 && (
          <div className="mt-4 space-y-2">
            {options.map((option, index) => {
              const isEditing = editingOptionId === option.id
              const showDragBorder =
                canReorder &&
                !isEditing &&
                (gripHoveredId === option.id || draggingIndex === index)
              const answerContentPadding = canReorder ? 'px-4 pt-1 pb-4' : 'px-4 py-2.5 pb-3.5'

              return (
                <div
                  key={option.id}
                  ref={(el) => {
                    optionRefs.current[index] = el
                    optionRefs.current.length = options.length
                  }}
                  className={`relative rounded-lg transition-all ${
                    draggingIndex !== null && draggingIndex !== index ? 'opacity-50' : ''
                  }`}
                  style={{
                    paddingTop: canReorder ? ANSWER_ROW_GRIP_HEIGHT : 0,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: showDragBorder ? ANSWER_ROW_DRAG_BORDER : 'transparent',
                  }}
                >
                  {canReorder && (
                    <div
                      className="absolute left-0 right-0 flex items-center justify-center"
                      style={{ top: 0, height: ANSWER_ROW_GRIP_HEIGHT }}
                      onMouseEnter={() => setGripHoveredId(option.id)}
                      onMouseLeave={() => setGripHoveredId(null)}
                    >
                      <div
                        className="cursor-grab active:cursor-grabbing select-none rotate-90 opacity-50 hover:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleGrabStart(index, e)}
                        aria-label="Drag to reorder"
                      >
                        <DragGripIcon />
                      </div>
                    </div>
                  )}

                  {isEditing ? (
                    <AnswerInputShell focused className="my-0">
                      <div
                        className={answerContentPadding}
                        onBlur={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            setEditingOptionId(null)
                          }
                          handleFieldBlur(e)
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            autoFocus
                            type="text"
                            value={option.value}
                            onChange={(e) => handleOptionChange(option.id, e.target.value)}
                            onFocus={() => {
                              handleFieldFocus()
                              setFocusedField('answer')
                              imageTargetOptionIdRef.current = option.id
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingOptionId(null)
                              if (e.key === 'Escape') setEditingOptionId(null)
                            }}
                            placeholder={ANSWER_PLACEHOLDER}
                            className={ANSWER_INPUT_CLASS}
                            data-cta-field
                            style={{ minHeight: INPUT_MIN_HEIGHT - 22 }}
                          />
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleDeleteOption(option.id)}
                            className="p-0.5 rounded text-gray-400 hover:text-red-500 shrink-0"
                            aria-label="Delete answer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={option.description ?? ''}
                          onChange={(e) => handleDescriptionChange(option.id, e.target.value)}
                          onFocus={() => {
                            handleFieldFocus()
                            setFocusedField('description')
                            imageTargetOptionIdRef.current = option.id
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingOptionId(null)
                            if (e.key === 'Escape') setEditingOptionId(null)
                          }}
                          placeholder={DESCRIPTION_PLACEHOLDER}
                          className={`${DESCRIPTION_INPUT_CLASS} mt-1`}
                          data-cta-field
                        />
                        {option.descriptionImage && (
                          <img
                            src={option.descriptionImage.src}
                            alt=""
                            className="mt-2 rounded object-contain"
                            style={{
                              width: option.descriptionImage.width,
                              height: option.descriptionImage.height,
                            }}
                          />
                        )}
                      </div>
                    </AnswerInputShell>
                  ) : (
                    <AnswerInputShell
                      focused={false}
                      onClick={() => {
                        setEditingOptionId(option.id)
                        setEditingQuestion(false)
                        handleFieldFocus()
                      }}
                    >
                      <div className={answerContentPadding}>
                        <span className={`block ${ANSWER_FIELD_CLASS}`}>
                          {option.value.trim() || ANSWER_PLACEHOLDER}
                        </span>
                        <p
                          className={`mt-1 ${option.description?.trim() ? DESCRIPTION_FIELD_CLASS : DESCRIPTION_PLACEHOLDER_CLASS}`}
                        >
                          {option.description?.trim() || DESCRIPTION_PLACEHOLDER}
                        </p>
                        {option.descriptionImage && (
                          <img
                            src={option.descriptionImage.src}
                            alt=""
                            className="mt-2 rounded object-contain"
                            style={{
                              width: option.descriptionImage.width,
                              height: option.descriptionImage.height,
                            }}
                          />
                        )}
                      </div>
                    </AnswerInputShell>
                  )}

                  <div
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ right: NODE_HANDLE_INLINE_OFFSET }}
                  >
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={`option-${option.id}`}
                      className={NODE_HANDLE_INLINE_CLASS}
                      style={NODE_HANDLE_INLINE_STYLE}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* + Add answer — always visible per Frame 3756 */}
        <button
          type="button"
          onClick={handleAddAnswer}
          className="flex items-center gap-1.5 mt-auto pt-4 text-sm font-semibold transition-opacity hover:opacity-80 nodrag nopan self-start"
          style={{ color: '#FC6839' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8 3.333V12.667M3.333 8H12.667"
              stroke="#FC6839"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Add answer
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {showPreview && (
        <InteractionPreviewModal
          data={{
            type: 'discovery',
            question,
            answers: validOptions.map((o) => o.value),
            tooltips: Object.fromEntries(
              validOptions
                .map((o, i) => [i, o.description?.trim() ?? ''] as const)
                .filter(([, tip]) => tip.length > 0),
            ),
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
