import { useState, useCallback, useMemo, useRef, useLayoutEffect, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react'
import {
  Copy, X, Plus, Bold, Italic, Underline, AlignJustify,
  Image, Pilcrow, ChevronDown, CircleHelp, Sparkles, Monitor,
} from 'lucide-react'

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
        <Sparkles size={18} />
      </button>
    </div>
  )
}

export default function FullScreenDialogNode({ id }: NodeProps) {
  const { setNodes, setEdges } = useReactFlow()
  const [header, setHeader] = useState('')
  const [message, setMessage] = useState('')
  const [buttons, setButtons] = useState<ButtonEntry[]>([{ id: 0, text: '' }])
  const [showToolbar, setShowToolbar] = useState(false)
  const [activeFormats, setActiveFormats] = useState<Set<FormatOption>>(new Set())
  const [tooltipMode, setTooltipMode] = useState(false)
  const [tooltips, setTooltips] = useState<Record<number, string>>({})
  const [draftTooltips, setDraftTooltips] = useState<Record<number, string>>({})
  const [focusedButtonId, setFocusedButtonId] = useState<number | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDraggingNode = useRef(false)

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

  const toggleFormat = useCallback((fmt: FormatOption) => {
    if (fmt === 'link') {
      setDraftTooltips({ ...tooltips })
      setTooltipMode(true)
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
    if (isDraggingNode.current) return
    requestAnimationFrame(() => {
      if (isDraggingNode.current) return
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
    if (!file || focusedButtonId === null) return
    setShowOverlay(false)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      const img = new window.Image()
      img.onload = () => {
        const maxW = (manualWidth ?? cardWidth) - 32
        const scale = Math.min(1, maxW / img.width)
        setButtons((prev) =>
          prev.map((b) =>
            b.id === focusedButtonId
              ? {
                  ...b,
                  image: {
                    src,
                    width: Math.round(img.width * scale),
                    height: Math.round(img.height * scale),
                    naturalWidth: img.width,
                    naturalHeight: img.height,
                    float: 'left' as const,
                    offsetX: 0,
                    offsetY: 0,
                  },
                }
              : b,
          ),
        )
      }
      img.src = src
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm relative transition-[width] duration-150"
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
          disabledKeys={buttons.some((b) => b.text.trim() || b.image) ? undefined : new Set<FormatOption>(['link'])}
        />
      )}

      {/* Close button */}
      <button
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
        onClick={() => {
          setNodes((nds) => nds.filter((n) => n.id !== id))
          setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
        }}
      >
        <X size={12} className="text-gray-600" />
      </button>

      {/* Preview button */}
      <button className="absolute top-2 text-gray-400 hover:text-gray-600" style={{ right: 46 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 14.667c.833 0 1.542-.292 2.125-.875.584-.584.875-1.292.875-2.125 0-.834-.291-1.542-.875-2.126A2.893 2.893 0 0 0 12 8.667c-.833 0-1.542.292-2.125.874A2.893 2.893 0 0 0 9 11.667c0 .833.292 1.541.875 2.125A2.893 2.893 0 0 0 12 14.667Zm0-1.2a1.63 1.63 0 0 1-1.275-.525 1.63 1.63 0 0 1-.525-1.275c0-.5.175-.925.525-1.275.35-.35.775-.525 1.275-.525s.925.175 1.275.525c.35.35.525.775.525 1.275s-.175.925-.525 1.275a1.63 1.63 0 0 1-1.275.525Zm0 3.2c-1.544 0-2.956-.408-4.233-1.225a8.455 8.455 0 0 1-2.9-3.309.304.304 0 0 1-.067-.233.89.89 0 0 1 .017-.258.304.304 0 0 1 .067-.234 8.455 8.455 0 0 1 2.9-3.308C9.044 7.075 10.456 6.667 12 6.667s2.955.408 4.233 1.225a8.458 8.458 0 0 1 2.9 3.308c.034.055.056.125.067.234a.89.89 0 0 1-.017.258.304.304 0 0 1-.067.233 8.458 8.458 0 0 1-2.9 3.309c-1.278.817-2.689 1.225-4.233 1.225Zm0-1.334c1.256 0 2.408-.33 3.459-.992a7.2 7.2 0 0 0 2.408-2.674A7.2 7.2 0 0 0 15.459 9c-1.05-.661-2.203-.992-3.459-.992-1.255 0-2.408.33-3.459.991A7.2 7.2 0 0 0 6.133 11.667a7.2 7.2 0 0 0 2.408 2.674c1.05.661 2.204.992 3.459.992Z" fill="currentColor"/>
        </svg>
      </button>

      {/* Duplicate button */}
      <button className="absolute top-2 right-5 text-gray-400 hover:text-gray-600">
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.75 13.5c-.412 0-.766-.147-1.059-.44A1.445 1.445 0 0 1 5.25 12V3c0-.412.147-.766.44-1.06.294-.293.647-.44 1.06-.44h6.75c.412 0 .766.147 1.06.44.293.294.44.648.44 1.06v9c0 .412-.147.766-.44 1.06-.294.293-.648.44-1.06.44H6.75ZM6.75 12h6.75V3H6.75v9ZM3.75 16.5c-.412 0-.766-.147-1.06-.44A1.445 1.445 0 0 1 2.25 15V5.25c0-.212.072-.391.216-.535A.726.726 0 0 1 3 4.5c.212 0 .391.072.535.215a.727.727 0 0 1 .215.535V15h7.5c.212 0 .391.072.535.216a.726.726 0 0 1 .215.534c0 .213-.072.391-.215.534a.726.726 0 0 1-.535.216H3.75Z" fill="currentColor"/>
        </svg>
      </button>

      <div className="px-1 pt-4 pb-3 flex items-center gap-1.5">
        <Monitor size={14} className="text-[#8b5cf6] shrink-0" />
        <span className="text-xs font-medium text-gray-500">Full screen dialog</span>
      </div>

      {tooltipMode ? (
        <>
          <div className="mb-5 px-1">
            <p className="text-base font-semibold italic text-gray-800">
              Create tooltips for your buttons
            </p>
          </div>

          <div className="flex flex-col gap-5">
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
                      className="nodrag w-full text-sm text-gray-800 placeholder:text-brand-300 outline-none bg-transparent pb-2 border-b border-gray-200 focus:border-brand-400 transition-colors"
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
          {/* Header field */}
          <div className="mb-7 px-1">
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
          <div className="mb-6 pb-2 border-b border-gray-200 focus-within:border-brand-400 transition-colors" data-answer-content>
            <div
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
              onFocus={handleFieldFocus}
              onBlur={handleFieldBlur}
            />
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
                    onFocus={() => { handleFieldFocus(); setFocusedButtonId(btn.id) }}
                    onBlur={(e) => {
                      handleFieldBlur(e as unknown as React.FocusEvent)
                      setFocusedButtonId(null)
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
