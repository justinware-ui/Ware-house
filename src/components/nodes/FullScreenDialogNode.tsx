import { useState, useCallback, useMemo, useRef, useLayoutEffect, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Handle, Position, type NodeProps, useReactFlow, useUpdateNodeInternals } from '@xyflow/react'
import {
  Copy, X, Bold, Italic, Underline, AlignJustify,
  Image, Pilcrow, ChevronDown, CircleHelp, Monitor, MousePointerClick,
} from 'lucide-react'
import InteractionPreviewModal from '../InteractionPreviewModal'

const AddPhotoIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3.538 13.666c-.337 0-.622-.117-.855-.35a1.163 1.163 0 0 1-.35-.855V3.538c0-.337.117-.622.35-.855.234-.234.518-.35.855-.35H8.538v1H3.538a.2.2 0 0 0-.147.058.2.2 0 0 0-.058.147v8.923a.2.2 0 0 0 .058.148.2.2 0 0 0 .147.057h8.923a.2.2 0 0 0 .148-.057.2.2 0 0 0 .057-.148V7.461h1v4.999c0 .337-.117.622-.35.856-.234.233-.518.35-.856.35H3.538ZM4.256 11.128h7.487l-2.327-3.103-2 2.597-1.417-1.802-1.743 2.308ZM11.333 6V4.666H10V3.666h1.333V2.333h1v1.333h1.334v1h-1.334V6h-1Z" fill="currentColor"/>
  </svg>
)

const AddTooltipIcon = ({ className }: { className?: string }) => (
  <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M7.966 12c.234 0 .431-.081.592-.242.161-.161.242-.358.242-.591 0-.234-.08-.431-.242-.592a.806.806 0 0 0-.592-.242.806.806 0 0 0-.592.242.806.806 0 0 0-.242.592c0 .233.08.43.241.591.162.161.359.242.593.242Zm.1-6.867c.31 0 .56.086.75.258.188.173.283.398.283.675 0 .19-.064.381-.191.575a3.64 3.64 0 0 1-.542.609c-.334.289-.578.567-.734.833-.155.267-.233.534-.233.8 0 .156.058.287.175.392a.498.498 0 0 0 .408.159.498.498 0 0 0 .417-.167.76.76 0 0 0 .233-.417c.034-.189.109-.364.226-.525.116-.161.308-.37.575-.625.344-.323.586-.617.725-.884.139-.266.208-.561.208-.883 0-.567-.213-1.031-.641-1.392-.428-.361-.981-.541-1.659-.541-.466 0-.88.089-1.241.266-.362.178-.642.45-.842.817a.583.583 0 0 0-.084.425c.023.138.1.253.234.341a.523.523 0 0 0 .475.084.556.556 0 0 0 .425-.284 1.04 1.04 0 0 1 .442-.383c.172-.089.369-.134.591-.134ZM8 14.666a6.65 6.65 0 0 1-2.584-.525 6.698 6.698 0 0 1-2.125-1.425 6.677 6.677 0 0 1-1.433-2.116A6.521 6.521 0 0 1 1.333 8c0-.922.175-1.789.525-2.6a6.682 6.682 0 0 1 1.434-2.117A6.692 6.692 0 0 1 5.416 1.858 6.649 6.649 0 0 1 8 1.333c.933 0 1.805.175 2.616.525a6.71 6.71 0 0 1 2.117 1.425A6.711 6.711 0 0 1 14.15 5.4c.344.811.516 1.678.516 2.6 0 .922-.172 1.789-.517 2.6a6.711 6.711 0 0 1-1.416 2.116 6.692 6.692 0 0 1-2.117 1.425 6.598 6.598 0 0 1-2.617.525ZM8 13.333c1.489 0 2.75-.52 3.783-1.558C12.816 10.736 13.333 9.478 13.333 8c0-1.478-.517-2.736-1.55-3.776C10.75 3.186 9.489 2.666 8 2.666c-1.456 0-2.709.52-3.759 1.558C3.191 5.264 2.666 6.522 2.666 8c0 1.478.525 2.736 1.575 3.775 1.05 1.039 2.303 1.558 3.759 1.558Z" fill="currentColor"/>
    <circle cx="14" cy="4" r="2.75" fill="#F7F4F1"/>
    <path d="M13.5 4.5v1.334h1V4.5h1.334v-1H14.5V2.167h-1V3.5h-1.333v1H13.5Z" fill="currentColor"/>
  </svg>
)

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

type FormatOption = 'bold' | 'italic' | 'underline' | 'align' | 'image' | 'paragraph' | 'link'

function FormattingToolbar({
  activeFormats,
  onToggle,
  onDragStart,
  onDragEnd,
  disabledKeys,
}: {
  activeFormats: Set<FormatOption>
  onToggle: (fmt: FormatOption) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  disabledKeys?: Set<FormatOption>
}) {
  const grabRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const el = grabRef.current
    if (!el) return
    const handleDown = () => {
      onDragStart?.()
      const onUp = () => { onDragEnd?.(); window.removeEventListener('pointerup', onUp) }
      window.addEventListener('pointerup', onUp)
    }
    el.addEventListener('pointerdown', handleDown, true)
    return () => el.removeEventListener('pointerdown', handleDown, true)
  }, [onDragStart, onDragEnd])

  const tools: { key: FormatOption; icon?: typeof Bold; custom?: 'addPhoto' | 'addTooltip'; label: string; hasDropdown?: boolean }[] = [
    { key: 'bold', icon: Bold, label: 'Bold' },
    { key: 'italic', icon: Italic, label: 'Italic' },
    { key: 'underline', icon: Underline, label: 'Underline' },
    { key: 'align', icon: AlignJustify, label: 'Alignment' },
    { key: 'image', custom: 'addPhoto', label: 'Add Image' },
    { key: 'paragraph', icon: Pilcrow, label: 'Paragraph Format', hasDropdown: true },
    { key: 'link', custom: 'addTooltip', label: 'Add Tooltip' },
  ]

  return (
    <div
      data-toolbar
      className="absolute -top-14 left-1/2 -translate-x-1/2 z-10 flex items-center rounded-full shadow-lg border border-gray-200 px-2 py-1.5 gap-0.5"
      style={{ backgroundColor: '#F7F4F2' }}
    >
      <svg
        ref={grabRef}
        width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 mx-1 cursor-grab active:cursor-grabbing"
      >
        <path d="M7.5 16.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.163-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.326.326.49.718.49 1.177s-.164.851-.49 1.177c-.326.327-.718.49-1.177.49Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.164-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.327.326.49.718.49 1.177s-.163.851-.49 1.177c-.326.327-.718.49-1.177.49ZM7.5 11.666c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.163-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.326.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.164-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.326.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489ZM7.5 6.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.163-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.327.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.164-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.327.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489Z" fill="#8D8A87"/>
      </svg>

      {tools.map(({ key, icon: Icon, custom, label, hasDropdown }) => {
        const isDisabled = disabledKeys?.has(key)
        return (
          <div key={key} className="relative group/tool nodrag nopan">
            <button
              onClick={() => !isDisabled && onToggle(key)}
              onMouseDown={(e) => e.preventDefault()}
              disabled={isDisabled}
              className={`p-1.5 rounded transition-colors flex items-center gap-0.5 ${
                isDisabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : activeFormats.has(key)
                    ? 'text-brand-500'
                    : 'text-gray-600 hover:text-brand-500'
              }`}
            >
              {custom === 'addPhoto' ? (
                <AddPhotoIcon />
              ) : custom === 'addTooltip' ? (
                <AddTooltipIcon />
              ) : Icon ? (
                <Icon size={16} strokeWidth={2} />
              ) : null}
              {hasDropdown && <ChevronDown size={10} />}
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-gray-800 text-white text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover/tool:opacity-100 transition-opacity">
              {label}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
            </div>
          </div>
        )
      })}

      <div className="w-px h-6 bg-gray-200 mx-1 nodrag nopan" />
      <button className="p-1.5 rounded text-brand-500 hover:bg-brand-50 transition-colors nodrag nopan" onMouseDown={(e) => e.preventDefault()}>
        <svg width="18" height="18" viewBox="2 10 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.4273 11.1084C11.465 10.9066 11.7551 10.9066 11.7928 11.1084L12.2104 13.3465C12.7446 16.2092 14.9911 18.4488 17.8625 18.9814L20.1073 19.3978C20.3098 19.4354 20.3098 19.7246 20.1073 19.7622L17.8625 20.1785C14.9911 20.7111 12.7446 22.9508 12.2104 25.8135L11.7928 28.0515C11.7551 28.2534 11.465 28.2534 11.4273 28.0515L11.0097 25.8135C10.4754 22.9508 8.22901 20.7111 5.35761 20.1785L3.11281 19.7622C2.91031 19.7246 2.91031 19.4354 3.11281 19.3978L5.35761 18.9814C8.22901 18.4488 10.4754 16.2092 11.0097 13.3465L11.4273 11.1084Z" fill="url(#paint0_fsd_sparkle)"/>
          <path d="M19.1688 23.5301C19.1834 23.452 19.2956 23.452 19.3102 23.5301L19.4717 24.3958C19.6784 25.5032 20.5473 26.3695 21.6581 26.5755L22.5264 26.7366C22.6047 26.7511 22.6047 26.863 22.5264 26.8775L21.6581 27.0386C20.5473 27.2446 19.6784 28.111 19.4717 29.2184L19.3102 30.0841C19.2956 30.1622 19.1834 30.1622 19.1688 30.0841L19.0072 29.2184C18.8006 28.111 17.9316 27.2446 16.8209 27.0386L15.9525 26.8775C15.8742 26.863 15.8742 26.7511 15.9525 26.7366L16.8209 26.5755C17.9316 26.3695 18.8006 25.5032 19.0072 24.3958L19.1688 23.5301Z" fill="url(#paint1_fsd_sparkle)"/>
          <defs>
            <linearGradient id="paint0_fsd_sparkle" x1="2.96094" y1="21.4548" x2="22.5851" y2="21.4548" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFB352"/><stop offset="0.5" stopColor="#FC6839"/><stop offset="1" stopColor="#EB2E24"/>
            </linearGradient>
            <linearGradient id="paint1_fsd_sparkle" x1="2.96094" y1="21.4548" x2="22.5851" y2="21.4548" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFB352"/><stop offset="0.5" stopColor="#FC6839"/><stop offset="1" stopColor="#EB2E24"/>
            </linearGradient>
          </defs>
        </svg>
      </button>
    </div>
  )
}

export default function FullScreenDialogNode({ id, data }: NodeProps) {
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
  const [showToolbar, setShowToolbar] = useState(false)
  const [activeFormats, setActiveFormats] = useState<Set<FormatOption>>(new Set())
  const [tooltipMode, setTooltipMode] = useState(false)
  const [tooltips, setTooltips] = useState<Record<string | number, string>>({})
  const [draftTooltips, setDraftTooltips] = useState<Record<string | number, string>>({})
  const [focusedButtonId, setFocusedButtonId] = useState<number | null>(null)
  const [focusedField, setFocusedField] = useState<'message' | 'button' | null>(null)
  const [messageImage, setMessageImage] = useState<AnswerImage | null>(null)
  const [resizingImage, setResizingImage] = useState<{ startX: number; startY: number; startW: number; startH: number } | null>(null)
  const [draggingImage, setDraggingImage] = useState<{ startX: number; startY: number; startOffX: number; startOffY: number } | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const [draggingBtnIndex, setDraggingBtnIndex] = useState<number | null>(null)
  const dragBtnIndexRef = useRef<number | null>(null)
  const buttonRefs = useRef<(HTMLDivElement | null)[]>([])
  const buttonsRef = useRef(buttons)
  buttonsRef.current = buttons
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDraggingNode = useRef(false)
  const tooltipModeRef = useRef(false)
  const suppressSelectionRef = useRef(false)
  const messageRef = useRef<HTMLDivElement>(null)
  const messageContainerRef = useRef<HTMLDivElement>(null)

  const buttonOrderKey = buttons.map((b) => b.id).join(',')
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

  const LINE_LIMIT = 65

  const wrapText = (text: string) => {
    const lines: string[] = []
    for (const existing of text.split('\n')) {
      let remaining = existing
      while (remaining.length > LINE_LIMIT) {
        lines.push(remaining.slice(0, LINE_LIMIT))
        remaining = remaining.slice(LINE_LIMIT)
      }
      lines.push(remaining)
    }
    return lines.join('\n')
  }

  const addButton = () =>
    setButtons((prev) => [...prev, { id: Date.now(), text: '', url: '' }])

  const removeButton = (btnId: number) =>
    setButtons((prev) => prev.filter((b) => b.id !== btnId))

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
    if (fmt === 'link') {
      setDraftTooltips({ ...tooltips })
      tooltipModeRef.current = true
      setTooltipMode(true)
      return
    }
    if (fmt === 'bold' || fmt === 'italic' || fmt === 'underline') {
      document.execCommand(fmt)
      setActiveFormats((prev) => {
        const next = new Set(prev)
        if (document.queryCommandState(fmt)) next.add(fmt)
        else next.delete(fmt)
        return next
      })
      return
    }
    setActiveFormats((prev) => {
      const next = new Set(prev)
      if (next.has(fmt)) next.delete(fmt)
      else next.add(fmt)
      return next
    })
  }, [tooltips])

  useEffect(() => {
    if (!showToolbar) return
    const handleSelectionChange = () => {
      if (suppressSelectionRef.current) return
      const sel = window.getSelection()
      const anchor = sel?.anchorNode
      if (!anchor || !(anchor instanceof Node)) return
      const el = anchor.nodeType === 3 ? anchor.parentElement : anchor as Element
      if (!el?.closest?.('[contenteditable]')) {
        setActiveFormats(new Set())
        return
      }
      setActiveFormats((prev) => {
        const next = new Set<FormatOption>()
        for (const f of ['bold', 'italic', 'underline'] as FormatOption[]) {
          if (document.queryCommandState(f)) next.add(f)
        }
        if (next.size !== prev.size || [...next].some((v) => !prev.has(v))) return next
        return prev
      })
    }
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [showToolbar])

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail !== id) setShowToolbar(false)
    }
    document.addEventListener('toolbar-open', handler)
    return () => document.removeEventListener('toolbar-open', handler)
  }, [id])

  const handleFieldFocus = () => {
    suppressSelectionRef.current = true
    setActiveFormats(new Set())
    setShowToolbar(true)
    document.dispatchEvent(new CustomEvent('toolbar-open', { detail: id }))
    requestAnimationFrame(() => { suppressSelectionRef.current = false })
  }

  const handleFieldBlur = (e: React.FocusEvent) => {
    if (isDraggingNode.current) return
    requestAnimationFrame(() => {
      if (isDraggingNode.current) return
      if (tooltipModeRef.current) return
      const related = e.relatedTarget as HTMLElement | null
      if (related?.closest('[data-toolbar]') || related?.closest('[data-cta-field]') || related?.closest('[data-answer-content]')) return
      setShowToolbar(false)
    })
  }

  const MAX_CHARS = 65
  const MIN_WIDTH = 220
  const CARD_CHROME = 100
  const measureRef = useRef<HTMLSpanElement>(null)
  const [cardWidth, setCardWidth] = useState(MIN_WIDTH)
  const [manualWidth, setManualWidth] = useState<number | null>(null)
  const resizing = useRef<{ startX: number; startW: number } | null>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizing.current) return
      const newW = Math.max(MIN_WIDTH, resizing.current.startW + (e.clientX - resizing.current.startX))
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

  const longestLine = useMemo(() => {
    const allTexts = [
      header || 'Type your header here',
      message || 'Type your message here',
      ...buttons.map((b) => b.text || 'Type your button text here'),
      ...(isCta ? buttons.map((b) => b.url || 'Type button URL here') : []),
    ]
    const allLines = allTexts.flatMap((t) => t.split('\n'))
    const longest = allLines.reduce((a, b) => (a.length > b.length ? a : b), '')
    return longest.length > MAX_CHARS ? longest.slice(0, MAX_CHARS) : longest
  }, [header, message, buttons, isCta])

  useLayoutEffect(() => {
    if (!measureRef.current) return
    measureRef.current.textContent = longestLine
    setCardWidth(Math.max(measureRef.current.offsetWidth + CARD_CHROME, MIN_WIDTH))
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

  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm relative transition-[width,box-shadow,border-color] duration-150"
      style={{ width: tooltipMode ? Math.max(manualWidth ?? cardWidth, 320) : (manualWidth ?? cardWidth) }}
    >
      <span
        ref={measureRef}
        className="invisible absolute whitespace-nowrap text-base font-semibold pointer-events-none"
        aria-hidden
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-brand-500 !border-brand-500"
        style={{ width: 12, height: 12, left: 0 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-brand-500 !border-brand-500"
        style={{ width: 12, height: 12, right: 0 }}
      />

      {showToolbar && !tooltipMode && (
        <FormattingToolbar
          activeFormats={activeFormats}
          onToggle={toggleFormat}
          onDragStart={() => { isDraggingNode.current = true }}
          onDragEnd={() => { isDraggingNode.current = false }}
          disabledKeys={message.trim() || buttons.some((b) => b.text.trim() || b.image) ? undefined : new Set<FormatOption>(['link'])}
        />
      )}

      {/* Close button */}
      <button
        className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white hover:bg-gray-200 border-2 border-white flex items-center justify-center transition-colors shadow-sm"
        onClick={() => {
          setNodes((nds) => nds.filter((n) => n.id !== id))
          setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
        }}
      >
        <X size={14} className="text-gray-600" />
      </button>

      {/* Preview & Duplicate — vertically aligned */}
      <div className="absolute top-3 right-6 flex items-center" style={{ gap: 10 }}>
        <button className="hover:opacity-70 transition-opacity" onClick={() => setShowPreview(true)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <mask id={`mask_eye_fsd_${id}`} style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="18" height="18"><rect width="18" height="18" fill="#D9D9D9"/></mask>
            <g mask={`url(#mask_eye_fsd_${id})`}><path d="M8.99961 12C9.93711 12 10.7341 11.672 11.3906 11.016C12.0466 10.3595 12.3746 9.5625 12.3746 8.625C12.3746 7.6875 12.0466 6.8905 11.3906 6.234C10.7341 5.578 9.93711 5.25 8.99961 5.25C8.06211 5.25 7.26511 5.578 6.60861 6.234C5.95261 6.8905 5.62461 7.6875 5.62461 8.625C5.62461 9.5625 5.95261 10.3595 6.60861 11.016C7.26511 11.672 8.06211 12 8.99961 12ZM8.99961 10.65C8.43711 10.65 7.95911 10.453 7.56561 10.059C7.17161 9.6655 6.97461 9.1875 6.97461 8.625C6.97461 8.0625 7.17161 7.58425 7.56561 7.19025C7.95911 6.79675 8.43711 6.6 8.99961 6.6C9.56211 6.6 10.0404 6.79675 10.4344 7.19025C10.8279 7.58425 11.0246 8.0625 11.0246 8.625C11.0246 9.1875 10.8279 9.6655 10.4344 10.059C10.0404 10.453 9.56211 10.65 8.99961 10.65ZM8.99961 14.25C7.26211 14.25 5.67461 13.7908 4.23711 12.8723C2.79961 11.9533 1.71211 10.7125 0.974609 9.15C0.937109 9.0875 0.912109 9.00925 0.899609 8.91525C0.887109 8.82175 0.880859 8.725 0.880859 8.625C0.880859 8.525 0.887109 8.428 0.899609 8.334C0.912109 8.2405 0.937109 8.1625 0.974609 8.1C1.71211 6.5375 2.79961 5.297 4.23711 4.3785C5.67461 3.4595 7.26211 3 8.99961 3C10.7371 3 12.3246 3.4595 13.7621 4.3785C15.1996 5.297 16.2871 6.5375 17.0246 8.1C17.0621 8.1625 17.0871 8.2405 17.0996 8.334C17.1121 8.428 17.1184 8.525 17.1184 8.625C17.1184 8.725 17.1121 8.82175 17.0996 8.91525C17.0871 9.00925 17.0621 9.0875 17.0246 9.15C16.2871 10.7125 15.1996 11.9533 13.7621 12.8723C12.3246 13.7908 10.7371 14.25 8.99961 14.25ZM8.99961 12.75C10.4121 12.75 11.7091 12.378 12.8906 11.634C14.0716 10.8905 14.9746 9.8875 15.5996 8.625C14.9746 7.3625 14.0716 6.35925 12.8906 5.61525C11.7091 4.87175 10.4121 4.5 8.99961 4.5C7.58711 4.5 6.29011 4.87175 5.10861 5.61525C3.92761 6.35925 3.02461 7.3625 2.39961 8.625C3.02461 9.8875 3.92761 10.8905 5.10861 11.634C6.29011 12.378 7.58711 12.75 8.99961 12.75Z" fill="#293748"/></g>
          </svg>
        </button>
        <button className="hover:opacity-70 transition-opacity" onClick={handleDuplicate}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <mask id={`mask_dup_fsd_${id}`} style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><rect width="20" height="20" fill="#D9D9D9"/></mask>
            <g mask={`url(#mask_dup_fsd_${id})`}><path d="M7.5 15C7.04167 15 6.64944 14.8369 6.32333 14.5108C5.99667 14.1842 5.83333 13.7917 5.83333 13.3333V3.33332C5.83333 2.87499 5.99667 2.48249 6.32333 2.15582C6.64944 1.82971 7.04167 1.66666 7.5 1.66666H15C15.4583 1.66666 15.8508 1.82971 16.1775 2.15582C16.5036 2.48249 16.6667 2.87499 16.6667 3.33332V13.3333C16.6667 13.7917 16.5036 14.1842 16.1775 14.5108C15.8508 14.8369 15.4583 15 15 15H7.5ZM7.5 13.3333H15V3.33332H7.5V13.3333ZM4.16667 18.3333C3.70833 18.3333 3.31583 18.1703 2.98917 17.8442C2.66306 17.5175 2.5 17.125 2.5 16.6667V5.83332C2.5 5.59721 2.58 5.39916 2.74 5.23916C2.89944 5.07971 3.09722 4.99999 3.33333 4.99999C3.56944 4.99999 3.7675 5.07971 3.9275 5.23916C4.08694 5.39916 4.16667 5.59721 4.16667 5.83332V16.6667H12.5C12.7361 16.6667 12.9342 16.7467 13.0942 16.9067C13.2536 17.0661 13.3333 17.2639 13.3333 17.5C13.3333 17.7361 13.2536 17.9339 13.0942 18.0933C12.9342 18.2533 12.7361 18.3333 12.5 18.3333H4.16667Z" fill="#293748"/></g>
          </svg>
        </button>
      </div>

      {showPreview && (
        <InteractionPreviewModal
          data={{ type: isCta ? 'cta' : 'fullscreen', header, message, buttons: buttons.map((b) => b.text), buttonUrls: isCta ? buttons.map((b) => b.url) : undefined }}
          onClose={() => setShowPreview(false)}
        />
      )}

      <div className="px-1 pt-4 pb-3 flex items-center gap-1.5">
        {isCta ? (
          <MousePointerClick size={14} className="text-[#FC6839] shrink-0" />
        ) : (
          <Monitor size={14} className="text-[#8b5cf6] shrink-0" />
        )}
        <span className="text-xs font-medium text-gray-500">{isCta ? 'Call to action' : 'Full screen dialog'}</span>
      </div>

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
                  <div className="flex items-start gap-3 pb-2 border-b border-gray-200 focus-within:border-brand-400 transition-colors">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={draftTooltips['message'] ?? ''}
                        onChange={(e) =>
                          setDraftTooltips((prev) => ({ ...prev, message: e.target.value }))
                        }
                        placeholder="Type your tool-tip here"
                        className="nodrag w-full text-sm text-gray-800 placeholder:text-[#FC6839] outline-none bg-transparent"
                      />
                    </div>
                    <button
                      className="text-gray-400 hover:text-gray-600 shrink-0 mt-0.5"
                      onClick={() =>
                        setDraftTooltips((prev) => {
                          const next = { ...prev }
                          delete next['message']
                          return next
                        })
                      }
                    >
                      <X size={14} />
                    </button>
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
          {/* Header field */}
          <div className="mb-7 px-1" style={{ marginTop: 6 }}>
            <input
              type="text"
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              placeholder="Type your header here"
              className="nodrag w-full text-base font-semibold italic text-gray-800 placeholder:text-gray-800 placeholder:font-semibold placeholder:italic placeholder:opacity-100 focus:placeholder:opacity-60 outline-none bg-transparent"
              data-cta-field
              onFocus={handleFieldFocus}
              onBlur={handleFieldBlur}
            />
          </div>

          {/* Message body */}
          <div ref={messageContainerRef} className="mb-6 pb-2 border-b border-gray-200 focus-within:border-brand-400 transition-colors flex items-start gap-2" data-answer-content>
            <div className="flex-1 min-w-0 overflow-hidden">
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
                data-placeholder="Type your message here"
                className={`nodrag text-sm text-gray-800 outline-none min-h-[1.5em] ${!message ? 'before:content-[attr(data-placeholder)] before:pointer-events-none before:text-[#FC6839] before:opacity-100 focus:before:opacity-60' : ''}`}
                style={{ wordBreak: 'break-word' }}
                onInput={(e) => {
                  const el = e.target as HTMLDivElement
                  setMessage(el.textContent || '')
                }}
                onFocus={() => { handleFieldFocus(); setFocusedField('message') }}
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

          {/* Button fields */}
          <div className="flex flex-col gap-5" style={{ paddingBottom: buttons.length >= 2 ? 16 : 0 }}>
            {buttons.map((btn, index) => (
              <div
                key={btn.id}
                ref={(el) => {
                  buttonRefs.current[index] = el
                  buttonRefs.current.length = buttons.length
                }}
                className={`flex flex-col transition-opacity ${
                  draggingBtnIndex !== null && draggingBtnIndex !== index ? 'opacity-50' : ''
                }`}
              >
                <div
                  className="nodrag flex items-center gap-3 relative pb-2 border-b border-gray-200 focus-within:border-brand-400 transition-colors"
                >
                  {buttons.length >= 2 && (
                    <div
                      className="nodrag nopan shrink-0 cursor-grab select-none p-1"
                      onMouseDown={(e) => handleBtnGrabStart(index, e)}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.5 16.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.163-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.326.326.49.718.49 1.177s-.164.851-.49 1.177c-.326.327-.718.49-1.177.49Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.164-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.327.326.49.718.49 1.177s-.163.851-.49 1.177c-.326.327-.718.49-1.177.49ZM7.5 11.666c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.163-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.326.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.164-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.326.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489ZM7.5 6.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.163-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.327.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.164-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.327.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489Z" fill="#8D8A87"/>
                      </svg>
                    </div>
                  )}

                  <div className="flex-1 min-w-0" data-answer-content>
                    <input
                      type="text"
                      value={btn.text}
                      onChange={(e) => updateButtonText(btn.id, e.target.value)}
                      placeholder="Type your button text here"
                      className={`nodrag w-full text-sm outline-none bg-transparent ${
                        index === 0
                          ? 'text-[#FC6839] placeholder:text-[#FC6839] placeholder:opacity-100 focus:placeholder:opacity-60'
                          : 'text-gray-500 placeholder:text-gray-400 placeholder:opacity-100 focus:placeholder:opacity-60'
                      }`}
                      data-cta-field
                      onFocus={() => { handleFieldFocus(); setFocusedButtonId(btn.id); setFocusedField('button') }}
                      onBlur={(e) => {
                        handleFieldBlur(e as unknown as React.FocusEvent)
                        setFocusedButtonId(null); setFocusedField(null)
                      }}
                    />
                  </div>

                  <div className="flex items-center shrink-0" style={{ gap: 10, marginTop: 2 }}>
                    {buttons.length >= 2 && (
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => removeButton(btn.id)}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {isCta && (
                  <div className="nodrag pb-2 border-b border-gray-200 focus-within:border-brand-400 transition-colors" style={{ marginTop: 24 }}>
                    <input
                      type="text"
                      value={btn.url}
                      onChange={(e) => updateButtonUrl(btn.id, e.target.value)}
                      placeholder="Type button URL here"
                      className="nodrag w-full text-sm text-gray-800 placeholder:text-[#FC6839] placeholder:opacity-100 focus:placeholder:opacity-60 outline-none bg-transparent"
                      data-cta-field
                      onFocus={handleFieldFocus}
                      onBlur={handleFieldBlur}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add button — only for CTA variant */}
          {isCta && buttons.length < 2 && (
            <div className="flex justify-end mt-4">
              <button
                onClick={addButton}
                className="group/add nodrag nopan"
              >
                {/* Default state */}
                <svg className="block group-hover/add:hidden" width="117" height="32" viewBox="0 0 117 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.964 18.404H14.628L14.076 20H12.312L15.324 11.612H17.28L20.292 20H18.516L17.964 18.404ZM17.508 17.06L16.296 13.556L15.084 17.06H17.508ZM20.9858 16.652C20.9858 15.98 21.1178 15.384 21.3818 14.864C21.6538 14.344 22.0218 13.944 22.4858 13.664C22.9498 13.384 23.4658 13.244 24.0338 13.244C24.4658 13.244 24.8778 13.34 25.2698 13.532C25.6618 13.716 25.9738 13.964 26.2058 14.276V11.12H27.9098V20H26.2058V19.016C25.9978 19.344 25.7058 19.608 25.3298 19.808C24.9538 20.008 24.5178 20.108 24.0218 20.108C23.4618 20.108 22.9498 19.964 22.4858 19.676C22.0218 19.388 21.6538 18.984 21.3818 18.464C21.1178 17.936 20.9858 17.332 20.9858 16.652ZM26.2178 16.676C26.2178 16.268 26.1378 15.92 25.9778 15.632C25.8178 15.336 25.6018 15.112 25.3298 14.96C25.0578 14.8 24.7658 14.72 24.4538 14.72C24.1418 14.72 23.8538 14.796 23.5898 14.948C23.3258 15.1 23.1098 15.324 22.9418 15.62C22.7818 15.908 22.7018 16.252 22.7018 16.652C22.7018 17.052 22.7818 17.404 22.9418 17.708C23.1098 18.004 23.3258 18.232 23.5898 18.392C23.8618 18.552 24.1498 18.632 24.4538 18.632C24.7658 18.632 25.0578 18.556 25.3298 18.404C25.6018 18.244 25.8178 18.02 25.9778 17.732C26.1378 17.436 26.2178 17.084 26.2178 16.676ZM29.1187 16.652C29.1187 15.98 29.2507 15.384 29.5147 14.864C29.7867 14.344 30.1547 13.944 30.6187 13.664C31.0827 13.384 31.5987 13.244 32.1667 13.244C32.5987 13.244 33.0107 13.34 33.4027 13.532C33.7947 13.716 34.1067 13.964 34.3387 14.276V11.12H36.0427V20H34.3387V19.016C34.1307 19.344 33.8387 19.608 33.4627 19.808C33.0867 20.008 32.6507 20.108 32.1547 20.108C31.5947 20.108 31.0827 19.964 30.6187 19.676C30.1547 19.388 29.7867 18.984 29.5147 18.464C29.2507 17.936 29.1187 17.332 29.1187 16.652ZM34.3507 16.676C34.3507 16.268 34.2707 15.92 34.1107 15.632C33.9507 15.336 33.7347 15.112 33.4627 14.96C33.1907 14.8 32.8987 14.72 32.5867 14.72C32.2747 14.72 31.9867 14.796 31.7227 14.948C31.4587 15.1 31.2427 15.324 31.0747 15.62C30.9147 15.908 30.8347 16.252 30.8347 16.652C30.8347 17.052 30.9147 17.404 31.0747 17.708C31.2427 18.004 31.4587 18.232 31.7227 18.392C31.9947 18.552 32.2827 18.632 32.5867 18.632C32.8987 18.632 33.1907 18.556 33.4627 18.404C33.7347 18.244 33.9507 18.02 34.1107 17.732C34.2707 17.436 34.3507 17.084 34.3507 16.676ZM45.2948 15.704C45.7668 15.792 46.1548 16.028 46.4588 16.412C46.7628 16.796 46.9148 17.236 46.9148 17.732C46.9148 18.18 46.8028 18.576 46.5788 18.92C46.3628 19.256 46.0468 19.52 45.6308 19.712C45.2148 19.904 44.7228 20 44.1548 20H40.5428V11.624H43.9988C44.5668 11.624 45.0548 11.716 45.4628 11.9C45.8788 12.084 46.1908 12.34 46.3988 12.668C46.6148 12.996 46.7228 13.368 46.7228 13.784C46.7228 14.272 46.5908 14.68 46.3268 15.008C46.0708 15.336 45.7268 15.568 45.2948 15.704ZM42.2228 15.08H43.7588C44.1588 15.08 44.4668 14.992 44.6828 14.816C44.8988 14.632 45.0068 14.372 45.0068 14.036C45.0068 13.7 44.8988 13.44 44.6828 13.256C44.4668 13.072 44.1588 12.98 43.7588 12.98H42.2228V15.08ZM43.9148 18.632C44.3228 18.632 44.6388 18.536 44.8628 18.344C45.0948 18.152 45.2108 17.88 45.2108 17.528C45.2108 17.168 45.0908 16.888 44.8508 16.688C44.6108 16.48 44.2868 16.376 43.8788 16.376H42.2228V18.632H43.9148ZM54.5298 13.352V20H52.8378V19.16C52.6218 19.448 52.3378 19.676 51.9858 19.844C51.6418 20.004 51.2658 20.084 50.8578 20.084C50.3378 20.084 49.8778 19.976 49.4778 19.76C49.0778 19.536 48.7618 19.212 48.5298 18.788C48.3058 18.356 48.1938 17.844 48.1938 17.252V13.352H49.8738V17.012C49.8738 17.54 50.0058 17.948 50.2698 18.236C50.5338 18.516 50.8938 18.656 51.3498 18.656C51.8138 18.656 52.1778 18.516 52.4418 18.236C52.7058 17.948 52.8378 17.54 52.8378 17.012V13.352H54.5298ZM58.1434 14.732V17.948C58.1434 18.172 58.1954 18.336 58.2994 18.44C58.4114 18.536 58.5954 18.584 58.8514 18.584H59.6314V20H58.5754C57.1594 20 56.4514 19.312 56.4514 17.936V14.732H55.6594V13.352H56.4514V11.708H58.1434V13.352H59.6314V14.732H58.1434ZM62.7957 14.732V17.948C62.7957 18.172 62.8477 18.336 62.9517 18.44C63.0637 18.536 63.2477 18.584 63.5037 18.584H64.2837V20H63.2277C61.8117 20 61.1037 19.312 61.1037 17.936V14.732H60.3117V13.352H61.1037V11.708H62.7957V13.352H64.2837V14.732H62.7957ZM68.4441 20.108C67.8041 20.108 67.2281 19.968 66.7161 19.688C66.2041 19.4 65.8001 18.996 65.5041 18.476C65.2161 17.956 65.0721 17.356 65.0721 16.676C65.0721 15.996 65.2201 15.396 65.5161 14.876C65.8201 14.356 66.2321 13.956 66.7521 13.676C67.2721 13.388 67.8521 13.244 68.4921 13.244C69.1321 13.244 69.7121 13.388 70.2321 13.676C70.7521 13.956 71.1601 14.356 71.4561 14.876C71.7601 15.396 71.9121 15.996 71.9121 16.676C71.9121 17.356 71.7561 17.956 71.4441 18.476C71.1401 18.996 70.7241 19.4 70.1961 19.688C69.6761 19.968 69.0921 20.108 68.4441 20.108ZM68.4441 18.644C68.7481 18.644 69.0321 18.572 69.2961 18.428C69.5681 18.276 69.7841 18.052 69.9441 17.756C70.1041 17.46 70.1841 17.1 70.1841 16.676C70.1841 16.044 70.0161 15.56 69.6801 15.224C69.3521 14.88 68.9481 14.708 68.4681 14.708C67.9881 14.708 67.5841 14.88 67.2561 15.224C66.9361 15.56 66.7761 16.044 66.7761 16.676C66.7761 17.308 66.9321 17.796 67.2441 18.14C67.5641 18.476 67.9641 18.644 68.4441 18.644ZM76.8284 13.256C77.6204 13.256 78.2604 13.508 78.7484 14.012C79.2364 14.508 79.4804 15.204 79.4804 16.1V20H77.8004V16.328C77.8004 15.8 77.6684 15.396 77.4044 15.116C77.1404 14.828 76.7804 14.684 76.3244 14.684C75.8604 14.684 75.4924 14.828 75.2204 15.116C74.9564 15.396 74.8244 15.8 74.8244 16.328V20H73.1444V13.352H74.8244V14.18C75.0484 13.892 75.3324 13.668 75.6764 13.508C76.0284 13.34 76.4124 13.256 76.8284 13.256Z" fill="#FC6839"/>
                  <mask id="mask0_add_btn_def" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="89" y="8" width="16" height="16"><rect x="89" y="8" width="16" height="16" fill="#D9D9D9"/></mask>
                  <g mask="url(#mask0_add_btn_def)"><path d="M97.0002 20.6668C96.8113 20.6668 96.6531 20.6028 96.5255 20.4748C96.3975 20.3473 96.3335 20.1891 96.3335 20.0002V16.6668H93.0002C92.8113 16.6668 92.6528 16.6028 92.5248 16.4748C92.3973 16.3473 92.3335 16.1891 92.3335 16.0002C92.3335 15.8113 92.3973 15.6528 92.5248 15.5248C92.6528 15.3973 92.8113 15.3335 93.0002 15.3335H96.3335V12.0002C96.3335 11.8113 96.3975 11.6528 96.5255 11.5248C96.6531 11.3973 96.8113 11.3335 97.0002 11.3335C97.1891 11.3335 97.3475 11.3973 97.4755 11.5248C97.6031 11.6528 97.6668 11.8113 97.6668 12.0002V15.3335H101C101.189 15.3335 101.347 15.3973 101.475 15.5248C101.603 15.6528 101.667 15.8113 101.667 16.0002C101.667 16.1891 101.603 16.3473 101.475 16.4748C101.347 16.6028 101.189 16.6668 101 16.6668H97.6668V20.0002C97.6668 20.1891 97.6031 20.3473 97.4755 20.4748C97.3475 20.6028 97.1891 20.6668 97.0002 20.6668Z" fill="#FC6839"/></g>
                </svg>
                {/* Hover state */}
                <svg className="hidden group-hover/add:block" width="117" height="32" viewBox="0 0 117 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="117" height="32" rx="16" fill="#FC6839" fillOpacity="0.15"/>
                  <path d="M17.964 18.404H14.628L14.076 20H12.312L15.324 11.612H17.28L20.292 20H18.516L17.964 18.404ZM17.508 17.06L16.296 13.556L15.084 17.06H17.508ZM20.9858 16.652C20.9858 15.98 21.1178 15.384 21.3818 14.864C21.6538 14.344 22.0218 13.944 22.4858 13.664C22.9498 13.384 23.4658 13.244 24.0338 13.244C24.4658 13.244 24.8778 13.34 25.2698 13.532C25.6618 13.716 25.9738 13.964 26.2058 14.276V11.12H27.9098V20H26.2058V19.016C25.9978 19.344 25.7058 19.608 25.3298 19.808C24.9538 20.008 24.5178 20.108 24.0218 20.108C23.4618 20.108 22.9498 19.964 22.4858 19.676C22.0218 19.388 21.6538 18.984 21.3818 18.464C21.1178 17.936 20.9858 17.332 20.9858 16.652ZM26.2178 16.676C26.2178 16.268 26.1378 15.92 25.9778 15.632C25.8178 15.336 25.6018 15.112 25.3298 14.96C25.0578 14.8 24.7658 14.72 24.4538 14.72C24.1418 14.72 23.8538 14.796 23.5898 14.948C23.3258 15.1 23.1098 15.324 22.9418 15.62C22.7818 15.908 22.7018 16.252 22.7018 16.652C22.7018 17.052 22.7818 17.404 22.9418 17.708C23.1098 18.004 23.3258 18.232 23.5898 18.392C23.8618 18.552 24.1498 18.632 24.4538 18.632C24.7658 18.632 25.0578 18.556 25.3298 18.404C25.6018 18.244 25.8178 18.02 25.9778 17.732C26.1378 17.436 26.2178 17.084 26.2178 16.676ZM29.1187 16.652C29.1187 15.98 29.2507 15.384 29.5147 14.864C29.7867 14.344 30.1547 13.944 30.6187 13.664C31.0827 13.384 31.5987 13.244 32.1667 13.244C32.5987 13.244 33.0107 13.34 33.4027 13.532C33.7947 13.716 34.1067 13.964 34.3387 14.276V11.12H36.0427V20H34.3387V19.016C34.1307 19.344 33.8387 19.608 33.4627 19.808C33.0867 20.008 32.6507 20.108 32.1547 20.108C31.5947 20.108 31.0827 19.964 30.6187 19.676C30.1547 19.388 29.7867 18.984 29.5147 18.464C29.2507 17.936 29.1187 17.332 29.1187 16.652ZM34.3507 16.676C34.3507 16.268 34.2707 15.92 34.1107 15.632C33.9507 15.336 33.7347 15.112 33.4627 14.96C33.1907 14.8 32.8987 14.72 32.5867 14.72C32.2747 14.72 31.9867 14.796 31.7227 14.948C31.4587 15.1 31.2427 15.324 31.0747 15.62C30.9147 15.908 30.8347 16.252 30.8347 16.652C30.8347 17.052 30.9147 17.404 31.0747 17.708C31.2427 18.004 31.4587 18.232 31.7227 18.392C31.9947 18.552 32.2827 18.632 32.5867 18.632C32.8987 18.632 33.1907 18.556 33.4627 18.404C33.7347 18.244 33.9507 18.02 34.1107 17.732C34.2707 17.436 34.3507 17.084 34.3507 16.676ZM45.2948 15.704C45.7668 15.792 46.1548 16.028 46.4588 16.412C46.7628 16.796 46.9148 17.236 46.9148 17.732C46.9148 18.18 46.8028 18.576 46.5788 18.92C46.3628 19.256 46.0468 19.52 45.6308 19.712C45.2148 19.904 44.7228 20 44.1548 20H40.5428V11.624H43.9988C44.5668 11.624 45.0548 11.716 45.4628 11.9C45.8788 12.084 46.1908 12.34 46.3988 12.668C46.6148 12.996 46.7228 13.368 46.7228 13.784C46.7228 14.272 46.5908 14.68 46.3268 15.008C46.0708 15.336 45.7268 15.568 45.2948 15.704ZM42.2228 15.08H43.7588C44.1588 15.08 44.4668 14.992 44.6828 14.816C44.8988 14.632 45.0068 14.372 45.0068 14.036C45.0068 13.7 44.8988 13.44 44.6828 13.256C44.4668 13.072 44.1588 12.98 43.7588 12.98H42.2228V15.08ZM43.9148 18.632C44.3228 18.632 44.6388 18.536 44.8628 18.344C45.0948 18.152 45.2108 17.88 45.2108 17.528C45.2108 17.168 45.0908 16.888 44.8508 16.688C44.6108 16.48 44.2868 16.376 43.8788 16.376H42.2228V18.632H43.9148ZM54.5298 13.352V20H52.8378V19.16C52.6218 19.448 52.3378 19.676 51.9858 19.844C51.6418 20.004 51.2658 20.084 50.8578 20.084C50.3378 20.084 49.8778 19.976 49.4778 19.76C49.0778 19.536 48.7618 19.212 48.5298 18.788C48.3058 18.356 48.1938 17.844 48.1938 17.252V13.352H49.8738V17.012C49.8738 17.54 50.0058 17.948 50.2698 18.236C50.5338 18.516 50.8938 18.656 51.3498 18.656C51.8138 18.656 52.1778 18.516 52.4418 18.236C52.7058 17.948 52.8378 17.54 52.8378 17.012V13.352H54.5298ZM58.1434 14.732V17.948C58.1434 18.172 58.1954 18.336 58.2994 18.44C58.4114 18.536 58.5954 18.584 58.8514 18.584H59.6314V20H58.5754C57.1594 20 56.4514 19.312 56.4514 17.936V14.732H55.6594V13.352H56.4514V11.708H58.1434V13.352H59.6314V14.732H58.1434ZM62.7957 14.732V17.948C62.7957 18.172 62.8477 18.336 62.9517 18.44C63.0637 18.536 63.2477 18.584 63.5037 18.584H64.2837V20H63.2277C61.8117 20 61.1037 19.312 61.1037 17.936V14.732H60.3117V13.352H61.1037V11.708H62.7957V13.352H64.2837V14.732H62.7957ZM68.4441 20.108C67.8041 20.108 67.2281 19.968 66.7161 19.688C66.2041 19.4 65.8001 18.996 65.5041 18.476C65.2161 17.956 65.0721 17.356 65.0721 16.676C65.0721 15.996 65.2201 15.396 65.5161 14.876C65.8201 14.356 66.2321 13.956 66.7521 13.676C67.2721 13.388 67.8521 13.244 68.4921 13.244C69.1321 13.244 69.7121 13.388 70.2321 13.676C70.7521 13.956 71.1601 14.356 71.4561 14.876C71.7601 15.396 71.9121 15.996 71.9121 16.676C71.9121 17.356 71.7561 17.956 71.4441 18.476C71.1401 18.996 70.7241 19.4 70.1961 19.688C69.6761 19.968 69.0921 20.108 68.4441 20.108ZM68.4441 18.644C68.7481 18.644 69.0321 18.572 69.2961 18.428C69.5681 18.276 69.7841 18.052 69.9441 17.756C70.1041 17.46 70.1841 17.1 70.1841 16.676C70.1841 16.044 70.0161 15.56 69.6801 15.224C69.3521 14.88 68.9481 14.708 68.4681 14.708C67.9881 14.708 67.5841 14.88 67.2561 15.224C66.9361 15.56 66.7761 16.044 66.7761 16.676C66.7761 17.308 66.9321 17.796 67.2441 18.14C67.5641 18.476 67.9641 18.644 68.4441 18.644ZM76.8284 13.256C77.6204 13.256 78.2604 13.508 78.7484 14.012C79.2364 14.508 79.4804 15.204 79.4804 16.1V20H77.8004V16.328C77.8004 15.8 77.6684 15.396 77.4044 15.116C77.1404 14.828 76.7804 14.684 76.3244 14.684C75.8604 14.684 75.4924 14.828 75.2204 15.116C74.9564 15.396 74.8244 15.8 74.8244 16.328V20H73.1444V13.352H74.8244V14.18C75.0484 13.892 75.3324 13.668 75.6764 13.508C76.0284 13.34 76.4124 13.256 76.8284 13.256Z" fill="#F44C10"/>
                  <mask id="mask0_add_btn_hov" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="89" y="8" width="16" height="16"><rect x="89" y="8" width="16" height="16" fill="#D9D9D9"/></mask>
                  <g mask="url(#mask0_add_btn_hov)"><path d="M97.0002 20.6668C96.8113 20.6668 96.6531 20.6028 96.5255 20.4748C96.3975 20.3473 96.3335 20.1891 96.3335 20.0002V16.6668H93.0002C92.8113 16.6668 92.6528 16.6028 92.5248 16.4748C92.3973 16.3473 92.3335 16.1891 92.3335 16.0002C92.3335 15.8113 92.3973 15.6528 92.5248 15.5248C92.6528 15.3973 92.8113 15.3335 93.0002 15.3335H96.3335V12.0002C96.3335 11.8113 96.3975 11.6528 96.5255 11.5248C96.6531 11.3973 96.8113 11.3335 97.0002 11.3335C97.1891 11.3335 97.3475 11.3973 97.4755 11.5248C97.6031 11.6528 97.6668 11.8113 97.6668 12.0002V15.3335H101C101.189 15.3335 101.347 15.3973 101.475 15.5248C101.603 15.6528 101.667 15.8113 101.667 16.0002C101.667 16.1891 101.603 16.3473 101.475 16.4748C101.347 16.6028 101.189 16.6668 101 16.6668H97.6668V20.0002C97.6668 20.1891 97.6031 20.3473 97.4755 20.4748C97.3475 20.6028 97.1891 20.6668 97.0002 20.6668Z" fill="#F44C10"/></g>
                </svg>
              </button>
            </div>
          )}
        </>
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

      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 w-2 h-full cursor-ew-resize nodrag nopan"
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
