'use client'

import { useState, useCallback, useMemo, useRef, useLayoutEffect, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { type NodeProps, useReactFlow, useUpdateNodeInternals } from '@xyflow/react'
import { Copy, X, CircleHelp, Monitor, MousePointerClick } from 'lucide-react'
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
  HEADER_INPUT_CLASS,
  ANSWER_FIELD_CLASS,
  ANSWER_RICH_TEXT_PLACEHOLDER_CLASS,
  BUTTON_INPUT_CLASS,
  URL_INPUT_CLASS,
  TOOLTIP_INPUT_CLASS,
  RICH_TEXT_PLACEHOLDER_CLASS,
  NODE_DEFAULT_WIDTH,
  NODE_INPUT_INNER_CLASS,
  ANSWER_ROW_GRIP_HEIGHT,
  DRAG_ROW_INSET,
  NODE_HEADER_BAR_CLASS,
  NODE_INPUT_SECTION_CLASS,
  NODE_CARD_MIN_HEIGHT,
  NODE_CARD_BORDER_RADIUS,
  NODE_CARD_SHADOW,
  NODE_CARD_BORDER_DEFAULT,
  NODE_CARD_BORDER_SELECTED,
  nodeContentInsetStyle,
  nodeContentPaddingLeft,
  nodeContentPaddingRight,
  answerRowReorderStyles,
} from './nodeFieldStyles'
import { NodeSideTargetHandle, NodeSideSourceHandle } from './NodeConnectorHandles'
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
import { hasDialogPreviewContent } from './nodePreview'
import {
  registerFieldMount,
  shouldShowFieldValidation,
  unregisterFieldMount,
} from './nodeValidationStore'

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

interface ButtonEntry {
  id: number
  text: string
  url: string
  image?: AnswerImage
}

export default function FullScreenDialogNode({ id, data, selected }: NodeProps) {
  const { setNodes, setEdges, getNodes } = useReactFlow()
  const updateNodeInternals = useUpdateNodeInternals()
  const typedData = data as { header?: string; message?: string; buttons?: string[]; buttonUrls?: string[]; variant?: 'cta' | 'fullscreen' }
  const isCta = typedData.variant === 'cta'
  const [header, setHeader] = useState(typedData.header ?? '')
  const [message, setMessage] = useState(typedData.message ?? '')
  const [buttons, setButtons] = useState<ButtonEntry[]>(() => {
    if (typedData.buttons && typedData.buttons.length > 0) {
      return typedData.buttons.map((t, i) => ({ id: i, text: t, url: typedData.buttonUrls?.[i] ?? '' }))
    }
    return [{ id: 0, text: '', url: '' }]
  })
  const [showPreview, setShowPreview] = useState(false)
  const [tooltipMode, setTooltipMode] = useState(false)
  const [tooltips, setTooltips] = useState<Record<string | number, string>>({})
  const [draftTooltips, setDraftTooltips] = useState<Record<string | number, string>>({})
  const [focusedButtonId, setFocusedButtonId] = useState<number | null>(null)
  const [focusedField, setFocusedField] = useState<'header' | 'message' | 'button' | 'url' | null>(null)
  const [focusedTooltip, setFocusedTooltip] = useState(false)
  const [messageImage, setMessageImage] = useState<AnswerImage | null>(null)
  const [resizingImage, setResizingImage] = useState<{ startX: number; startY: number; startW: number; startH: number } | null>(null)
  const [draggingImage, setDraggingImage] = useState<{ startX: number; startY: number; startOffX: number; startOffY: number } | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const hasContent = !!(
    header.trim() ||
    message.trim() ||
    buttons.some((b) => b.text.trim()) ||
    messageImage
  )

  const getHasErrors = useCallback(() => {
    if (isFieldEmpty(header)) return true
    if (isFieldEmpty(message)) return true
    if (buttons.some((b) => isFieldEmpty(b.text) && shouldShowFieldValidation(id, `button-${b.id}`))) {
      return true
    }
    if (isCta && buttons.some((b) => isFieldEmpty(b.url) && shouldShowFieldValidation(id, `button-url-${b.id}`))) {
      return true
    }
    return false
  }, [header, message, buttons, isCta, id])

  const { showValidation } = useNodeValidation(id, getHasErrors)
  const nodeHasErrors = showValidation && getHasErrors()
  const headerInvalid = showValidation && isFieldEmpty(header)
  const messageInvalid = showValidation && isFieldEmpty(message)
  const canPreview = useMemo(
    () => hasDialogPreviewContent(header, message, messageImage, buttons),
    [header, message, messageImage, buttons],
  )
  const canReorderButtons = buttons.length >= 2

  const buttonOrderKey = buttons.map((b) => b.id).join(',')

  const buttonFieldIds = useMemo(() => {
    const ids: string[] = []
    buttons.forEach((b) => {
      ids.push(`button-${b.id}`)
      if (isCta) ids.push(`button-url-${b.id}`)
    })
    return ids
  }, [buttonOrderKey, isCta, buttons])
  useRegisterNodeFields(id, buttonFieldIds)

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canPreview) return
    setShowPreview(true)
  }
  const [draggingBtnIndex, setDraggingBtnIndex] = useState<number | null>(null)
  const [gripHoveredBtnId, setGripHoveredBtnId] = useState<number | null>(null)
  const dragBtnIndexRef = useRef<number | null>(null)
  const buttonRefs = useRef<(HTMLDivElement | null)[]>([])
  const buttonsRef = useRef(buttons)
  buttonsRef.current = buttons
  const cardRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nodeActive = useNodeActive(cardRef)
  const tooltipModeRef = useRef(false)
  const messageRef = useRef<HTMLDivElement>(null)
  const messageContainerRef = useRef<HTMLDivElement>(null)

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
    shouldRetainFocus: () => tooltipModeRef.current,
    onBlurClear: () => setFocusedField(null),
  })

  useEffect(() => {
    updateNodeInternals(id)
  }, [tooltipMode, buttonOrderKey, id, updateNodeInternals])

  useEffect(() => {
    if (typedData.header && typedData.header !== header) setHeader(typedData.header)
    if (typedData.message && typedData.message !== message) {
      setMessage(typedData.message)
    }
    if (typedData.message && messageRef.current && !messageRef.current.textContent) {
      messageRef.current.textContent = typedData.message
    }
  }, [typedData.header, typedData.message])

  const addButton = () => {
    const newId = Date.now()
    registerFieldMount(id, `button-${newId}`)
    if (isCta) registerFieldMount(id, `button-url-${newId}`)
    setButtons((prev) => [...prev, { id: newId, text: '', url: '' }])
  }

  const removeButton = (btnId: number) => {
    unregisterFieldMount(id, `button-${btnId}`)
    unregisterFieldMount(id, `button-url-${btnId}`)
    setButtons((prev) => prev.filter((b) => b.id !== btnId))
  }

  const updateButtonText = (btnId: number, text: string) =>
    setButtons((prev) => prev.map((b) => (b.id === btnId ? { ...b, text } : b)))

  const updateButtonUrl = (btnId: number, url: string) =>
    setButtons((prev) => prev.map((b) => (b.id === btnId ? { ...b, url } : b)))

  useEffect(() => {
    const onMouseMove = (ev: MouseEvent) => {
      if (dragBtnIndexRef.current === null) return
      const y = ev.clientY
      const currentIdx = dragBtnIndexRef.current
      const len = buttonsRef.current.length
      for (let i = 0; i < len; i++) {
        const el = buttonRefs.current[i]
        if (!el || i === currentIdx) continue
        const rect = el.getBoundingClientRect()
        const mid = rect.top + rect.height / 2
        if ((i < currentIdx && y < mid) || (i > currentIdx && y > mid)) {
          setButtons((prev) => {
            const next = [...prev]
            const [item] = next.splice(currentIdx, 1)
            next.splice(i, 0, item)
            return next
          })
          dragBtnIndexRef.current = i
          setDraggingBtnIndex(i)
          break
        }
      }
    }
    const onMouseUp = () => {
      if (dragBtnIndexRef.current === null) return
      dragBtnIndexRef.current = null
      setDraggingBtnIndex(null)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const handleBtnGrabStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragBtnIndexRef.current = index
    setDraggingBtnIndex(index)
  }

  const handleImageClick = () => {
    setShowOverlay(true)
    setTimeout(() => fileInputRef.current?.click(), 100)
  }

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
    if (focusedField !== 'message' && focusedField !== 'button') disabled.add('image')
    return disabled.size > 0 ? disabled : undefined
  }, [focusedField])

  const MAX_CHARS = 65
  const CARD_CHROME = 100
  const measureRef = useRef<HTMLSpanElement>(null)
  const [cardWidth, setCardWidth] = useState(NODE_DEFAULT_WIDTH)
  const [manualWidth, setManualWidth] = useState<number | null>(null)
  const nodeWidth = manualWidth ?? cardWidth
  const headerRef = useAutoResizeTextarea(header, SINGLE_LINE_FIELD_MIN_HEIGHT, nodeWidth)
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
      data: { header, message, buttons: buttons.map((b) => b.text), buttonUrls: buttons.map((b) => b.url), ...(isCta ? { variant: 'cta' } : {}) },
      selected: true,
      zIndex: 1000,
    }
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })).concat(newNode))
  }, [id, getNodes, setNodes, header, message, buttons, isCta])

  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
  }, [id, setNodes, setEdges])

  const longestLine = useMemo(() => {
    const allTexts = [
      header || PLACEHOLDERS.header,
      message || PLACEHOLDERS.message,
      ...buttons.map((b) => b.text || PLACEHOLDERS.button),
      ...(isCta ? buttons.map((b) => b.url || PLACEHOLDERS.url) : []),
    ]
    const allLines = allTexts.flatMap((t) => t.split('\n'))
    const longest = allLines.reduce((a, b) => (a.length > b.length ? a : b), '')
    return longest.length > MAX_CHARS ? longest.slice(0, MAX_CHARS) : longest
  }, [header, message, buttons, isCta])

  useLayoutEffect(() => {
    if (!measureRef.current) return
    measureRef.current.textContent = longestLine
    setCardWidth(Math.max(measureRef.current.offsetWidth + CARD_CHROME, NODE_DEFAULT_WIDTH))
  }, [longestLine])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setShowOverlay(false)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      const img = new window.Image()
      img.onload = () => {
        const maxW = (manualWidth ?? cardWidth) - 32
        const scale = Math.min(1, maxW / img.width)
        const newImage: AnswerImage = {
          src,
          width: Math.round(img.width * scale),
          height: Math.round(img.height * scale),
          naturalWidth: img.width,
          naturalHeight: img.height,
          float: 'left',
          offsetX: 0,
          offsetY: 0,
        }
        if (focusedField === 'message') {
          setMessageImage(newImage)
        } else if (focusedButtonId !== null) {
          setButtons((prev) =>
            prev.map((b) => b.id === focusedButtonId ? { ...b, image: newImage } : b),
          )
        }
      }
      img.src = src
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleMsgImageDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!messageImage) return
    setDraggingImage({ startX: e.clientX, startY: e.clientY, startOffX: messageImage.offsetX, startOffY: messageImage.offsetY })
  }

  useEffect(() => {
    if (!draggingImage) return
    const onMove = (e: MouseEvent) => {
      if (!messageImage) return
      const containerEl = messageContainerRef.current
      const dx = e.clientX - draggingImage.startX
      const dy = e.clientY - draggingImage.startY
      let newOffX = draggingImage.startOffX + dx
      let newOffY = draggingImage.startOffY + dy
      if (containerEl) {
        const containerW = containerEl.offsetWidth
        const containerH = containerEl.offsetHeight
        newOffX = Math.max(0, Math.min(newOffX, containerW - messageImage.width - 16))
        newOffY = Math.max(0, Math.min(newOffY, Math.max(0, containerH - messageImage.height)))
      } else {
        newOffX = Math.max(0, newOffX)
        newOffY = Math.max(0, newOffY)
      }
      setMessageImage((prev) => prev ? { ...prev, offsetX: newOffX, offsetY: newOffY, float: newOffX > 50 ? 'right' : 'left' } : prev)
    }
    const onUp = () => setDraggingImage(null)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [draggingImage, messageImage])

  const handleMsgResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!messageImage) return
    setResizingImage({ startX: e.clientX, startY: e.clientY, startW: messageImage.width, startH: messageImage.height })
  }

  useEffect(() => {
    if (!resizingImage) return
    const onMove = (e: MouseEvent) => {
      if (!messageImage) return
      const dx = e.clientX - resizingImage.startX
      const dy = e.clientY - resizingImage.startY
      let newW = Math.max(40, resizingImage.startW + dx)
      let newH = Math.max(40, resizingImage.startH + dy)
      if (e.shiftKey) {
        const ratio = messageImage.naturalWidth / messageImage.naturalHeight
        newH = Math.round(newW / ratio)
      }
      setMessageImage((prev) => prev ? { ...prev, width: newW, height: newH } : prev)
    }
    const onUp = () => setResizingImage(null)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [resizingImage, messageImage])

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    handleNodeCardClick(e, { nodeIsEmpty: !hasContent })
  }

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-lg relative flex flex-col overflow-visible"
      onClick={handleCardClick}
      style={{
        width: tooltipMode ? Math.max(manualWidth ?? cardWidth, 320) : (manualWidth ?? cardWidth),
        minHeight: NODE_CARD_MIN_HEIGHT,
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
          disabledKeys={toolbarDisabledKeys}
          sparkleId={`fsd_${id}`}
        />
      )}
      <span
        ref={measureRef}
        className="invisible absolute whitespace-nowrap text-base font-semibold pointer-events-none"
        aria-hidden
      />
      <div className="relative flex flex-col flex-1 z-0 overflow-visible">
        <NodeSideTargetHandle />
        <NodeSideSourceHandle />

      <NodeHeaderBar
        className={NODE_HEADER_BAR_CLASS}
        icon={
          isCta ? (
            <MousePointerClick size={16} className="text-[#FC6839] shrink-0" />
          ) : (
            <Monitor size={16} className="text-[#8b5cf6] shrink-0" />
          )
        }
        title={isCta ? 'Call to Action' : 'Full Screen Dialog'}
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
          data={{ type: isCta ? 'cta' : 'fullscreen', header, message, buttons: buttons.map((b) => b.text), buttonUrls: isCta ? buttons.map((b) => b.url) : undefined, messageImage: messageImage ? { src: messageImage.src, float: messageImage.float } : undefined }}
          onClose={() => setShowPreview(false)}
        />
      )}

      <div>
        {tooltipMode && (
          <div className="bg-white px-0 py-0">
            <div className="mb-5 px-1">
              <p className="text-base font-semibold italic text-gray-800">
                Create a tooltip for your message
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {/* Message tooltip */}
              {message.trim() && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Message: {message}</p>
                  <div className="flex items-start gap-3">
                    <NodeInputShell
                      focused={focusedTooltip}
                      className="flex-1 min-w-0"
                      padding={0}
                      hasContent={!!(draftTooltips['message'] ?? '').trim()}
                      onClear={() =>
                        setDraftTooltips((prev) => ({ ...prev, message: '' }))
                      }
                    >
                      <input
                        type="text"
                        value={draftTooltips['message'] ?? ''}
                        onChange={(e) =>
                          setDraftTooltips((prev) => ({ ...prev, message: e.target.value }))
                        }
                        placeholder={PLACEHOLDERS.tooltip}
                        className={`${TOOLTIP_INPUT_CLASS} px-4 py-2.5`}
                        data-cta-field
                        onFocus={() => setFocusedTooltip(true)}
                        onBlur={() => setFocusedTooltip(false)}
                      />
                    </NodeInputShell>
                  </div>
                </div>
              )}

            </div>

            <div className="flex items-center justify-between mt-5">
              <button
                className="text-sm font-bold text-gray-800 hover:text-gray-600 transition-colors"
                onClick={() => { tooltipModeRef.current = false; setTooltipMode(false) }}
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
                  tooltipModeRef.current = false
                  setTooltipMode(false)
                }}
              >
                Apply
              </button>
            </div>
          </div>
        )}

        <div style={tooltipMode ? { height: 0, overflow: 'hidden' as const, visibility: 'hidden' as const } : undefined}>
        <>
          <NodeInputSection className={NODE_INPUT_SECTION_CLASS}>
          {/* Header field */}
          <div style={nodeContentInsetStyle(canReorderButtons)}>
            <RequiredFieldGroup showMessage={headerInvalid}>
              <NodeInputShell
                focused={focusedField === 'header'}
                onBlur={handleFieldBlur}
                padding={0}
                invalid={headerInvalid}
                hasContent={!!header.trim()}
                onClear={() => setHeader('')}
                label="Header"
                nodeActive={nodeActive}
                primaryField
              >
                <textarea
                  ref={headerRef}
                  value={header}
                  onChange={(e) => setHeader(e.target.value)}
                  placeholder={PLACEHOLDERS.header}
                  rows={1}
                  className={`${HEADER_INPUT_CLASS} ${NODE_INPUT_INNER_CLASS} resize-none overflow-hidden`}
                  style={PRIMARY_SINGLE_LINE_FIELD_STYLE}
                  data-cta-field
                  onFocus={() => {
                    hideToolbar()
                    setFocusedField('header')
                  }}
                  onBlur={handleFieldBlur}
                />
              </NodeInputShell>
            </RequiredFieldGroup>
          </div>

          {/* Message body */}
          <div className="mt-4" style={nodeContentInsetStyle(canReorderButtons)}>
          <RequiredFieldGroup showMessage={messageInvalid}>
          <NodeInputShell
            focused={focusedField === 'message'}
            padding={0}
            onBlur={handleFieldBlur}
            invalid={messageInvalid}
            hasContent={!!message.trim()}
            onClear={() => {
              setMessage('')
              if (messageRef.current) messageRef.current.textContent = ''
            }}
            label="Message"
            nodeActive={nodeActive}
          >
          <div ref={messageContainerRef} className={`${NODE_INPUT_INNER_CLASS} flex items-start gap-2`} data-answer-content>
            <div className="flex-1 min-w-0">
              {messageImage && (
                <div
                  className="relative inline-block nodrag group/img"
                  style={{
                    float: messageImage.float,
                    width: messageImage.width,
                    height: messageImage.height,
                    margin: 0,
                    marginTop: messageImage.offsetY,
                    marginBottom: 12,
                    ...(messageImage.float === 'left' ? { marginRight: 12 } : { marginLeft: 12 }),
                  }}
                >
                  <img
                    src={messageImage.src}
                    alt=""
                    className="w-full h-full object-cover rounded cursor-move"
                    draggable={false}
                    onMouseDown={handleMsgImageDragStart}
                  />
                  {/* Resize handles */}
                  <div onMouseDown={handleMsgResizeStart} className="absolute" style={{ cursor: 'nwse-resize', top: 0, left: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect y="6" width="6" height="13.008" rx="2" transform="rotate(-90 0 6)" fill="#FC6839"/><rect width="6" height="13.008" rx="2" fill="#FC6839"/></svg>
                  </div>
                  <div onMouseDown={handleMsgResizeStart} className="absolute" style={{ cursor: 'nesw-resize', top: 0, right: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="7.008" width="6" height="13.008" rx="2" fill="#FC6839"/><rect x="13.008" width="6" height="13.008" rx="2" transform="rotate(90 13.008 0)" fill="#FC6839"/></svg>
                  </div>
                  <div onMouseDown={handleMsgResizeStart} className="absolute" style={{ cursor: 'nesw-resize', bottom: 0, left: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="6" y="13.008" width="6" height="13.008" rx="2" transform="rotate(180 6 13.008)" fill="#FC6839"/><rect y="13.008" width="6" height="13.008" rx="2" transform="rotate(-90 0 13.008)" fill="#FC6839"/></svg>
                  </div>
                  <div onMouseDown={handleMsgResizeStart} className="absolute" style={{ cursor: 'nwse-resize', bottom: 0, right: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="13.008" y="7.008" width="6" height="13.008" rx="2" transform="rotate(90 13.008 7.008)" fill="#FC6839"/><rect x="13.008" y="13.008" width="6" height="13.008" rx="2" transform="rotate(180 13.008 13.008)" fill="#FC6839"/></svg>
                  </div>
                  {/* Hover quick actions */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-black/30 absolute inset-0 rounded pointer-events-none" />
                    <div className="relative z-10 flex items-center bg-white rounded-full border border-[#D6D1CB] px-2 py-2 gap-1 shadow-lg pointer-events-auto">
                      <div className="relative group/replace">
                        <button
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#73716F26] transition-colors cursor-pointer"
                          onClick={() => {
                            setFocusedField('message')
                            setShowOverlay(true)
                            setTimeout(() => fileInputRef.current?.click(), 100)
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <mask id={`mask_msg_replace_${id}`} style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><rect width="20" height="20" fill="#D9D9D9"/></mask>
                            <g mask={`url(#mask_msg_replace_${id})`}><path d="M10.0417 16.6667C8.18056 16.6667 6.59722 16.0209 5.29167 14.7292C3.98611 13.4375 3.33333 11.8612 3.33333 10V9.85421L2.58333 10.6042C2.43056 10.757 2.23611 10.8334 2 10.8334C1.76389 10.8334 1.56944 10.757 1.41667 10.6042C1.26389 10.4514 1.1875 10.257 1.1875 10.0209C1.1875 9.78476 1.26389 9.59032 1.41667 9.43754L3.58333 7.27087C3.66667 7.18754 3.75694 7.12837 3.85417 7.09337C3.95139 7.05893 4.05556 7.04171 4.16667 7.04171C4.27778 7.04171 4.38194 7.05893 4.47917 7.09337C4.57639 7.12837 4.66667 7.18754 4.75 7.27087L6.91667 9.43754C7.06944 9.59032 7.14583 9.78476 7.14583 10.0209C7.14583 10.257 7.06944 10.4514 6.91667 10.6042C6.76389 10.757 6.56944 10.8334 6.33333 10.8334C6.09722 10.8334 5.90278 10.757 5.75 10.6042L5 9.85421V10C5 11.3889 5.48972 12.5695 6.46917 13.5417C7.44806 14.5139 8.63889 15 10.0417 15C10.3194 15 10.5903 14.9759 10.8542 14.9275C11.1181 14.8787 11.3819 14.8056 11.6458 14.7084C11.7847 14.6528 11.9342 14.6389 12.0942 14.6667C12.2536 14.6945 12.3889 14.7639 12.5 14.875C12.75 15.125 12.8508 15.3923 12.8025 15.6767C12.7536 15.9617 12.5694 16.1598 12.25 16.2709C11.8889 16.3959 11.5244 16.4931 11.1567 16.5625C10.7883 16.632 10.4167 16.6667 10.0417 16.6667ZM15.8333 12.9584C15.7222 12.9584 15.6181 12.9409 15.5208 12.9059C15.4236 12.8714 15.3333 12.8125 15.25 12.7292L13.0833 10.5625C12.9306 10.4098 12.8542 10.2153 12.8542 9.97921C12.8542 9.7431 12.9306 9.54865 13.0833 9.39587C13.2361 9.2431 13.4306 9.16671 13.6667 9.16671C13.9028 9.16671 14.0972 9.2431 14.25 9.39587L15 10.1459V10C15 8.61115 14.5106 7.4306 13.5317 6.45837C12.5522 5.48615 11.3611 5.00004 9.95833 5.00004C9.68056 5.00004 9.40972 5.02448 9.14583 5.07337C8.88194 5.12171 8.61806 5.19449 8.35417 5.29171C8.21528 5.34726 8.06611 5.36115 7.90667 5.33337C7.74667 5.3056 7.61111 5.23615 7.5 5.12504C7.25 4.87504 7.14917 4.60754 7.1975 4.32254C7.24639 4.0381 7.43056 3.84032 7.75 3.72921C8.11111 3.60421 8.47583 3.50699 8.84417 3.43754C9.21194 3.3681 9.58333 3.33337 9.95833 3.33337C11.8194 3.33337 13.4028 3.97921 14.7083 5.27087C16.0139 6.56254 16.6667 8.13893 16.6667 10V10.1459L17.4167 9.39587C17.5694 9.2431 17.7639 9.16671 18 9.16671C18.2361 9.16671 18.4306 9.2431 18.5833 9.39587C18.7361 9.54865 18.8125 9.7431 18.8125 9.97921C18.8125 10.2153 18.7361 10.4098 18.5833 10.5625L16.4167 12.7292C16.3333 12.8125 16.2431 12.8714 16.1458 12.9059C16.0486 12.9409 15.9444 12.9584 15.8333 12.9584Z" fill="#172537"/></g>
                          </svg>
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-gray-800 text-white text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover/replace:opacity-100 transition-opacity">
                          Replace
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                        </div>
                      </div>
                      <div className="relative group/remove">
                        <button
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#73716F26] transition-colors cursor-pointer"
                          onClick={() => setMessageImage(null)}
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
                ref={(el) => {
                  (messageRef as React.MutableRefObject<HTMLDivElement | null>).current = el
                  if (el && !el.dataset.initialized && message) {
                    el.textContent = message
                    el.dataset.initialized = 'true'
                  }
                }}
                contentEditable
                suppressContentEditableWarning
                data-cta-field
                data-placeholder={PLACEHOLDERS.message}
                className={`nodrag ${ANSWER_FIELD_CLASS} outline-none min-h-[1.5em] [&_*]:leading-[inherit] ${!message ? ANSWER_RICH_TEXT_PLACEHOLDER_CLASS : ''}`}
                style={{ wordBreak: 'break-word', lineHeight: 1.5 }}
                onInput={(e) => {
                  const el = e.target as HTMLDivElement
                  setMessage(el.textContent || '')
                }}
                onFocus={(e) => {
                  anchorToolbarToField(e.target)
                  handleFieldFocus()
                  setFocusedField('message')
                }}
                onBlur={handleFieldBlur}
              />
              {messageImage && <div style={{ clear: 'both' }} />}
            </div>
            {tooltips['message']?.trim() && (
              <div className="relative group/tip shrink-0" style={{ marginTop: 2 }}>
                <CircleHelp size={14} className="text-gray-800 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 text-white text-xs opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity shadow-lg z-10" style={{ width: 'max-content', maxWidth: 320 }}>
                  {tooltips['message']}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                </div>
              </div>
            )}
          </div>
          </NodeInputShell>
          </RequiredFieldGroup>
          </div>

          {/* Button fields */}
          <div className="mt-4 flex flex-col gap-5">
            {buttons.map((btn, index) => {
              const buttonInvalid =
                showValidation &&
                isFieldEmpty(btn.text) &&
                shouldShowFieldValidation(id, `button-${btn.id}`)
              const urlInvalid =
                isCta &&
                showValidation &&
                isFieldEmpty(btn.url) &&
                shouldShowFieldValidation(id, `button-url-${btn.id}`)
              const isRowFocused = focusedButtonId === btn.id
              const showReorderHighlight =
                canReorderButtons &&
                (draggingBtnIndex === index ||
                  (!isRowFocused && gripHoveredBtnId === btn.id))
              return (
              <div
                key={btn.id}
                ref={(el) => {
                  buttonRefs.current[index] = el
                  buttonRefs.current.length = buttons.length
                }}
                className={`relative overflow-visible ${
                  draggingBtnIndex !== null && draggingBtnIndex !== index ? 'opacity-50' : ''
                }`}
                style={{
                  paddingBottom: canReorderButtons ? DRAG_ROW_INSET : 0,
                  paddingLeft: nodeContentPaddingLeft(canReorderButtons),
                  paddingRight: nodeContentPaddingRight(canReorderButtons),
                  paddingTop: canReorderButtons ? ANSWER_ROW_GRIP_HEIGHT : 0,
                  marginBottom: !isCta ? 12 : 0,
                  ...answerRowReorderStyles(showReorderHighlight, draggingBtnIndex === index),
                }}
              >
                {canReorderButtons && (
                  <div
                    className="absolute left-0 right-0 flex items-center justify-center nodrag nopan"
                    style={{ top: 0, height: ANSWER_ROW_GRIP_HEIGHT }}
                    onMouseEnter={() => setGripHoveredBtnId(btn.id)}
                    onMouseLeave={() => setGripHoveredBtnId(null)}
                  >
                    <div
                      data-drag-grip
                      className="cursor-grab select-none rotate-90 opacity-50 hover:opacity-100 transition-opacity p-1"
                      onMouseDown={(e) => handleBtnGrabStart(index, e)}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.5 16.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.163-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.326.326.49.718.49 1.177s-.164.851-.49 1.177c-.326.327-.718.49-1.177.49Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.164-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.327.326.49.718.49 1.177s-.163.851-.49 1.177c-.326.327-.718.49-1.177.49ZM7.5 11.666c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.163-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.326.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.164-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.326.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489ZM7.5 6.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.163-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.327.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.164-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.327.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489Z" fill="#8D8A87"/>
                      </svg>
                    </div>
                  </div>
                )}

                  <RequiredFieldGroup
                    showMessage={buttonInvalid}
                    className="w-full"
                  >
                  <NodeInputShell
                    focused={focusedField === 'button' && focusedButtonId === btn.id}
                    className="w-full"
                    padding={0}
                    onBlur={handleFieldBlur}
                    invalid={buttonInvalid}
                    suppressHover={draggingBtnIndex !== null && draggingBtnIndex !== index}
                    hasContent={!!btn.text.trim()}
                    label="Button text"
                    nodeActive={nodeActive}
                    onClear={() =>
                      clearOrRemoveField(
                        btn.text,
                        () => updateButtonText(btn.id, ''),
                        buttons.length >= 2 ? () => removeButton(btn.id) : undefined,
                      )
                    }
                  >
                    <div className={NODE_INPUT_INNER_CLASS} data-answer-content>
                      <input
                        type="text"
                        value={btn.text}
                        onChange={(e) => updateButtonText(btn.id, e.target.value)}
                        placeholder={PLACEHOLDERS.button}
                        className={BUTTON_INPUT_CLASS}
                        data-cta-field
                        onFocus={() => {
                          setGripHoveredBtnId(null)
                          hideToolbar()
                          setFocusedButtonId(btn.id)
                          setFocusedField('button')
                        }}
                        onBlur={(e) => {
                          handleFieldBlur(e as unknown as React.FocusEvent)
                          setFocusedButtonId(null)
                        }}
                      />
                    </div>
                  </NodeInputShell>
                  </RequiredFieldGroup>

                  {buttons.length >= 2 && (
                    <button
                      className="absolute nodrag nopan text-gray-400 hover:text-gray-600"
                      style={{ top: buttons.length >= 2 ? ANSWER_ROW_GRIP_HEIGHT + 10 : 10, right: 0 }}
                      onClick={() => removeButton(btn.id)}
                    >
                      <X size={14} />
                    </button>
                  )}

                {isCta && (
                  <RequiredFieldGroup showMessage={urlInvalid} className="w-full mt-6">
                    <NodeInputShell
                      focused={focusedField === 'url' && focusedButtonId === btn.id}
                      className="nodrag w-full mb-2.5"
                      padding={0}
                      onBlur={handleFieldBlur}
                      invalid={urlInvalid}
                      suppressHover={draggingBtnIndex !== null && draggingBtnIndex !== index}
                      hasContent={!!btn.url.trim()}
                      label="Button URL"
                      nodeActive={nodeActive}
                      onClear={() => updateButtonUrl(btn.id, '')}
                    >
                      <input
                        type="text"
                        value={btn.url}
                        onChange={(e) => updateButtonUrl(btn.id, e.target.value)}
                        placeholder={PLACEHOLDERS.url}
                        className={`${URL_INPUT_CLASS} ${NODE_INPUT_INNER_CLASS}`}
                        data-cta-field
                        onFocus={() => {
                          setGripHoveredBtnId(null)
                          hideToolbar()
                          setFocusedField('url')
                          setFocusedButtonId(btn.id)
                        }}
                        onBlur={(e) => {
                          handleFieldBlur(e as unknown as React.FocusEvent)
                          setFocusedButtonId(null)
                        }}
                      />
                    </NodeInputShell>
                  </RequiredFieldGroup>
                )}
              </div>
              )
            })}
          </div>
          </NodeInputSection>

        </>
      </div>
      </div>
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
