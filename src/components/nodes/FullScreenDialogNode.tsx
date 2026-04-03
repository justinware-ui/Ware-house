import { useState, useCallback, useMemo, useRef, useLayoutEffect, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Handle, Position, type NodeProps, useReactFlow, useUpdateNodeInternals } from '@xyflow/react'
import {
  Copy, X, Plus, Bold, Italic, Underline, AlignJustify,
  Image, Pilcrow, ChevronDown, CircleHelp, Monitor,
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
  const typedData = data as { header?: string; message?: string }
  const [header, setHeader] = useState(typedData.header ?? '')
  const [message, setMessage] = useState(typedData.message ?? '')
  const [buttons, setButtons] = useState<ButtonEntry[]>([{ id: 0, text: '' }])
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
      if (messageRef.current) messageRef.current.textContent = typedData.message
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
    setButtons((prev) => [...prev, { id: Date.now(), text: '' }])

  const removeButton = (btnId: number) =>
    setButtons((prev) => prev.filter((b) => b.id !== btnId))

  const updateButtonText = (btnId: number, text: string) =>
    setButtons((prev) => prev.map((b) => (b.id === btnId ? { ...b, text } : b)))

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
      data: { header, message },
      selected: true,
      zIndex: 1000,
    }
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })).concat(newNode))
  }, [id, getNodes, setNodes, header, message])

  const longestLine = useMemo(() => {
    const allTexts = [
      header || 'Type your header here',
      message || 'Type your message here',
      ...buttons.map((b) => b.text || 'Type your button text here'),
    ]
    const allLines = allTexts.flatMap((t) => t.split('\n'))
    const longest = allLines.reduce((a, b) => (a.length > b.length ? a : b), '')
    return longest.length > MAX_CHARS ? longest.slice(0, MAX_CHARS) : longest
  }, [header, message, buttons])

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
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 border-2 border-white flex items-center justify-center transition-colors"
        onClick={() => {
          setNodes((nds) => nds.filter((n) => n.id !== id))
          setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
        }}
      >
        <X size={12} className="text-gray-600" />
      </button>

      {/* Preview button */}
      <button className="absolute top-3 hover:opacity-70 transition-opacity" style={{ right: 50 }} onClick={() => setShowPreview(true)}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <mask id={`mask_eye_fsd_${id}`} style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><rect width="20" height="20" fill="#D9D9D9"/></mask>
          <g mask={`url(#mask_eye_fsd_${id})`}><path d="M9.99935 13.3334C11.041 13.3334 11.9266 12.9689 12.656 12.24C13.3849 11.5106 13.7493 10.625 13.7493 9.58337C13.7493 8.54171 13.3849 7.65615 12.656 6.92671C11.9266 6.19782 11.041 5.83337 9.99935 5.83337C8.95768 5.83337 8.07213 6.19782 7.34268 6.92671C6.61379 7.65615 6.24935 8.54171 6.24935 9.58337C6.24935 10.625 6.61379 11.5106 7.34268 12.24C8.07213 12.9689 8.95768 13.3334 9.99935 13.3334ZM9.99935 11.8334C9.37435 11.8334 8.84324 11.6145 8.40602 11.1767C7.96824 10.7395 7.74935 10.2084 7.74935 9.58337C7.74935 8.95837 7.96824 8.42698 8.40602 7.98921C8.84324 7.55198 9.37435 7.33337 9.99935 7.33337C10.6243 7.33337 11.1557 7.55198 11.5935 7.98921C12.0307 8.42698 12.2493 8.95837 12.2493 9.58337C12.2493 10.2084 12.0307 10.7395 11.5935 11.1767C11.1557 11.6145 10.6243 11.8334 9.99935 11.8334ZM9.99935 15.8334C8.06879 15.8334 6.3049 15.3231 4.70768 14.3025C3.11046 13.2814 1.90213 11.9028 1.08268 10.1667C1.04102 10.0973 1.01324 10.0103 0.999349 9.90587C0.98546 9.80199 0.978516 9.69448 0.978516 9.58337C0.978516 9.47226 0.98546 9.36449 0.999349 9.26004C1.01324 9.15615 1.04102 9.06949 1.08268 9.00004C1.90213 7.26393 3.11046 5.8856 4.70768 4.86504C6.3049 3.84393 8.06879 3.33337 9.99935 3.33337C11.9299 3.33337 13.6938 3.84393 15.291 4.86504C16.8882 5.8856 18.0966 7.26393 18.916 9.00004C18.9577 9.06949 18.9855 9.15615 18.9993 9.26004C19.0132 9.36449 19.0202 9.47226 19.0202 9.58337C19.0202 9.69448 19.0132 9.80199 18.9993 9.90587C18.9855 10.0103 18.9577 10.0973 18.916 10.1667C18.0966 11.9028 16.8882 13.2814 15.291 14.3025C13.6938 15.3231 11.9299 15.8334 9.99935 15.8334ZM9.99935 14.1667C11.5688 14.1667 13.0099 13.7534 14.3227 12.9267C15.6349 12.1006 16.6382 10.9862 17.3327 9.58337C16.6382 8.1806 15.6349 7.06587 14.3227 6.23921C13.0099 5.4131 11.5688 5.00004 9.99935 5.00004C8.4299 5.00004 6.98879 5.4131 5.67602 6.23921C4.36379 7.06587 3.36046 8.1806 2.66602 9.58337C3.36046 10.9862 4.36379 12.1006 5.67602 12.9267C6.98879 13.7534 8.4299 14.1667 9.99935 14.1667Z" fill="#293748"/></g>
        </svg>
      </button>

      {showPreview && (
        <InteractionPreviewModal
          data={{ type: 'fullscreen', header, message, buttons: buttons.map((b) => b.text) }}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Duplicate button */}
      <button className="absolute top-3 right-4 hover:opacity-70 transition-opacity" onClick={handleDuplicate}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <mask id={`mask_dup_fsd_${id}`} style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><rect width="20" height="20" fill="#D9D9D9"/></mask>
          <g mask={`url(#mask_dup_fsd_${id})`}><path d="M7.5 15C7.04167 15 6.64944 14.8369 6.32333 14.5108C5.99667 14.1842 5.83333 13.7917 5.83333 13.3333V3.33332C5.83333 2.87499 5.99667 2.48249 6.32333 2.15582C6.64944 1.82971 7.04167 1.66666 7.5 1.66666H15C15.4583 1.66666 15.8508 1.82971 16.1775 2.15582C16.5036 2.48249 16.6667 2.87499 16.6667 3.33332V13.3333C16.6667 13.7917 16.5036 14.1842 16.1775 14.5108C15.8508 14.8369 15.4583 15 15 15H7.5ZM7.5 13.3333H15V3.33332H7.5V13.3333ZM4.16667 18.3333C3.70833 18.3333 3.31583 18.1703 2.98917 17.8442C2.66306 17.5175 2.5 17.125 2.5 16.6667V5.83332C2.5 5.59721 2.58 5.39916 2.74 5.23916C2.89944 5.07971 3.09722 4.99999 3.33333 4.99999C3.56944 4.99999 3.7675 5.07971 3.9275 5.23916C4.08694 5.39916 4.16667 5.59721 4.16667 5.83332V16.6667H12.5C12.7361 16.6667 12.9342 16.7467 13.0942 16.9067C13.2536 17.0661 13.3333 17.2639 13.3333 17.5C13.3333 17.7361 13.2536 17.9339 13.0942 18.0933C12.9342 18.2533 12.7361 18.3333 12.5 18.3333H4.16667Z" fill="#293748"/></g>
        </svg>
      </button>

      <div className="px-1 pt-4 pb-3 flex items-center gap-1.5">
        <Monitor size={14} className="text-[#8b5cf6] shrink-0" />
        <span className="text-xs font-medium text-gray-500">Full screen dialog</span>
      </div>

      {tooltipMode && (
        <>
          <div className="mb-5 px-1">
            <p className="text-base font-semibold italic text-gray-800">
              Create tooltips for your message and buttons
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {/* Message tooltip */}
            {message.trim() && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Message: {message}</p>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={draftTooltips['message'] ?? ''}
                      onChange={(e) =>
                        setDraftTooltips((prev) => ({ ...prev, message: e.target.value }))
                      }
                      placeholder="Type your tool-tip here"
                      className="nodrag w-full text-sm text-gray-800 placeholder:text-[#FC6839] outline-none bg-transparent pb-2 border-b border-gray-200 focus:border-brand-400 transition-colors"
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

            {/* Button tooltips */}
            {buttons.map((btn) => (
              <div key={btn.id}>
                {btn.text && (
                  <p className="text-xs text-gray-600 mb-1">
                    Button: {btn.text}
                  </p>
                )}
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={draftTooltips[btn.id] ?? ''}
                      onChange={(e) =>
                        setDraftTooltips((prev) => ({ ...prev, [btn.id]: e.target.value }))
                      }
                      placeholder="Type your tool-tip here"
                      className="nodrag w-full text-sm text-gray-800 placeholder:text-[#FC6839] outline-none bg-transparent pb-2 border-b border-gray-200 focus:border-brand-400 transition-colors"
                    />
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-600 shrink-0 mt-0.5"
                    onClick={() =>
                      setDraftTooltips((prev) => {
                        const next = { ...prev }
                        delete next[btn.id]
                        return next
                      })
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
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
        </>
      )}

      <div style={tooltipMode ? { opacity: 0, pointerEvents: 'none' as const, position: 'absolute' as const, left: 0, right: 0, top: 0 } : undefined}>
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
                ref={messageRef}
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
          <div className="flex flex-col gap-5">
            {buttons.map((btn) => (
              <div
                key={btn.id}
                className="nodrag flex items-start gap-3 relative pb-2 border-b border-gray-200 focus-within:border-brand-400 transition-colors"
              >
                {/* Input */}
                <div className="flex-1 min-w-0" data-answer-content>
                  <input
                    type="text"
                    value={btn.text}
                    onChange={(e) => updateButtonText(btn.id, e.target.value)}
                    placeholder="Type your button text here"
                    className="nodrag w-full text-sm text-[#FC6839] placeholder:text-[#FC6839] placeholder:opacity-100 focus:placeholder:opacity-60 outline-none bg-transparent"
                    data-cta-field
                    onFocus={() => { handleFieldFocus(); setFocusedButtonId(btn.id); setFocusedField('button') }}
                    onBlur={(e) => {
                      handleFieldBlur(e as unknown as React.FocusEvent)
                      setFocusedButtonId(null); setFocusedField(null)
                    }}
                  />
                </div>

                {/* Tooltip + Remove button */}
                <div className="flex items-center gap-2 shrink-0" style={{ marginTop: 6 }}>
                  {tooltips[btn.id]?.trim() && (
                    <div className="relative group/tip">
                      <CircleHelp size={14} className="text-gray-800 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 text-white text-xs opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity shadow-lg" style={{ width: 'max-content', maxWidth: 320 }}>
                        {tooltips[btn.id]}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                      </div>
                    </div>
                  )}
                  {buttons.length >= 2 && (
                    <button
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() => removeButton(btn.id)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Per-button source handle */}
                <div className="absolute top-1/2 -translate-y-1/2" style={{ right: -30 }}>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`button-${btn.id}`}
                    className="!bg-brand-500 !border-brand-500 !relative !transform-none !top-0 !right-0"
                    style={{ width: 12, height: 12 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add button */}
          {buttons.length < 2 && (
            <div className="flex justify-end mt-4">
              <button
                onClick={addButton}
                className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
              >
                Add button
                <Plus size={14} />
              </button>
            </div>
          )}
        </>
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
