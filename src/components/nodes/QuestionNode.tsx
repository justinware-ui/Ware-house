'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trash2 } from 'lucide-react'
import { type NodeProps, useReactFlow, useUpdateNodeInternals } from '@xyflow/react'
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
import { NodeInputFieldRow } from './NodeInputFieldRow'
import {
  INPUT_MIN_HEIGHT,
  PRIMARY_SINGLE_LINE_FIELD_STYLE,
  SINGLE_LINE_FIELD_MIN_HEIGHT,
  PLACEHOLDERS,
  QUESTION_INPUT_CLASS,
  ANSWER_FIELD_CLASS,
  ANSWER_INPUT_CLASS,
  DESCRIPTION_FIELD_CLASS,
  DESCRIPTION_PLACEHOLDER_CLASS,
  DESCRIPTION_RICH_TEXT_PLACEHOLDER_CLASS,
  NODE_INPUT_INNER_CLASS,
  DRAG_ROW_INSET,
  GRIP_LANE_WIDTH,
  FIELD_REMOVE_LANE_PADDING,
  NODE_HEADER_BAR_CLASS,
  NODE_CARD_MIN_HEIGHT,
  NODE_CARD_BORDER_RADIUS,
  NODE_CARD_SHADOW,
  NODE_CARD_BORDER_DEFAULT,
  NODE_CARD_BORDER_SELECTED,
  nodeContentPaddingLeft,
  nodeContentPaddingRight,
  answerHandleRightOffset,
  answerRowReorderStyles,
} from './nodeFieldStyles'
import NodeInputSection from './NodeInputSection'
import { NodeGhostConnectorDot, NodeInlineSourceHandle, NodeSideTargetHandle } from './NodeConnectorHandles'
import { useNodeFormattingToolbar } from './useNodeFormattingToolbar'
import { useNodeActive } from './useNodeActive'
import { handleNodeCardClick } from './handleNodeCardClick'
import { useAutoResizeTextarea } from './useAutoResizeTextarea'
import { useNodeWidthResize } from './useNodeWidthResize'
import NodeResizeHandle from './NodeResizeHandle'
import NodeRequiredBanner from './NodeRequiredBanner'
import RequiredFieldGroup from './RequiredFieldGroup'
import NodeRequiredMessage from './NodeRequiredMessage'
import AnswerInlineImage from './AnswerInlineImage'
import { createAnswerImageFromFile, normalizeAnswerImage, type AnswerImage } from './answerImage'
import { useAnswerImageInteractions } from './useAnswerImageInteractions'
import { useNodeValidation } from './useNodeValidation'
import { useRegisterNodeFields } from './useRegisterNodeFields'
import { isFieldEmpty, NODE_ERROR_COLOR } from './nodeValidation'
import { hasDiscoveryPreviewContent } from './nodePreview'
import {
  registerFieldMount,
  shouldShowFieldValidation,
  unregisterFieldMount,
} from './nodeValidationStore'
import type { QuestionNodeData, QuestionOption } from '@/types/questionNode'
import { DEFAULT_QUESTION_DATA } from '@/types/questionNode'

const CARD_MIN_HEIGHT = NODE_CARD_MIN_HEIGHT
const BASE_NODE_WIDTH = 460
const REORDER_NODE_WIDTH = BASE_NODE_WIDTH + GRIP_LANE_WIDTH

function FieldTrashButton({
  show,
  onClick,
  ariaLabel,
}: {
  show: boolean
  onClick: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={ariaLabel}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      className={`w-7 h-7 flex items-center justify-center rounded-full nodrag nopan text-[#8D8A87] hover:text-[#3F3C3A] hover:bg-[#F0EDEA] transition-colors shrink-0 ${
        show ? '' : 'invisible pointer-events-none'
      }`}
    >
      <Trash2 size={14} strokeWidth={1.75} />
    </button>
  )
}

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
  invalid,
  nodeActive,
  suppressHover,
  layoutWidth,
}: {
  value: string
  onChange: (value: string) => void
  focused: boolean
  onFocus: (e: React.FocusEvent) => void
  onBlur: (e: React.FocusEvent) => void
  invalid?: boolean
  nodeActive?: boolean
  suppressHover?: boolean
  layoutWidth?: number
}) {
  const ref = useAutoResizeTextarea(value, SINGLE_LINE_FIELD_MIN_HEIGHT, layoutWidth)

  return (
    <RequiredFieldGroup showMessage={!!invalid}>
      <NodeInputShell
        focused={focused}
        onBlur={onBlur}
        minHeight={INPUT_MIN_HEIGHT}
        padding={0}
        invalid={invalid}
        label="Question"
        nodeActive={nodeActive}
        suppressHover={suppressHover}
        primaryField
        onClear={() => onChange('')}
        hasContent={!!value.trim()}
      >
        <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => onFocus(e)}
        onBlur={onBlur}
        placeholder={QUESTION_PLACEHOLDER}
        rows={1}
        className={`${QUESTION_INPUT_CLASS} ${NODE_INPUT_INNER_CLASS} resize-none overflow-hidden`}
        data-cta-field
        style={PRIMARY_SINGLE_LINE_FIELD_STYLE}
      />
      </NodeInputShell>
    </RequiredFieldGroup>
  )
}

function AnswerConnectorScope({
  optionId,
  nodeId,
  handleRight,
  children,
}: {
  optionId: number
  nodeId: string
  handleRight: number
  children: React.ReactNode
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const updateNodeInternals = useUpdateNodeInternals()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => updateNodeInternals(nodeId))
    observer.observe(el)
    return () => observer.disconnect()
  }, [nodeId, updateNodeInternals])

  return (
    <div ref={containerRef} className="relative overflow-visible">
      {children}
      <NodeInlineSourceHandle id={`option-${optionId}`} top="50%" right={handleRight} />
    </div>
  )
}

function AnswerInputShell({
  focused,
  onClick,
  onBlur,
  onHoverChange,
  onClear,
  hasContent = false,
  showClearWhenEmpty = false,
  children,
  className = '',
  invalid = false,
  suppressHover = false,
  label,
  nodeActive,
}: {
  focused: boolean
  onClick?: () => void
  onBlur?: (e: React.FocusEvent) => void
  onHoverChange?: (hovered: boolean) => void
  onClear?: () => void
  hasContent?: boolean
  showClearWhenEmpty?: boolean
  children: React.ReactNode
  className?: string
  invalid?: boolean
  suppressHover?: boolean
  label?: string
  nodeActive?: boolean
}) {
  return (
    <NodeInputShell
      focused={focused}
      onClick={onClick}
      onBlur={onBlur}
      onHoverChange={onHoverChange}
      onClear={onClear}
      hasContent={hasContent}
      showClearWhenEmpty={showClearWhenEmpty}
      className={className}
      padding={0}
      invalid={invalid}
      suppressHover={suppressHover}
      label={label}
      nodeActive={nodeActive}
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
  const [options, setOptions] = useState<QuestionOption[]>(() =>
    (nodeData.options ?? []).map((option) => ({
      ...option,
      descriptionImage: normalizeAnswerImage(option.descriptionImage),
    })),
  )
  const [editingQuestion, setEditingQuestion] = useState(false)
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null)
  const [editFocusTarget, setEditFocusTarget] = useState<'answer' | 'description'>('answer')
  const [showPreview, setShowPreview] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [focusedField, setFocusedField] = useState<'question' | 'answer' | 'description' | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [gripHoveredId, setGripHoveredId] = useState<number | null>(null)
  const [dragAreaRowId, setDragAreaRowId] = useState<number | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageTargetOptionIdRef = useRef<number | null>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])
  const descriptionEditRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const optionsRef = useRef(options)
  optionsRef.current = options
  const dragIndexRef = useRef<number | null>(null)

  const nodeActive = useNodeActive(cardRef)

  const suppressFieldAffordances =
    draggingIndex !== null || gripHoveredId !== null || dragAreaRowId !== null

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
    followToolbarToField,
    followToolbarToShell,
    remeasure,
    hideToolbar,
  } = useNodeFormattingToolbar({
    nodeId: id,
    containerRef: cardRef,
    enabled: !suppressFieldAffordances,
    onBlurClear: () => setFocusedField(null),
  })

  const { width, setWidth, startResize } = useNodeWidthResize(BASE_NODE_WIDTH, BASE_NODE_WIDTH)

  const optionOrderKey = options.map((o) => o.id).join(',')
  const showGhostAnswers = options.length === 0
  const canReorder = options.length >= 2

  useEffect(() => {
    if (canReorder) {
      setWidth((w) => Math.max(w, REORDER_NODE_WIDTH))
    }
  }, [canReorder, setWidth])
  const previewOptions = useMemo(
    () =>
      options.filter(
        (o) => o.value.trim() || o.description?.trim() || o.descriptionImage,
      ),
    [options],
  )
  const canPreview = useMemo(
    () => hasDiscoveryPreviewContent(question, options),
    [question, options],
  )

  const showInputAffordances = nodeActive && !suppressFieldAffordances

  const clearInputSelection = useCallback(() => {
    if (cardRef.current?.contains(document.activeElement)) {
      ;(document.activeElement as HTMLElement)?.blur()
    }
    setEditingQuestion(false)
    setEditingOptionId(null)
    setFocusedField(null)
  }, [])

  const handleDragRowMouseDown = (optionId: number, e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (
      target.closest('[data-input-shell]') ||
      target.closest('button') ||
      target.closest('[data-drag-grip]')
    ) return

    e.preventDefault()
    clearInputSelection()
    setDragAreaRowId(optionId)
  }

  const optionFieldIds = useMemo(
    () => options.map((o) => `option-${o.id}`),
    [optionOrderKey],
  )
  useRegisterNodeFields(id, optionFieldIds)

  const getHasErrors = useCallback(() => {
    if (isFieldEmpty(question)) return true
    if (options.length === 0) return true
    if (options.some((o) => isFieldEmpty(o.value) && shouldShowFieldValidation(id, `option-${o.id}`))) {
      return true
    }
    return false
  }, [question, options, id])

  const { showValidation } = useNodeValidation(id, getHasErrors)
  const nodeHasErrors = showValidation && getHasErrors()
  const questionInvalid = showValidation && isFieldEmpty(question)
  const ghostAnswerInvalid = showValidation && options.length === 0

  useEffect(() => {
    updateNodeInternals(id)
  }, [id, optionOrderKey, width, updateNodeInternals])

  const toggleFormat = useCallback((fmt: FormatOption) => {
    if (fmt === 'image') {
      if (focusedField !== 'description' || imageTargetOptionIdRef.current == null) return
      setShowOverlay(true)
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
      setDragAreaRowId(null)
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
    clearInputSelection()
    setDragAreaRowId(options[index]?.id ?? null)
    dragIndexRef.current = index
    setDraggingIndex(index)
  }

  const updateOptionImage = useCallback(
    (optionId: number, image: AnswerImage | undefined) => {
      setOptions((prev) => {
        const next = prev.map((opt) =>
          opt.id === optionId ? { ...opt, descriptionImage: image } : opt,
        )
        syncData({ options: next })
        return next
      })
    },
    [syncData],
  )

  const { handleImageDragStart, handleResizeStart } = useAnswerImageInteractions({
    items: options.map((option) => ({ id: option.id, image: option.descriptionImage })),
    rowRefs: optionRefs,
    onUpdateImage: updateOptionImage,
  })

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      setShowOverlay(false)
      if (!file || !file.type.startsWith('image/')) return
      const optionId = imageTargetOptionIdRef.current
      if (optionId == null) return
      const reader = new FileReader()
      reader.onload = () => {
        const img = new window.Image()
        img.onload = () => {
          updateOptionImage(
            optionId,
            createAnswerImageFromFile(reader.result as string, img.width, img.height),
          )
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    },
    [updateOptionImage],
  )

  const handleQuestionChange = (value: string) => {
    setQuestion(value)
    syncData({ question: value })
  }

  const handleAddAnswer = () => {
    const newOption = { id: Date.now(), value: '' }
    registerFieldMount(id, `option-${newOption.id}`)
    const next = [...options, newOption]
    setOptions(next)
    syncData({ options: next })
    beginEditingOption(newOption.id, 'answer')
  }

  const beginEditingOption = (optionId: number, target: 'answer' | 'description') => {
    setEditingOptionId(optionId)
    setEditingQuestion(false)
    setEditFocusTarget(target)
    setFocusedField(target)
    imageTargetOptionIdRef.current = optionId
    handleFieldFocus()
  }

  useLayoutEffect(() => {
    if (editingOptionId == null) return
    if (focusedField !== 'answer' && focusedField !== 'description') return

    const row = cardRef.current?.querySelector<HTMLElement>(
      `[data-answer-row="${editingOptionId}"]`,
    )
    const shell = row?.querySelector<HTMLElement>('[data-input-shell]')
    if (shell) followToolbarToShell(shell)

    if (editFocusTarget !== 'description') return
    const el = descriptionEditRefs.current.get(editingOptionId)
    if (!el) return
    el.focus()
    const selection = window.getSelection()
    if (selection) {
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }, [editingOptionId, editFocusTarget, focusedField, followToolbarToShell])

  useLayoutEffect(() => {
    if (!toolbarVisible || editingOptionId == null) return
    if (focusedField !== 'answer' && focusedField !== 'description') return
    remeasure()
  }, [canReorder, showInputAffordances, optionOrderKey, toolbarVisible, editingOptionId, focusedField, remeasure])

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
    unregisterFieldMount(id, `option-${optionId}`)
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

  const handlePreview = () => {
    if (!canPreview) return
    setShowPreview(true)
  }

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const nodeIsEmpty = isFieldEmpty(question) && options.length === 0
    handleNodeCardClick(e, {
      nodeIsEmpty,
      onFilledChromeClick: () => {
        clearInputSelection()
        setDragAreaRowId(null)
      },
      onNonPrimaryShellClick: () => setDragAreaRowId(null),
    })
  }

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-lg relative flex flex-col overflow-visible"
      onClick={handleCardClick}
      style={{
        width,
        minHeight: CARD_MIN_HEIGHT,
        boxShadow: NODE_CARD_SHADOW,
        border: nodeHasErrors
          ? `1px solid ${NODE_ERROR_COLOR}`
          : selected
            ? `1px solid ${NODE_CARD_BORDER_SELECTED}`
            : `1px solid ${NODE_CARD_BORDER_DEFAULT}`,
        borderRadius: NODE_CARD_BORDER_RADIUS,
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
          disabledKeys={focusedField === 'description' ? undefined : new Set<FormatOption>(['image'])}
          sparkleId={`question_${id}`}
        />
      )}

      <div className="relative flex flex-col flex-1 z-0 overflow-visible">
        <NodeSideTargetHandle />

      <NodeHeaderBar
        className={NODE_HEADER_BAR_CLASS}
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

      {/* Body */}
      <NodeInputSection className="pt-3 pb-[33px] flex flex-col nodrag nopan">
        <div
          style={{
            paddingLeft: nodeContentPaddingLeft(canReorder),
            paddingRight: nodeContentPaddingRight(canReorder),
          }}
        >
          <QuestionField
            value={question}
            onChange={handleQuestionChange}
            focused={editingQuestion}
            invalid={questionInvalid}
            nodeActive={showInputAffordances}
            suppressHover={suppressFieldAffordances}
            layoutWidth={width}
            onFocus={(e) => {
              setDragAreaRowId(null)
              hideToolbar()
              setFocusedField('question')
              setEditingQuestion(true)
              setEditingOptionId(null)
            }}
            onBlur={(e) => {
              setEditingQuestion(false)
              handleFieldBlur(e)
            }}
          />
        </div>

        {/* Ghost placeholders — visible on new nodes before first answer is added */}
        {showGhostAnswers && (
          <div
            className="mt-4"
            style={{
              paddingLeft: nodeContentPaddingLeft(canReorder),
              paddingRight: nodeContentPaddingRight(canReorder),
            }}
          >
            <RequiredFieldGroup showMessage={ghostAnswerInvalid}>
              <AnswerInputShell focused={false} onClick={handleAddAnswer} invalid={ghostAnswerInvalid} label="Answer & Description" nodeActive={showInputAffordances}>
                <div className="relative overflow-visible">
                  <p className={`leading-relaxed px-4 pt-2.5 ${ANSWER_FIELD_CLASS}`}>{ANSWER_PLACEHOLDER}</p>
                  <NodeGhostConnectorDot top="50%" right={answerHandleRightOffset(canReorder)} />
                </div>
                <p className={`mt-1 leading-relaxed px-4 pb-2.5 ${DESCRIPTION_PLACEHOLDER_CLASS}`}>
                  {DESCRIPTION_PLACEHOLDER}
                </p>
              </AnswerInputShell>
            </RequiredFieldGroup>
          </div>
        )}

        {/* Real answer rows */}
        {options.length > 0 && (
          <div className="mt-4 space-y-2">
            {options.map((option, index) => {
              const isDragging = draggingIndex !== null || dragAreaRowId !== null
              const keepFieldsVisible = nodeActive || isDragging
              const hasDescription =
                !!option.description?.trim() || !!option.descriptionImage
              const showDescriptionField = keepFieldsVisible || hasDescription
              const showReorderHighlight =
                canReorder &&
                (draggingIndex === index ||
                  gripHoveredId === option.id ||
                  dragAreaRowId === option.id)
              const answerInvalid =
                showValidation &&
                isFieldEmpty(option.value) &&
                shouldShowFieldValidation(id, `option-${option.id}`)
              const optionFocused =
                editingOptionId === option.id && !suppressFieldAffordances

              return (
                <div
                  key={option.id}
                  data-answer-row={option.id}
                  ref={(el) => {
                    optionRefs.current[index] = el
                    optionRefs.current.length = options.length
                  }}
                  className={`relative rounded-lg overflow-visible ${
                    draggingIndex !== null && draggingIndex !== index ? 'opacity-50' : ''
                  }`}
                  onMouseDown={(e) => handleDragRowMouseDown(option.id, e)}
                  style={{
                    paddingLeft: DRAG_ROW_INSET,
                    paddingRight: DRAG_ROW_INSET,
                    ...answerRowReorderStyles(showReorderHighlight, draggingIndex === index),
                  }}
                >
                  <div className="flex items-center">
                    {canReorder && (
                      <div
                        className="flex shrink-0 items-center justify-center nodrag nopan"
                        style={{ width: GRIP_LANE_WIDTH }}
                        onMouseEnter={() => setGripHoveredId(option.id)}
                        onMouseLeave={() => setGripHoveredId(null)}
                      >
                        <div
                          data-drag-grip
                          className="cursor-grab active:cursor-grabbing select-none opacity-50 hover:opacity-100 transition-opacity"
                          onMouseDown={(e) => handleGrabStart(index, e)}
                          aria-label="Drag to reorder"
                        >
                          <DragGripIcon />
                        </div>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="relative">
                        <AnswerInputShell
                          focused={optionFocused}
                          className="my-0"
                          invalid={answerInvalid}
                          suppressHover={suppressFieldAffordances}
                          label={showDescriptionField ? 'Answer & Description' : undefined}
                          nodeActive={showInputAffordances}
                        >
                          <AnswerConnectorScope
                            optionId={option.id}
                            nodeId={id}
                            handleRight={answerHandleRightOffset(canReorder)}
                          >
                          <div
                            className={showDescriptionField ? 'pb-3.5' : undefined}
                            onBlur={(e) => {
                              const related = e.relatedTarget as HTMLElement | null
                              if (related?.closest('[data-toolbar]')) return
                              if (!e.currentTarget.contains(related as Node)) {
                                setEditingOptionId(null)
                                handleFieldBlur(e)
                              }
                            }}
                          >
                              <NodeInputFieldRow
                                  showClear={
                                    showInputAffordances &&
                                    editingOptionId === option.id &&
                                    focusedField === 'answer' &&
                                    !!option.value.trim()
                                  }
                                  clearButtonClassName="-translate-x-1"
                                  onClear={() => handleOptionChange(option.id, '')}
                                  clearLabel="Clear answer"
                                >
                                  <input
                                    autoFocus={editFocusTarget === 'answer'}
                                    type="text"
                                    value={option.value}
                                    onChange={(e) => handleOptionChange(option.id, e.target.value)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onFocus={(e) => {
                                      setDragAreaRowId(null)
                                      setShowOverlay(false)
                                      setGripHoveredId(null)
                                      setEditingOptionId(option.id)
                                      followToolbarToField(e.target)
                                      handleFieldFocus()
                                      setFocusedField('answer')
                                      setEditFocusTarget('answer')
                                      imageTargetOptionIdRef.current = option.id
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Escape') (e.target as HTMLInputElement).blur()
                                    }}
                                    placeholder={ANSWER_PLACEHOLDER}
                                    className={`${ANSWER_INPUT_CLASS} ${
                                      showDescriptionField ? 'px-4 pt-2.5' : NODE_INPUT_INNER_CLASS
                                    }`}
                                    data-cta-field
                                    style={{
                                      lineHeight: 1.5,
                                      minHeight: showDescriptionField
                                        ? INPUT_MIN_HEIGHT - 2
                                        : INPUT_MIN_HEIGHT,
                                    }}
                                  />
                                </NodeInputFieldRow>
                            {showDescriptionField && (
                            <div className="mt-1 relative z-10" data-answer-content>
                              {option.descriptionImage && (
                                <div className="px-4">
                                  <AnswerInlineImage
                                    id={option.id}
                                    image={option.descriptionImage}
                                    onDragStart={(e) => handleImageDragStart(option.id, e)}
                                    onResizeStart={(_corner, e) => handleResizeStart(option.id, e)}
                                    onReplace={() => {
                                      imageTargetOptionIdRef.current = option.id
                                      setShowOverlay(true)
                                      setTimeout(() => fileInputRef.current?.click(), 100)
                                    }}
                                    onRemove={() => updateOptionImage(option.id, undefined)}
                                  />
                                </div>
                              )}
                              <NodeInputFieldRow
                                showClear={
                                  showInputAffordances &&
                                  editingOptionId === option.id &&
                                  focusedField === 'description' &&
                                  !!option.description?.trim()
                                }
                                clearButtonClassName="-translate-x-1"
                                onClear={() => {
                                  handleDescriptionChange(option.id, '')
                                  descriptionEditRefs.current.get(option.id)?.replaceChildren()
                                }}
                                clearLabel="Clear description"
                              >
                                <div
                                  key={`desc-edit-${option.id}`}
                                  ref={(el) => {
                                    if (el) {
                                      descriptionEditRefs.current.set(option.id, el)
                                      if (!el.dataset.initialized) {
                                        el.textContent = option.description ?? ''
                                        el.dataset.initialized = 'true'
                                      }
                                    } else {
                                      descriptionEditRefs.current.delete(option.id)
                                    }
                                  }}
                                  contentEditable
                                  suppressContentEditableWarning
                                  data-cta-field
                                  data-description-field
                                  data-placeholder={DESCRIPTION_PLACEHOLDER}
                                  className={`nodrag nopan ${DESCRIPTION_FIELD_CLASS} outline-none min-h-[1.5em] cursor-text px-4 pb-2.5 [&_*]:leading-[inherit] ${showInputAffordances && !option.description?.trim() ? DESCRIPTION_RICH_TEXT_PLACEHOLDER_CLASS : ''}`}
                                  style={{ wordBreak: 'break-word', lineHeight: 1.5 }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onInput={(e) => {
                                    handleDescriptionChange(option.id, (e.target as HTMLDivElement).textContent || '')
                                  }}
                                  onFocus={(e) => {
                                    setDragAreaRowId(null)
                                    setShowOverlay(false)
                                    setGripHoveredId(null)
                                    setEditingOptionId(option.id)
                                    followToolbarToField(e.target)
                                    handleFieldFocus()
                                    setFocusedField('description')
                                    setEditFocusTarget('description')
                                    imageTargetOptionIdRef.current = option.id
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') (e.target as HTMLDivElement).blur()
                                  }}
                                />
                              </NodeInputFieldRow>
                              {option.descriptionImage && (
                                <div className="px-4">
                                  <div style={{ clear: 'both' }} />
                                </div>
                              )}
                            </div>
                            )}
                          </div>
                          </AnswerConnectorScope>
                        </AnswerInputShell>
                      </div>
                    </div>

                    {canReorder && (
                      <div
                        className="flex shrink-0 items-center justify-center nodrag nopan"
                        style={{ width: FIELD_REMOVE_LANE_PADDING }}
                      >
                        {index > 0 && (
                          <FieldTrashButton
                            show={showInputAffordances}
                            onClick={() => handleDeleteOption(option.id)}
                            ariaLabel="Remove answer"
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <NodeRequiredMessage show={answerInvalid} />
                </div>
              )
            })}
          </div>
        )}

        {/* + Add Answer — always visible per Frame 3756 */}
        <button
          type="button"
          onClick={handleAddAnswer}
          className="mt-[33px] text-sm font-semibold transition-opacity hover:opacity-80 nodrag nopan self-start"
          style={{ color: '#FC6839', marginLeft: nodeContentPaddingLeft(canReorder) }}
        >
          + Add Answer
        </button>
      </NodeInputSection>
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
            answers: previewOptions.map((o) => o.value.trim()),
            tooltips: Object.fromEntries(
              previewOptions
                .map((o, i) => [i, o.description?.trim() ?? ''] as const)
                .filter(([, tip]) => tip.length > 0),
            ),
            tooltipImages: Object.fromEntries(
              previewOptions
                .map((o, i) => (o.descriptionImage ? ([i, o.descriptionImage] as const) : null))
                .filter((entry): entry is [number, AnswerImage] => entry !== null),
            ),
          }}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showOverlay &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50"
            style={{ zIndex: 9999 }}
            onClick={() => setShowOverlay(false)}
          />,
          document.body,
        )}

      <NodeResizeHandle onMouseDown={startResize} />
    </div>
  )
}
