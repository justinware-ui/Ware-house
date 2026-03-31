import { useState, useCallback, useMemo, useRef, useLayoutEffect, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Handle, Position, type NodeProps, useReactFlow, useUpdateNodeInternals } from '@xyflow/react'
import {
  Copy, X, Plus, Bold, Italic, Underline, AlignJustify,
  Image, Pilcrow, ChevronDown, CircleHelp, Sparkles, HelpCircle,
} from 'lucide-react'
const AddPhotoIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3.538 13.666c-.337 0-.622-.117-.855-.35a1.163 1.163 0 0 1-.35-.855V3.538c0-.337.117-.622.35-.855.234-.234.518-.35.855-.35H8.538v1H3.538a.2.2 0 0 0-.147.058.2.2 0 0 0-.058.147v8.923a.2.2 0 0 0 .058.148.2.2 0 0 0 .147.057h8.923a.2.2 0 0 0 .148-.057.2.2 0 0 0 .057-.148V7.461h1v4.999c0 .337-.117.622-.35.856-.234.233-.518.35-.856.35H3.538ZM4.256 11.128h7.487l-2.327-3.103-2 2.597-1.417-1.802-1.743 2.308ZM11.333 6V4.666H10V3.666h1.333V2.333h1v1.333h1.334v1h-1.334V6h-1Z" fill="currentColor"/>
  </svg>
)

const AddTooltipIcon = ({ className }: { className?: string }) => (
  <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M7.966 12c.234 0 .431-.081.592-.242.161-.161.242-.358.242-.591 0-.234-.08-.431-.242-.592a.806.806 0 0 0-.592-.242.806.806 0 0 0-.592.242.806.806 0 0 0-.242.592c0 .233.08.43.241.591.162.161.359.242.593.242Zm.1-6.867c.31 0 .56.086.75.258.188.173.283.398.283.675 0 .19-.064.381-.191.575a3.64 3.64 0 0 1-.542.609c-.334.289-.578.567-.734.833-.155.267-.233.534-.233.8 0 .156.058.287.175.392a.498.498 0 0 0 .408.159.498.498 0 0 0 .417-.167.76.76 0 0 0 .233-.417c.034-.189.109-.364.226-.525.116-.161.308-.37.575-.625.344-.323.586-.617.725-.884.139-.266.208-.561.208-.883 0-.567-.213-1.031-.641-1.392-.428-.361-.981-.541-1.659-.541-.466 0-.88.089-1.241.266-.362.178-.642.45-.842.817a.583.583 0 0 0-.084.425c.023.138.1.253.234.341a.523.523 0 0 0 .475.084.556.556 0 0 0 .425-.284 1.04 1.04 0 0 1 .442-.383c.172-.089.369-.134.591-.134ZM8 14.666a6.65 6.65 0 0 1-2.584-.525 6.698 6.698 0 0 1-2.125-1.425 6.677 6.677 0 0 1-1.433-2.116A6.521 6.521 0 0 1 1.333 8c0-.922.175-1.789.525-2.6a6.682 6.682 0 0 1 1.434-2.117A6.692 6.692 0 0 1 5.416 1.858 6.649 6.649 0 0 1 8 1.333c.933 0 1.805.175 2.616.525a6.71 6.71 0 0 1 2.117 1.425A6.711 6.711 0 0 1 14.15 5.4c.344.811.516 1.678.516 2.6 0 .922-.172 1.789-.517 2.6a6.711 6.711 0 0 1-1.416 2.116 6.692 6.692 0 0 1-2.117 1.425 6.598 6.598 0 0 1-2.617.525ZM8 13.333c1.489 0 2.75-.52 3.783-1.558C12.816 10.736 13.333 9.478 13.333 8c0-1.478-.517-2.736-1.55-3.776C10.75 3.186 9.489 2.666 8 2.666c-1.456 0-2.709.52-3.759 1.558C3.191 5.264 2.666 6.522 2.666 8c0 1.478.525 2.736 1.575 3.775 1.05 1.039 2.303 1.558 3.759 1.558Z" fill="currentColor"/>
    <circle cx="14" cy="4" r="2.75" fill="#302C28"/>
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

interface Answer {
  id: number
  value: string
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
  const tools: { key: FormatOption; icon?: typeof Bold; custom?: 'addPhoto' | 'addTooltip'; label: string; size?: number; hasDropdown?: boolean }[] = [
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
      className="absolute -top-14 left-1/2 -translate-x-1/2 z-10 flex items-center rounded-full shadow-lg border border-[#3D3834] px-2 py-1.5 gap-0.5"
      style={{ backgroundColor: '#302C28' }}
    >
      {/* Drag handle */}
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
                ? 'text-[#4A4540] cursor-not-allowed'
                : activeFormats.has(key)
                  ? 'text-brand-500'
                  : 'text-[#A8A29E] hover:text-brand-500'
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

      {/* Separator + AI button */}
      <div className="w-px h-6 bg-[#3D3834] mx-1 nodrag nopan" />
      <button className="p-1.5 rounded text-brand-500 hover:bg-[#3D3834] transition-colors nodrag nopan" onMouseDown={(e) => e.preventDefault()}>
        <Sparkles size={18} />
      </button>
    </div>
  )
}

export default function CtaNode({ id, data }: NodeProps) {
  const { setNodes, setEdges } = useReactFlow()
  const updateNodeInternals = useUpdateNodeInternals()
  const typedData = data as { question?: string; answers?: string[] }
  const [question, setQuestion] = useState(typedData.question ?? '')
  const [answers, setAnswers] = useState<Answer[]>(() => {
    if (typedData.answers && typedData.answers.length > 0) {
      return typedData.answers.map((v, i) => ({ id: i, value: v }))
    }
    return [{ id: 0, value: '' }]
  })
  const [showToolbar, setShowToolbar] = useState(false)
  const [activeFormats, setActiveFormats] = useState<Set<FormatOption>>(new Set())
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [tooltipMode, setTooltipMode] = useState(false)
  const [tooltips, setTooltips] = useState<Record<number, string>>({})
  const [draftTooltips, setDraftTooltips] = useState<Record<number, string>>({})
  const [showOverlay, setShowOverlay] = useState(false)
  const [focusedAnswerId, setFocusedAnswerId] = useState<number | null>(null)
  const [resizingImage, setResizingImage] = useState<{ answerId: number; startX: number; startY: number; startW: number; startH: number; corner: string } | null>(null)
  const [draggingImage, setDraggingImage] = useState<{ answerId: number; startX: number; startY: number; startOffX: number; startOffY: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const answerRefs = useRef<(HTMLDivElement | null)[]>([])
  const answersRef = useRef(answers)
  answersRef.current = answers
  const dragIndexRef = useRef<number | null>(null)
  const isDraggingNode = useRef(false)
  const answerOrderKey = answers.map((a) => a.id).join(',')

  useEffect(() => {
    updateNodeInternals(id)
  }, [answerOrderKey, id, updateNodeInternals])

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

  const addAnswer = () =>
    setAnswers((prev) => [...prev, { id: Date.now(), value: '' }])

  const removeAnswer = (answerId: number) =>
    setAnswers((prev) => prev.filter((a) => a.id !== answerId))

  const updateQuestion = (raw: string) => setQuestion(wrapText(raw))

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
    if (fmt === 'link') {
      setDraftTooltips({ ...tooltips })
      setTooltipMode(true)
      setShowToolbar(false)
      return
    }
    setActiveFormats((prev) => {
      const next = new Set(prev)
      if (next.has(fmt)) next.delete(fmt)
      else next.add(fmt)
      return next
    })
  }, [tooltips])

  const handleFieldFocus = () => setShowToolbar(true)
  const handleFieldBlur = (e: React.FocusEvent) => {
    const related = e.relatedTarget as HTMLElement | null
    if (related?.closest('[data-toolbar]') || related?.closest('[data-cta-field]')) return
    requestAnimationFrame(() => {
      if (isDraggingNode.current) return
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

  const longestLine = useMemo(() => {
    const allTexts = [
      question || 'Type your question here',
      ...answers.map((a) => a.value || 'Type your answer here'),
    ]
    const allLines = allTexts.flatMap((t) => t.split('\n'))
    const longest = allLines.reduce((a, b) => (a.length > b.length ? a : b), '')
    return longest.length > MAX_CHARS ? longest.slice(0, MAX_CHARS) : longest
  }, [question, answers])

  useLayoutEffect(() => {
    if (!measureRef.current) return
    measureRef.current.textContent = longestLine
    setCardWidth(Math.max(measureRef.current.offsetWidth + CARD_CHROME, MIN_WIDTH))
  }, [longestLine])

  return (
    <div
      className="bg-[#302C28] border border-[#3D3834] rounded-2xl px-6 py-5 shadow-sm relative transition-[width] duration-150"
      style={{ width: tooltipMode ? Math.max(manualWidth ?? cardWidth, 320) : (manualWidth ?? cardWidth) }}
    >
      <span
        ref={measureRef}
        className="invisible absolute whitespace-nowrap text-base font-semibold pointer-events-none"
        aria-hidden
      />
      {showToolbar && !tooltipMode && (
        <FormattingToolbar
          activeFormats={activeFormats}
          onToggle={toggleFormat}
          onDragStart={() => { isDraggingNode.current = true }}
          onDragEnd={() => { isDraggingNode.current = false }}
          disabledKeys={answers.some((a) => a.value.trim() || a.image) ? undefined : new Set<FormatOption>(['link'])}
        />
      )}

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-brand-500 !border-brand-500"
        style={{ width: 12, height: 12, top: '50%' }}
      />

      {/* Close button */}
      <button
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#3D3834] hover:bg-[#4A4540] flex items-center justify-center transition-colors"
        onClick={() => {
          setNodes((nds) => nds.filter((n) => n.id !== id))
          setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
        }}
      >
        <X size={12} className="text-[#A8A29E]" />
      </button>

      {/* Preview button */}
      <button className="absolute top-2 text-[#78716C] hover:text-[#A8A29E]" style={{ right: 46 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 14.667c.833 0 1.542-.292 2.125-.875.584-.584.875-1.292.875-2.125 0-.834-.291-1.542-.875-2.126A2.893 2.893 0 0 0 12 8.667c-.833 0-1.542.292-2.125.874A2.893 2.893 0 0 0 9 11.667c0 .833.292 1.541.875 2.125A2.893 2.893 0 0 0 12 14.667Zm0-1.2a1.63 1.63 0 0 1-1.275-.525 1.63 1.63 0 0 1-.525-1.275c0-.5.175-.925.525-1.275.35-.35.775-.525 1.275-.525s.925.175 1.275.525c.35.35.525.775.525 1.275s-.175.925-.525 1.275a1.63 1.63 0 0 1-1.275.525Zm0 3.2c-1.544 0-2.956-.408-4.233-1.225a8.455 8.455 0 0 1-2.9-3.309.304.304 0 0 1-.067-.233.89.89 0 0 1 .017-.258.304.304 0 0 1 .067-.234 8.455 8.455 0 0 1 2.9-3.308C9.044 7.075 10.456 6.667 12 6.667s2.955.408 4.233 1.225a8.458 8.458 0 0 1 2.9 3.308c.034.055.056.125.067.234a.89.89 0 0 1-.017.258.304.304 0 0 1-.067.233 8.458 8.458 0 0 1-2.9 3.309c-1.278.817-2.689 1.225-4.233 1.225Zm0-1.334c1.256 0 2.408-.33 3.459-.992a7.2 7.2 0 0 0 2.408-2.674A7.2 7.2 0 0 0 15.459 9c-1.05-.661-2.203-.992-3.459-.992-1.255 0-2.408.33-3.459.991A7.2 7.2 0 0 0 6.133 11.667a7.2 7.2 0 0 0 2.408 2.674c1.05.661 2.204.992 3.459.992Z" fill="currentColor"/>
        </svg>
      </button>

      {/* Duplicate button */}
      <button className="absolute top-2 right-5 text-[#78716C] hover:text-[#A8A29E]">
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.75 13.5c-.412 0-.766-.147-1.059-.44A1.445 1.445 0 0 1 5.25 12V3c0-.412.147-.766.44-1.06.294-.293.647-.44 1.06-.44h6.75c.412 0 .766.147 1.06.44.293.294.44.648.44 1.06v9c0 .412-.147.766-.44 1.06-.294.293-.648.44-1.06.44H6.75ZM6.75 12h6.75V3H6.75v9ZM3.75 16.5c-.412 0-.766-.147-1.06-.44A1.445 1.445 0 0 1 2.25 15V5.25c0-.212.072-.391.216-.535A.726.726 0 0 1 3 4.5c.212 0 .391.072.535.215a.727.727 0 0 1 .215.535V15h7.5c.212 0 .391.072.535.216a.726.726 0 0 1 .215.534c0 .213-.072.391-.215.534a.726.726 0 0 1-.535.216H3.75Z" fill="currentColor"/>
        </svg>
      </button>

      <div className="px-1 pt-4 pb-3 flex items-center gap-1.5">
        <HelpCircle size={14} className="text-[#22c55e] shrink-0" />
        <span className="text-xs font-medium text-[#A8A29E]">Discovery question</span>
      </div>

      {tooltipMode ? (
        <>
          {/* Tooltip title */}
          <div className="mb-5 px-1">
            <p className="text-base font-semibold italic text-[#F5F0EB]">
              Create tooltips for your answers
            </p>
          </div>

          {/* Tooltip fields per answer */}
          <div className="flex flex-col gap-5">
            {answers.map((answer) => (
              <div key={answer.id}>
                {answer.value && (
                  <p className="text-xs text-[#A8A29E] mb-1">
                    A: {answer.value.split('\n')[0]}
                  </p>
                )}
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={draftTooltips[answer.id] ?? ''}
                      onChange={(e) =>
                        setDraftTooltips((prev) => ({ ...prev, [answer.id]: e.target.value }))
                      }
                      placeholder="Type your tool-tip here"
                      className="nodrag w-full text-sm text-[#F5F0EB] placeholder:text-brand-300 outline-none bg-transparent pb-2 border-b border-[#3D3834] focus:border-brand-400 transition-colors"
                    />
                  </div>
                  <button
                    className="text-[#78716C] hover:text-[#A8A29E] shrink-0 mt-0.5"
                    onClick={() =>
                      setDraftTooltips((prev) => {
                        const next = { ...prev }
                        delete next[answer.id]
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

          {/* Cancel / Apply */}
          <div className="flex items-center justify-between mt-5">
            <button
              className="text-sm font-bold text-[#F5F0EB] hover:text-[#A8A29E] transition-colors"
              onClick={() => setTooltipMode(false)}
            >
              Cancel
            </button>
            <button
              className={`text-sm font-semibold transition-colors ${
                Object.values(draftTooltips).some((v) => v.trim())
                  ? 'text-brand-500 hover:text-brand-600'
                  : 'text-[#4A4540] cursor-not-allowed'
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
          <div className="mb-6 px-1">
            <textarea
              value={question}
              onChange={(e) => updateQuestion(e.target.value)}
              placeholder="Type your question here"
              rows={Math.max(1, question.split('\n').length)}
              className="w-full text-base font-semibold italic text-[#F5F0EB] placeholder:text-[#F5F0EB] placeholder:font-semibold placeholder:italic placeholder:opacity-100 focus:placeholder:opacity-60 outline-none bg-transparent resize-none overflow-hidden"
              data-cta-field
              onFocus={handleFieldFocus}
              onBlur={handleFieldBlur}
            />
          </div>

          {/* Answer fields */}
          <div className="flex flex-col gap-5">
            {answers.map((answer, index) => (
              <div
                key={answer.id}
                ref={(el) => {
                  answerRefs.current[index] = el
                  answerRefs.current.length = answers.length
                }}
                className={`nodrag flex items-start gap-3 relative transition-opacity pb-2 border-b border-[#3D3834] focus-within:border-brand-400 ${
                  draggingIndex !== null && draggingIndex !== index ? 'opacity-50' : ''
                }`}
              >
                {/* Drag handle */}
                {answers.length >= 2 && (
                  <div
                    className="nodrag nopan shrink-0 cursor-grab select-none p-1"
                    onMouseDown={(e) => handleGrabStart(index, e)}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.5 16.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.163-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.326.326.49.718.49 1.177s-.164.851-.49 1.177c-.326.327-.718.49-1.177.49Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.164-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.327.326.49.718.49 1.177s-.163.851-.49 1.177c-.326.327-.718.49-1.177.49ZM7.5 11.666c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.163-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.326.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.164-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.326.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489ZM7.5 6.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.163-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.327.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.164-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.327.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489Z" fill="#8D8A87"/>
                    </svg>
                  </div>
                )}

                {/* Input */}
                <div className="flex-1 min-w-0 overflow-hidden" data-answer-content>
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
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect y="6" width="6" height="13.008" rx="2" transform="rotate(-90 0 6)" fill="#FF9356"/><rect width="6" height="13.008" rx="2" fill="#FF9356"/></svg>
                      </div>
                      {/* Top-right */}
                      <div
                        onMouseDown={(e) => handleResizeStart(answer.id, 'ne', e)}
                        className="absolute"
                        style={{ cursor: 'nesw-resize', top: 0, right: 0 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="7.008" width="6" height="13.008" rx="2" fill="#FF9356"/><rect x="13.008" width="6" height="13.008" rx="2" transform="rotate(90 13.008 0)" fill="#FF9356"/></svg>
                      </div>
                      {/* Bottom-left */}
                      <div
                        onMouseDown={(e) => handleResizeStart(answer.id, 'sw', e)}
                        className="absolute"
                        style={{ cursor: 'nesw-resize', bottom: 0, left: 0 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="6" y="13.008" width="6" height="13.008" rx="2" transform="rotate(180 6 13.008)" fill="#FF9356"/><rect y="13.008" width="6" height="13.008" rx="2" transform="rotate(-90 0 13.008)" fill="#FF9356"/></svg>
                      </div>
                      {/* Bottom-right */}
                      <div
                        onMouseDown={(e) => handleResizeStart(answer.id, 'se', e)}
                        className="absolute"
                        style={{ cursor: 'nwse-resize', bottom: 0, right: 0 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="13.008" y="7.008" width="6" height="13.008" rx="2" transform="rotate(90 13.008 7.008)" fill="#FF9356"/><rect x="13.008" y="13.008" width="6" height="13.008" rx="2" transform="rotate(180 13.008 13.008)" fill="#FF9356"/></svg>
                      </div>
                      {/* Hover quick actions */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-black/30 absolute inset-0 rounded pointer-events-none" />
                        <div className="relative z-10 flex items-center bg-[#302C28] rounded-full border border-[#3D3834] px-2 py-2 gap-1 shadow-lg pointer-events-auto">
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
                                  <path d="M10.0417 16.6667C8.18056 16.6667 6.59722 16.0209 5.29167 14.7292C3.98611 13.4375 3.33333 11.8612 3.33333 10V9.85421L2.58333 10.6042C2.43056 10.757 2.23611 10.8334 2 10.8334C1.76389 10.8334 1.56944 10.757 1.41667 10.6042C1.26389 10.4514 1.1875 10.257 1.1875 10.0209C1.1875 9.78476 1.26389 9.59032 1.41667 9.43754L3.58333 7.27087C3.66667 7.18754 3.75694 7.12837 3.85417 7.09337C3.95139 7.05893 4.05556 7.04171 4.16667 7.04171C4.27778 7.04171 4.38194 7.05893 4.47917 7.09337C4.57639 7.12837 4.66667 7.18754 4.75 7.27087L6.91667 9.43754C7.06944 9.59032 7.14583 9.78476 7.14583 10.0209C7.14583 10.257 7.06944 10.4514 6.91667 10.6042C6.76389 10.757 6.56944 10.8334 6.33333 10.8334C6.09722 10.8334 5.90278 10.757 5.75 10.6042L5 9.85421V10C5 11.3889 5.48972 12.5695 6.46917 13.5417C7.44806 14.5139 8.63889 15 10.0417 15C10.3194 15 10.5903 14.9759 10.8542 14.9275C11.1181 14.8787 11.3819 14.8056 11.6458 14.7084C11.7847 14.6528 11.9342 14.6389 12.0942 14.6667C12.2536 14.6945 12.3889 14.7639 12.5 14.875C12.75 15.125 12.8508 15.3923 12.8025 15.6767C12.7536 15.9617 12.5694 16.1598 12.25 16.2709C11.8889 16.3959 11.5244 16.4931 11.1567 16.5625C10.7883 16.632 10.4167 16.6667 10.0417 16.6667ZM15.8333 12.9584C15.7222 12.9584 15.6181 12.9409 15.5208 12.9059C15.4236 12.8714 15.3333 12.8125 15.25 12.7292L13.0833 10.5625C12.9306 10.4098 12.8542 10.2153 12.8542 9.97921C12.8542 9.7431 12.9306 9.54865 13.0833 9.39587C13.2361 9.2431 13.4306 9.16671 13.6667 9.16671C13.9028 9.16671 14.0972 9.2431 14.25 9.39587L15 10.1459V10C15 8.61115 14.5106 7.4306 13.5317 6.45837C12.5522 5.48615 11.3611 5.00004 9.95833 5.00004C9.68056 5.00004 9.40972 5.02448 9.14583 5.07337C8.88194 5.12171 8.61806 5.19449 8.35417 5.29171C8.21528 5.34726 8.06611 5.36115 7.90667 5.33337C7.74667 5.3056 7.61111 5.23615 7.5 5.12504C7.25 4.87504 7.14917 4.60754 7.1975 4.32254C7.24639 4.0381 7.43056 3.84032 7.75 3.72921C8.11111 3.60421 8.47583 3.50699 8.84417 3.43754C9.21194 3.3681 9.58333 3.33337 9.95833 3.33337C11.8194 3.33337 13.4028 3.97921 14.7083 5.27087C16.0139 6.56254 16.6667 8.13893 16.6667 10V10.1459L17.4167 9.39587C17.5694 9.2431 17.7639 9.16671 18 9.16671C18.2361 9.16671 18.4306 9.2431 18.5833 9.39587C18.7361 9.54865 18.8125 9.7431 18.8125 9.97921C18.8125 10.2153 18.7361 10.4098 18.5833 10.5625L16.4167 12.7292C16.3333 12.8125 16.2431 12.8714 16.1458 12.9059C16.0486 12.9409 15.9444 12.9584 15.8333 12.9584Z" fill="#F5F0EB"/>
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
                                <path d="M9 10.05L5.325 13.725a.706.706 0 0 1-.525.206.706.706 0 0 1-.525-.206.706.706 0 0 1-.206-.525c0-.213.069-.388.206-.525L7.95 9 4.275 5.325a.706.706 0 0 1-.206-.525c0-.213.069-.388.206-.525a.706.706 0 0 1 .525-.206c.213 0 .388.069.525.206L9 7.95l3.675-3.675a.706.706 0 0 1 .525-.206c.213 0 .388.069.525.206a.706.706 0 0 1 .206.525.706.706 0 0 1-.206.525L10.05 9l3.675 3.675a.706.706 0 0 1 .206.525.706.706 0 0 1-.206.525.706.706 0 0 1-.525.206.706.706 0 0 1-.525-.206L9 10.05Z" fill="#F5F0EB"/>
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
                    data-placeholder="Type your answer here"
                    className={`text-sm text-[#F5F0EB] outline-none min-h-[1.5em] ${!answer.value ? `before:content-[attr(data-placeholder)] before:pointer-events-none before:text-[#FF9356] ${focusedAnswerId === answer.id ? 'before:opacity-60' : ''}` : ''}`}
                    style={{ wordBreak: 'break-word' }}
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
                    onFocus={() => { handleFieldFocus(); setFocusedAnswerId(answer.id) }}
                    onBlur={(e) => {
                      handleFieldBlur(e as unknown as React.FocusEvent)
                      setFocusedAnswerId(null)
                    }}
                  />
                  {answer.image && <div style={{ clear: 'both' }} />}
                </div>

                {/* Tooltip + Remove answer */}
                <div className="flex items-center gap-2 shrink-0" style={{ marginTop: 6 }}>
                  {tooltips[answer.id]?.trim() && (
                    <div className="relative group/tip">
                      <CircleHelp size={14} className="text-[#F5F0EB] cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 text-white text-xs opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity shadow-lg" style={{ width: 'max-content', maxWidth: 320 }}>
                        {tooltips[answer.id]}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                      </div>
                    </div>
                  )}
                  {answers.length >= 2 && (
                    <button
                      className="text-[#78716C] hover:text-[#A8A29E]"
                      onClick={() => removeAnswer(answer.id)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Per-answer source handle */}
                <div className="absolute top-1/2 -translate-y-1/2" style={{ right: -30 }}>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`answer-${answer.id}`}
                    className="!bg-brand-500 !border-brand-500 !relative !transform-none !top-0 !right-0"
                    style={{ width: 12, height: 12 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add answer */}
          <div className="flex justify-end mt-4">
            <button
              onClick={addAnswer}
              className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
            >
              Add answer
              <Plus size={14} />
            </button>
          </div>


        </>
      )}

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
