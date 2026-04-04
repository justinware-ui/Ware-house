import { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import AudioWaveform from './AudioWaveform'
import AgenticChat, { type SelectedContent } from './AgenticChat'
import type { DemoProposal, ContentMatch, CanvasState } from '../lib/aiEngine'
import { findReplacements, rejectDemo, searchContent } from '../lib/aiEngine'
import type { ConfidenceLevel } from '../lib/aiEngine'
import { demos as allDemos } from '../data/demos'
import PreviewModal from './PreviewModal'
import thumbTableHero from '../assets/thumb-table-hero.svg'
import thumbContent from '../assets/thumb-content.svg'
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type OnConnect,
  BackgroundVariant,
  useReactFlow,
  useUpdateNodeInternals,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import StartNode from './nodes/StartNode'
import InteractionNode from './nodes/InteractionNode'
import CtaNode from './nodes/CtaNode'
import DemoCardNode from './nodes/DemoCardNode'
import FullScreenDialogNode from './nodes/FullScreenDialogNode'
import DeletableEdge from './edges/DeletableEdge'

const edgeTypes = {
  deletable: DeletableEdge,
}

const nodeTypes = {
  startNode: StartNode,
  interactionNode: InteractionNode,
  ctaNode: CtaNode,
  demoCardNode: DemoCardNode,
  fullScreenDialogNode: FullScreenDialogNode,
}

const initialNodes: Node[] = []

const initialEdges: Edge[] = []

let nodeId = Date.now()
const getNodeId = () => `dnd-${++nodeId}`

const nodeTypeMap: Record<string, string> = {
  fullscreen: 'fullScreenDialogNode',
  cta: 'fullScreenDialogNode',
  discovery: 'ctaNode',
  'card-demos': 'demoCardNode',
  'card-dynamic-tours': 'demoCardNode',
  'card-recommended': 'demoCardNode',
}

function CornerGlow() {
  return (
    <svg className="absolute pointer-events-none" style={{ top: -20, left: -20 }} width="120" height="110" viewBox="0 0 203 186" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.3" filter="url(#filter0_f_corner)">
        <path d="M103.383 141.5C85.3834 141.5 74.8834 136.5 71.8834 134C71.2168 127.167 70.2834 112.6 71.8834 109C73.8834 104.5 165.383 107.5 158.383 117.5C151.383 127.5 125.883 141.5 103.383 141.5Z" fill="#9B50CA"/>
      </g>
      <g opacity="0.3" filter="url(#filter1_f_corner)">
        <path d="M65 90C61.8 97.6 49.6667 97.5 44 96.5V44H122.5C121 49.8333 113.5 61.5 95.5 61.5C73 61.5 69 80.5 65 90Z" fill="#FD6331"/>
      </g>
      <defs>
        <filter id="filter0_f_corner" x="27" y="62.9613" width="175.766" height="122.539" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feGaussianBlur stdDeviation="22" result="effect1_foregroundBlur_corner"/>
        </filter>
        <filter id="filter1_f_corner" x="0" y="0" width="166.5" height="140.979" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feGaussianBlur stdDeviation="22" result="effect1_foregroundBlur_corner2"/>
        </filter>
      </defs>
    </svg>
  )
}

const TOOLBAR_W = 45
const TOOLBAR_H = 178
const TOOLBAR_PAD = 16

function clampPos(x: number, y: number, parentW: number, parentH: number) {
  return {
    x: Math.max(TOOLBAR_PAD, Math.min(x, parentW - TOOLBAR_W - TOOLBAR_PAD)),
    y: Math.max(TOOLBAR_PAD, Math.min(y, parentH - TOOLBAR_H - TOOLBAR_PAD)),
  }
}

function ControlsToolbar() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parent = toolbarRef.current?.parentElement
    if (!parent) return
    const observer = new ResizeObserver(() => {
      setPos((prev) => {
        if (!prev) return null
        const rect = parent.getBoundingClientRect()
        return clampPos(prev.x, prev.y, rect.width, rect.height)
      })
    })
    observer.observe(parent)
    return () => observer.disconnect()
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    dragging.current = true
    const rect = toolbarRef.current!.getBoundingClientRect()
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    e.preventDefault()

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !toolbarRef.current) return
      const parent = toolbarRef.current.parentElement!
      const parentRect = parent.getBoundingClientRect()
      const newX = ev.clientX - parentRect.left - offset.current.x
      const newY = ev.clientY - parentRect.top - offset.current.y
      setPos(clampPos(newX, newY, parentRect.width, parentRect.height))
    }
    const onUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  const style: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y }
    : { right: TOOLBAR_PAD, bottom: TOOLBAR_PAD }

  const iconBtn = 'w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(115,113,111,0.15)] cursor-pointer [&>svg]:translate-x-px'

  return (
    <div
      ref={toolbarRef}
      className="absolute z-10"
      style={style}
      onMouseDown={onMouseDown}
    >
      <div
        className="flex flex-col items-center rounded-full border border-[#D0CBC6] bg-white cursor-grab active:cursor-grabbing"
        style={{ width: 45, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      >
        {/* Lock */}
        <button className={`${iconBtn} mt-2`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2.5 15.5C2.0875 15.5 1.7345 15.3533 1.441 15.0598C1.147 14.7658 1 14.4125 1 14V6.5C1 6.0875 1.147 5.7343 1.441 5.4403C1.7345 5.1468 2.0875 5 2.5 5H3.25V3.5C3.25 2.4625 3.6157 1.578 4.3472 0.8465C5.0782 0.1155 5.9625 -0.25 7 -0.25C8.0375 -0.25 8.922 0.1155 9.6535 0.8465C10.3845 1.578 10.75 2.4625 10.75 3.5V5H11.5C11.9125 5 12.2657 5.1468 12.5597 5.4403C12.8532 5.7343 13 6.0875 13 6.5V14C13 14.4125 12.8532 14.7658 12.5597 15.0598C12.2657 15.3533 11.9125 15.5 11.5 15.5H2.5ZM2.5 14H11.5V6.5H2.5V14ZM7 11.75C7.4125 11.75 7.7657 11.6033 8.0597 11.3098C8.3532 11.0158 8.5 10.6625 8.5 10.25C8.5 9.8375 8.3532 9.4843 8.0597 9.1903C7.7657 8.8968 7.4125 8.75 7 8.75C6.5875 8.75 6.2345 8.8968 5.941 9.1903C5.647 9.4843 5.5 9.8375 5.5 10.25C5.5 10.6625 5.647 11.0158 5.941 11.3098C6.2345 11.6033 6.5875 11.75 7 11.75ZM4.75 5H9.25V3.5C9.25 2.875 9.0312 2.3438 8.5937 1.9063C8.1562 1.4688 7.625 1.25 7 1.25C6.375 1.25 5.8437 1.4688 5.4062 1.9063C4.9687 2.3438 4.75 2.875 4.75 3.5V5Z" fill="#172537"/>
          </svg>
        </button>

        {/* Move */}
        <button className={`${iconBtn} mb-1`}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M13.4 2.25H2.6C1.8508 2.25 1.25 2.8508 1.25 3.6V14.4C1.25 15.1493 1.8508 15.75 2.6 15.75H13.4C14.1493 15.75 14.75 15.1493 14.75 14.4V3.6C14.75 2.8508 14.1493 2.25 13.4 2.25ZM13.25 14.25H2.75V3.75H13.25M8.675 6.3V7.65H7.325V6.3H5.975L8 4.275L10.025 6.3M10.7 11.025V9.675H9.35V8.325H10.7V6.975L12.725 9M6.65 9.675H5.3V11.025L3.275 9L5.3 6.975V8.325H6.65M10.025 11.7L8 13.725L5.975 11.7H7.325V10.35H8.675V11.7" fill="#293748"/>
          </svg>
        </button>

        {/* Divider */}
        <div className="w-[36px] h-px bg-[#D0CBC6]" />

        {/* Minus */}
        <button className={`${iconBtn} mt-1`}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3.5 9.75C3.2875 9.75 3.1092 9.678 2.9652 9.534C2.8217 9.391 2.75 9.213 2.75 9C2.75 8.788 2.8217 8.609 2.9652 8.465C3.1092 8.322 3.2875 8.25 3.5 8.25H12.5C12.7125 8.25 12.8905 8.322 13.034 8.465C13.178 8.609 13.25 8.788 13.25 9C13.25 9.213 13.178 9.391 13.034 9.534C12.8905 9.678 12.7125 9.75 12.5 9.75H3.5Z" fill="#293748"/>
          </svg>
        </button>

        {/* Plus */}
        <button className={`${iconBtn} mb-2`}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2.75 9C2.75 8.788 2.822 8.61 2.966 8.466C3.1095 8.322 3.2875 8.25 3.5 8.25L7.25 8.25L7.25 4.5C7.25 4.288 7.322 4.109 7.466 3.965C7.6095 3.822 7.7875 3.75 8 3.75C8.2125 3.75 8.3907 3.822 8.5347 3.965C8.6782 4.109 8.75 4.288 8.75 4.5L8.75 8.25L12.5 8.25C12.7125 8.25 12.8907 8.322 13.0347 8.466C13.1782 8.61 13.25 8.788 13.25 9C13.25 9.213 13.1782 9.391 13.0347 9.535C12.8907 9.678 12.7125 9.75 12.5 9.75L8.75 9.75L8.75 13.5C8.75 13.713 8.6782 13.891 8.5347 14.034C8.3907 14.178 8.2125 14.25 8 14.25C7.7875 14.25 7.6095 14.178 7.466 14.034C7.322 13.891 7.25 13.713 7.25 13.5L7.25 9.75L3.5 9.75C3.2875 9.75 3.1095 9.678 2.966 9.535C2.822 9.391 2.75 9.213 2.75 9Z" fill="#293748"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

function GhostText({ text, onDone }: { text: string; onDone: () => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(false))
    })
    const timer = setTimeout(onDone, 500)
    return () => { cancelAnimationFrame(raf1); clearTimeout(timer) }
  }, [onDone])

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
      style={{
        opacity: visible ? 0.35 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-24px)',
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
      }}
    >
      <div className="text-sm text-gray-900 max-w-lg text-center px-4 whitespace-pre-wrap">
        {text}
      </div>
    </div>
  )
}

function SparkleIcon({ size = 92 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 89 89" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d_welcome)">
        <rect x="19.0464" y="12.4535" width="50.4" height="50.4" rx="25.2" fill="url(#paint0_linear_welcome)" shapeRendering="crispEdges"/>
        <path d="M43.0806 28.0993C43.1186 27.8951 43.4112 27.8951 43.4492 28.0993L43.8704 30.3629C44.4091 33.2584 46.6746 35.5236 49.5704 36.0623L51.8342 36.4835C52.0384 36.5215 52.0384 36.814 51.8342 36.852L49.5704 37.2731C46.6746 37.8118 44.4091 40.0771 43.8704 42.9726L43.4492 45.2362C43.4112 45.4404 43.1186 45.4404 43.0806 45.2362L42.6595 42.9726C42.1207 40.0771 39.8552 37.8118 36.9595 37.2731L34.6956 36.852C34.4914 36.814 34.4914 36.5215 34.6956 36.4835L36.9595 36.0623C39.8552 35.5236 42.1207 33.2584 42.6595 30.3629L43.0806 28.0993Z" fill="white"/>
        <path d="M50.898 40.663C50.9127 40.584 51.0259 40.584 51.0406 40.663L51.2035 41.5386C51.4119 42.6586 52.2883 43.5349 53.4084 43.7433L54.2841 43.9062C54.3631 43.9209 54.3631 44.034 54.2841 44.0487L53.4084 44.2116C52.2883 44.42 51.4119 45.2963 51.2035 46.4163L51.0406 47.2919C51.0259 47.3709 50.9127 47.3709 50.898 47.2919L50.7351 46.4163C50.5267 45.2963 49.6504 44.42 48.5302 44.2116L47.6545 44.0487C47.5755 44.034 47.5755 43.9209 47.6545 43.9062L48.5302 43.7433C49.6504 43.5349 50.5267 42.6586 50.7351 41.5386L50.898 40.663Z" fill="white"/>
      </g>
      <defs>
        <filter id="filter0_d_welcome" x="-0.000131607" y="-1.43051e-06" width="88.4929" height="88.4931" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="6.59303"/>
          <feGaussianBlur stdDeviation="9.52326"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.992157 0 0 0 0 0.45098 0 0 0 0 0.239216 0 0 0 0.36 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_welcome"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_welcome" result="shape"/>
        </filter>
        <linearGradient id="paint0_linear_welcome" x1="19.0464" y1="40.0309" x2="69.4464" y2="40.0309" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB352"/>
          <stop offset="0.5" stopColor="#FC6839"/>
          <stop offset="1" stopColor="#EB2E24"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

interface PopoverCache {
  alternatives: ContentMatch[]
  messages: PopoverMessage[]
  votes: Record<string, 'up' | 'down'>
  activeDemoId?: string
  originalTitle?: string
}

interface ReplacePopoverProps {
  nodeId: string
  title: string
  demoId: string
  anchorRect: { x: number; y: number; width: number; height: number }
  wrapperRef: React.RefObject<HTMLDivElement | null>
  onReplace: (nodeId: string, match: ContentMatch) => void
  onDeselect: (nodeId: string) => void
  onDismiss: () => void
  cachedState?: PopoverCache
  onSaveState?: (nodeId: string, state: PopoverCache) => void
}

const popoverThumbs = [thumbTableHero, thumbContent]
function getPopoverThumb(t: string) {
  let h = 0
  for (let i = 0; i < t.length; i++) h = ((h << 5) - h + t.charCodeAt(i)) | 0
  return popoverThumbs[Math.abs(h) % popoverThumbs.length]
}

const CONF_COLOR: Record<ConfidenceLevel, { icon: string; border: string; bg: string; text: string }> = {
  high: { icon: '#1a7a4c', border: '#86efac', bg: '#f0fdf4', text: '#166534' },
  medium: { icon: '#FC6839', border: '#fdba74', bg: '#fff7ed', text: '#9a3412' },
  low: { icon: '#dc2626', border: '#fca5a5', bg: '#fef2f2', text: '#991b1b' },
}
const CONF_LABEL: Record<ConfidenceLevel, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
}

function PopoverContentCard({
  match,
  cardKey,
  expandedInfo,
  onToggleInfo,
  onReplace,
  isSelected,
}: {
  match: ContentMatch
  cardKey: string
  expandedInfo: Record<string, boolean>
  onToggleInfo: (k: string) => void
  onReplace: (match: ContentMatch) => void
  isSelected?: boolean
}) {
  const colors = CONF_COLOR[match.confidence]
  const isInfoOpen = !!expandedInfo[cardKey]
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="border bg-white overflow-visible" style={{ borderColor: isSelected ? '#FC6839' : '#D0CBC6', borderRadius: 8 }}>
      {showPreview && (
        <PreviewModal url={match.demo.preview} title={match.demo.title} onClose={() => setShowPreview(false)} />
      )}
      <div className="flex items-center" style={{ padding: 16, gap: 12 }}>
        <img src={getPopoverThumb(match.demo.title)} alt="" className="shrink-0 object-cover" style={{ width: 31, height: 31, borderRadius: 4 }} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: '#172537' }}>{match.demo.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs" style={{ color: '#6F6F6F' }}>{match.demo.creator}</span>
            <span className="text-xs font-semibold" style={{ color: '#FC6839' }}>Show more</span>
          </div>
        </div>

        <div className="flex items-center shrink-0" style={{ gap: 10 }}>
          {/* Info icon (outlined) */}
          <div className="relative group/info flex items-center" style={{ '--info-hover': colors.icon } as React.CSSProperties}>
            <button onClick={() => onToggleInfo(cardKey)} className="flex items-center justify-center" style={{ width: 20, height: 20 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="8.25" stroke={isInfoOpen ? colors.icon : '#172537'} strokeWidth="1.5" className="transition-colors group-hover/info:[stroke:var(--info-hover)]"/>
                <path d="M10 9v4.5" stroke={isInfoOpen ? colors.icon : '#172537'} strokeWidth="1.5" strokeLinecap="round" className="transition-colors group-hover/info:[stroke:var(--info-hover)]"/>
                <circle cx="10" cy="6.75" r="0.85" fill={isInfoOpen ? colors.icon : '#172537'} className="transition-colors group-hover/info:[fill:var(--info-hover)]"/>
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/info:opacity-100 transition-opacity shadow-lg z-50" style={{ backgroundColor: '#293748' }}>
              {CONF_LABEL[match.confidence]}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: '#293748' }} />
            </div>
          </div>

          {/* Preview icon */}
          <div className="relative group/preview flex items-center">
            <button className="hover:opacity-70 transition-opacity" onClick={() => setShowPreview(true)}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id={`mask_eye_pop_${cardKey}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="18" height="18">
                  <rect width="18" height="18" fill="#D9D9D9"/>
                </mask>
                <g mask={`url(#mask_eye_pop_${cardKey})`}>
                  <path d="M8.99961 12C9.93711 12 10.7341 11.672 11.3906 11.016C12.0466 10.3595 12.3746 9.5625 12.3746 8.625C12.3746 7.6875 12.0466 6.8905 11.3906 6.234C10.7341 5.578 9.93711 5.25 8.99961 5.25C8.06211 5.25 7.26511 5.578 6.60861 6.234C5.95261 6.8905 5.62461 7.6875 5.62461 8.625C5.62461 9.5625 5.95261 10.3595 6.60861 11.016C7.26511 11.672 8.06211 12 8.99961 12ZM8.99961 10.65C8.43711 10.65 7.95911 10.453 7.56561 10.059C7.17161 9.6655 6.97461 9.1875 6.97461 8.625C6.97461 8.0625 7.17161 7.58425 7.56561 7.19025C7.95911 6.79675 8.43711 6.6 8.99961 6.6C9.56211 6.6 10.0404 6.79675 10.4344 7.19025C10.8279 7.58425 11.0246 8.0625 11.0246 8.625C11.0246 9.1875 10.8279 9.6655 10.4344 10.059C10.0404 10.453 9.56211 10.65 8.99961 10.65ZM8.99961 14.25C7.26211 14.25 5.67461 13.7908 4.23711 12.8723C2.79961 11.9533 1.71211 10.7125 0.974609 9.15C0.937109 9.0875 0.912109 9.00925 0.899609 8.91525C0.887109 8.82175 0.880859 8.725 0.880859 8.625C0.880859 8.525 0.887109 8.428 0.899609 8.334C0.912109 8.2405 0.937109 8.1625 0.974609 8.1C1.71211 6.5375 2.79961 5.297 4.23711 4.3785C5.67461 3.4595 7.26211 3 8.99961 3C10.7371 3 12.3246 3.4595 13.7621 4.3785C15.1996 5.297 16.2871 6.5375 17.0246 8.1C17.0621 8.1625 17.0871 8.2405 17.0996 8.334C17.1121 8.428 17.1184 8.525 17.1184 8.625C17.1184 8.725 17.1121 8.82175 17.0996 8.91525C17.0871 9.00925 17.0621 9.0875 17.0246 9.15C16.2871 10.7125 15.1996 11.9533 13.7621 12.8723C12.3246 13.7908 10.7371 14.25 8.99961 14.25ZM8.99961 12.75C10.4121 12.75 11.7091 12.378 12.8906 11.634C14.0716 10.8905 14.9746 9.8875 15.5996 8.625C14.9746 7.3625 14.0716 6.35925 12.8906 5.61525C11.7091 4.87175 10.4121 4.5 8.99961 4.5C7.58711 4.5 6.29011 4.87175 5.10861 5.61525C3.92761 6.35925 3.02461 7.3625 2.39961 8.625C3.02461 9.8875 3.92761 10.8905 5.10861 11.634C6.29011 12.378 7.58711 12.75 8.99961 12.75Z" fill="#293748"/>
                </g>
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/preview:opacity-100 transition-opacity shadow-lg z-50" style={{ backgroundColor: '#293748' }}>
              Preview
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: '#293748' }} />
            </div>
          </div>

          {/* Add / Selected icon */}
          <div className="relative group/add flex items-center">
            <button onClick={() => onReplace(match)} className="transition-all hover:opacity-80">
              {isSelected ? (
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="28" height="28" rx="14" fill="#61B08B" stroke="#61B08B" strokeWidth="2"/>
                  <mask id={`mask_sel_pop_${cardKey}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="5" y="5" width="20" height="20">
                    <rect x="5" y="5" width="20" height="20" fill="#D9D9D9"/>
                  </mask>
                  <g mask={`url(#mask_sel_pop_${cardKey})`}>
                    <path d="M13.0831 19.6459C12.9719 19.6459 12.8678 19.6284 12.7706 19.5934C12.6733 19.559 12.5831 19.5001 12.4998 19.4167L9.41642 16.3334C9.26364 16.1806 9.19031 15.9826 9.19697 15.7392C9.2042 15.4965 9.28419 15.2987 9.43697 15.1459C9.58975 14.9931 9.7842 14.9167 10.0203 14.9167C10.2564 14.9167 10.4509 14.9931 10.6037 15.1459L13.0831 17.6251L20.1453 10.5626C20.2981 10.4098 20.4962 10.3334 20.7395 10.3334C20.9823 10.3334 21.1801 10.4098 21.3328 10.5626C21.4856 10.7153 21.562 10.9131 21.562 11.1559C21.562 11.3993 21.4856 11.5973 21.3328 11.7501L13.6664 19.4167C13.5831 19.5001 13.4928 19.559 13.3956 19.5934C13.2984 19.6284 13.1942 19.6459 13.0831 19.6459Z" fill="white"/>
                  </g>
                </svg>
              ) : (
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="28" height="28" rx="14" stroke="#FC6839" strokeWidth="2" fill="none"/>
                  <mask id={`mask_add_pop_${cardKey}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="6" y="6" width="18" height="18">
                    <rect x="6" y="6" width="18" height="18" fill="#D9D9D9"/>
                  </mask>
                  <g mask={`url(#mask_add_pop_${cardKey})`}>
                    <path d="M15 20.25C14.7875 20.25 14.6095 20.178 14.466 20.034C14.322 19.8905 14.25 19.7125 14.25 19.5V15.75H10.5C10.2875 15.75 10.1093 15.678 9.96525 15.534C9.82175 15.3905 9.75 15.2125 9.75 15C9.75 14.7875 9.82175 14.6093 9.96525 14.4653C10.1093 14.3218 10.2875 14.25 10.5 14.25H14.25V10.5C14.25 10.2875 14.322 10.1093 14.466 9.96525C14.6095 9.82175 14.7875 9.75 15 9.75C15.2125 9.75 15.3908 9.82175 15.5348 9.96525C15.6783 10.1093 15.75 10.2875 15.75 10.5V14.25H19.5C19.7125 14.25 19.8905 14.3218 20.034 14.4653C20.178 14.6093 20.25 14.7875 20.25 15C20.25 15.2125 20.178 15.3905 20.034 15.534C19.8905 15.678 19.7125 15.75 19.5 15.75H15.75V19.5C15.75 19.7125 15.6783 19.8905 15.5348 20.034C15.3908 20.178 15.2125 20.25 15 20.25Z" fill="#F44C10"/>
                  </g>
                </svg>
              )}
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/add:opacity-100 transition-opacity shadow-lg z-50" style={{ backgroundColor: '#293748' }}>
              {isSelected ? 'Selected' : 'Add'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: '#293748' }} />
            </div>
          </div>
        </div>
      </div>

      {isInfoOpen && (
        <div className="px-3 py-2.5 rounded-lg text-xs border" style={{ margin: '0 16px 16px', borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }}>
          <strong>Why this content:</strong> {match.relevanceReason}
        </div>
      )}
    </div>
  )
}

interface PopoverMessage {
  role: 'ai' | 'user'
  text: string
  results?: ContentMatch[]
  loading?: boolean
}

function ReplacePopover({ nodeId, title, demoId, anchorRect, wrapperRef, onReplace, onDeselect, onDismiss, cachedState, onSaveState }: ReplacePopoverProps) {
  const [alternatives, setAlternatives] = useState<ContentMatch[]>(cachedState?.alternatives ?? [])
  const [loading, setLoading] = useState(!cachedState)
  const [expandedInfo, setExpandedInfo] = useState<Record<string, boolean>>({})
  const popoverRef = useRef<HTMLDivElement>(null)
  const [liveRect, setLiveRect] = useState(anchorRect)
  const [popoverWidth, setPopoverWidth] = useState(380)
  const resizing = useRef<{ startX: number; startW: number } | null>(null)
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<PopoverMessage[]>(cachedState?.messages ?? [])
  const [votes, setVotes] = useState<Record<string, 'up' | 'down'>>(cachedState?.votes ?? {})
  const [activeDemoId, setActiveDemoId] = useState(cachedState?.activeDemoId ?? demoId)
  const [inputFocused, setInputFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [inputText])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const usedIds = useRef(new Set<string>([demoId]))
  const { isListening, toggle: toggleVoice, isSupported: voiceSupported, analyserRef } = useSpeechRecognition(
    useCallback((text: string) => setInputText(text), []),
  )

  const updateScrollShadows = useCallback(() => {
    const el = scrollAreaRef.current
    if (!el) return
    setCanScrollUp(el.scrollTop > 4)
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4)
  }, [])

  type PopoverAnim = 'start' | 'expand-width' | 'expand-height' | 'content-in' | 'idle'
  const [anim, setAnim] = useState<PopoverAnim>('start')
  const POPOVER_COLLAPSED_W = 48
  const POPOVER_COLLAPSED_H = 48
  const POPOVER_FULL_W = popoverWidth
  const POPOVER_FULL_H_DEFAULT = 480

  useEffect(() => {
    const t1 = setTimeout(() => setAnim('expand-width'), 50)
    const t2 = setTimeout(() => setAnim('expand-height'), 350)
    const t3 = setTimeout(() => setAnim('content-in'), 700)
    const t4 = setTimeout(() => setAnim('idle'), 1000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  const handleSend = () => {
    const text = inputText.trim()
    if (!text) return
    setInputText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'ai', text: '', loading: true },
    ])

    setTimeout(() => {
      const results = searchContent(text, usedIds.current, 4)
      results.forEach((r) => usedIds.current.add(r.demo.id))

      const aiText = results.length > 0
        ? `I found ${results.length} option${results.length !== 1 ? 's' : ''} matching "${text}":`
        : `I couldn't find content matching "${text}". Try describing the topic differently or being more specific.`

      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'ai', text: aiText, results: results.length > 0 ? results : undefined }
        return updated
      })
    }, 600)
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizing.current) return
      const delta = e.clientX - resizing.current.startX
      setPopoverWidth(Math.max(320, resizing.current.startW + delta))
    }
    const onUp = () => { resizing.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  useEffect(() => {
    let raf: number
    const track = () => {
      const wrapper = wrapperRef.current
      if (!wrapper) { raf = requestAnimationFrame(track); return }
      const el = wrapper.querySelector(`[data-id="${nodeId}"]`) as HTMLElement | null
      if (el) {
        const wrapperRect = wrapper.getBoundingClientRect()
        const nodeRect = el.getBoundingClientRect()
        setLiveRect({
          x: nodeRect.left - wrapperRect.left,
          y: nodeRect.top - wrapperRect.top,
          width: nodeRect.width,
          height: nodeRect.height,
        })
      }
      raf = requestAnimationFrame(track)
    }
    raf = requestAnimationFrame(track)
    return () => cancelAnimationFrame(raf)
  }, [nodeId, wrapperRef])

  const initialDemoId = useRef(demoId)
  const initialTitle = useRef(cachedState?.originalTitle ?? title)
  const hadCache = useRef(!!cachedState)
  const stateRef = useRef({ alternatives, messages, votes, activeDemoId, originalTitle: initialTitle.current })
  useEffect(() => { stateRef.current = { alternatives, messages, votes, activeDemoId, originalTitle: initialTitle.current } }, [alternatives, messages, votes, activeDemoId])
  const nodeIdRef = useRef(nodeId)
  useEffect(() => {
    const prevId = nodeIdRef.current
    nodeIdRef.current = nodeId
    if (prevId !== nodeId && onSaveState) {
      onSaveState(nodeId, stateRef.current)
    }
  }, [nodeId, onSaveState])
  useEffect(() => {
    return () => {
      if (onSaveState) onSaveState(nodeIdRef.current, stateRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (hadCache.current) return
    setLoading(true)
    const timer = setTimeout(() => {
      setAlternatives(findReplacements(initialDemoId.current, initialTitle.current, 3))
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as HTMLElement)) {
        onDismiss()
      }
    }
    const escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss() }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler)
    }, 100)
    document.addEventListener('keydown', escHandler)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', escHandler)
    }
  }, [onDismiss])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(updateScrollShadows, 100)
  }, [messages, updateScrollShadows])

  useEffect(() => {
    const el = scrollAreaRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollShadows, { passive: true })
    const ro = new ResizeObserver(updateScrollShadows)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', updateScrollShadows); ro.disconnect() }
  }, [updateScrollShadows])

  const toggleInfo = (k: string) => setExpandedInfo((prev) => ({ ...prev, [k]: !prev[k] }))

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden"
      style={{
        left: liveRect.x + (liveRect.width / 2) + 25 + 8,
        top: liveRect.y + liveRect.height + 16,
        width: anim === 'start' ? POPOVER_COLLAPSED_W : (anim === 'expand-width' ? POPOVER_FULL_W : popoverWidth),
        height: anim === 'start' || anim === 'expand-width'
          ? POPOVER_COLLAPSED_H
          : anim === 'expand-height'
            ? POPOVER_FULL_H_DEFAULT
            : 'auto',
        transition: anim === 'expand-width'
          ? 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          : anim === 'expand-height'
            ? 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
            : anim === 'idle'
              ? undefined
              : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: 12,
      }}
    >
      {/* Right-edge resize handle */}
      {anim === 'idle' && (
        <div
          className="absolute top-0 right-0 w-2 h-full cursor-ew-resize z-10"
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            resizing.current = { startX: e.clientX, startW: popoverWidth }
          }}
        />
      )}
      <div className="p-2 flex flex-col" style={{
        opacity: anim === 'content-in' || anim === 'idle' ? 1 : 0,
        transition: anim === 'content-in' ? 'opacity 0.3s ease' : undefined,
        height: anim === 'idle' ? 'calc(100% - 4px)' : undefined,
      }}>
      <div className="flex items-center pt-3 pb-2" style={{ paddingLeft: 14, paddingRight: 16 }}>
        <div className="flex items-center shrink-0" style={{ marginRight: 12 }}>
          <svg width="28" height="28" viewBox="14 8 62 62" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="19.0464" y="12.4535" width="50.4" height="50.4" rx="25.2" fill="url(#paint_popover_sparkle)"/>
            <path d="M43.0806 28.0993C43.1186 27.8951 43.4112 27.8951 43.4492 28.0993L43.8704 30.3629C44.4091 33.2584 46.6746 35.5236 49.5704 36.0623L51.8342 36.4835C52.0384 36.5215 52.0384 36.814 51.8342 36.852L49.5704 37.2731C46.6746 37.8118 44.4091 40.0771 43.8704 42.9726L43.4492 45.2362C43.4112 45.4404 43.1186 45.4404 43.0806 45.2362L42.6595 42.9726C42.1207 40.0771 39.8552 37.8118 36.9595 37.2731L34.6956 36.852C34.4914 36.814 34.4914 36.5215 34.6956 36.4835L36.9595 36.0623C39.8552 35.5236 42.1207 33.2584 42.6595 30.3629L43.0806 28.0993Z" fill="white"/>
            <path d="M50.898 40.663C50.9127 40.584 51.0259 40.584 51.0406 40.663L51.2035 41.5386C51.4119 42.6586 52.2883 43.5349 53.4084 43.7433L54.2841 43.9062C54.3631 43.9209 54.3631 44.034 54.2841 44.0487L53.4084 44.2116C52.2883 44.42 51.4119 45.2963 51.2035 46.4163L51.0406 47.2919C51.0259 47.3709 50.9127 47.3709 50.898 47.2919L50.7351 46.4163C50.5267 45.2963 49.6504 44.42 48.5302 44.2116L47.6545 44.0487C47.5755 44.034 47.5755 43.9209 47.6545 43.9062L48.5302 43.7433C49.6504 43.5349 50.5267 42.6586 50.7351 41.5386L50.898 40.663Z" fill="white"/>
            <defs>
              <linearGradient id="paint_popover_sparkle" x1="19.0464" y1="40.0309" x2="69.4464" y2="40.0309" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFB352"/><stop offset="0.5" stopColor="#FC6839"/><stop offset="1" stopColor="#EB2E24"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-base font-semibold whitespace-nowrap leading-none" style={{ color: '#FC6839', marginLeft: -2 }}>Replace this content?</span>
        <button onClick={onDismiss} className="ml-auto p-1 rounded hover:bg-gray-100 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1 1 13" stroke="#6F6F6F" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-3 z-10 pointer-events-none transition-opacity duration-200" style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(0,0,0,0.06) 0%, transparent 100%)', opacity: canScrollUp ? 1 : 0 }} />
        <div className="absolute bottom-0 left-0 right-0 h-3 z-10 pointer-events-none transition-opacity duration-200" style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 100%, rgba(0,0,0,0.06) 0%, transparent 100%)', opacity: canScrollDown ? 1 : 0 }} />
      <div ref={scrollAreaRef} className="h-full overflow-y-auto px-4 py-4 flex flex-col" style={{ maxHeight: 400 }} onScroll={updateScrollShadows}>
        <p className="text-sm text-gray-900 mb-6">
          Here are alternatives I found for <span className="font-medium">&ldquo;{initialTitle.current.length > 40 ? initialTitle.current.slice(0, 37) + '...' : initialTitle.current}&rdquo;</span>
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-4 justify-center text-xs text-gray-400">
            <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
            Finding alternatives...
          </div>
        ) : alternatives.length === 0 ? (
          <p className="text-xs text-gray-400 py-3 text-center">No alternatives found.</p>
        ) : (
          <div className="flex flex-col" style={{ gap: 12 }}>
            {alternatives.map((alt, i) => (
              <PopoverContentCard
                key={alt.demo.id}
                match={alt}
                cardKey={`pop-${i}`}
                expandedInfo={expandedInfo}
                onToggleInfo={toggleInfo}
                onReplace={(m) => {
                  if (m.demo.id === activeDemoId) {
                    setActiveDemoId('')
                    onDeselect(nodeId)
                  } else {
                    setActiveDemoId(m.demo.id)
                    onReplace(nodeId, m)
                  }
                }}
                isSelected={alt.demo.id === activeDemoId}
              />
            ))}
          </div>
        )}
        {!loading && alternatives.length > 0 && (
          <div className="flex items-center" style={{ gap: 16, marginTop: 16 }}>
            <button onClick={() => setVotes((v) => ({ ...v, initial: 'up' }))} className="hover:opacity-70 transition-opacity">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id="mask_pop_vup_init" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask>
                <g mask="url(#mask_pop_vup_init)"><path d="M15.0003 17.5H5.83366V6.66665L11.667 0.833313L12.7087 1.87498C12.8059 1.9722 12.8857 2.10415 12.9482 2.27081C13.0107 2.43748 13.042 2.5972 13.042 2.74998V3.04165L12.1253 6.66665H17.5003C17.9448 6.66665 18.3337 6.83331 18.667 7.16665C19.0003 7.49998 19.167 7.88887 19.167 8.33331V9.99998C19.167 10.0972 19.1531 10.2014 19.1253 10.3125C19.0975 10.4236 19.0698 10.5278 19.042 10.625L16.542 16.5C16.417 16.7778 16.2087 17.0139 15.917 17.2083C15.6253 17.4028 15.3198 17.5 15.0003 17.5ZM7.50033 15.8333H15.0003L17.5003 9.99998V8.33331H10.0003L11.1253 3.74998L7.50033 7.37498V15.8333ZM5.83366 6.66665V8.33331H3.33366V15.8333H5.83366V17.5H1.66699V6.66665H5.83366Z" fill={votes.initial === 'up' ? '#FC6839' : '#8D8A87'}/></g>
              </svg>
            </button>
            <button onClick={() => setVotes((v) => ({ ...v, initial: 'down' }))} className="hover:opacity-70 transition-opacity">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id="mask_pop_vdn_init" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask>
                <g mask="url(#mask_pop_vdn_init)"><path d="M4.99967 2.5H14.1663V13.3333L8.33301 19.1667L7.29134 18.125C7.19412 18.0278 7.11426 17.8958 7.05176 17.7292C6.98926 17.5625 6.95801 17.4028 6.95801 17.25V16.9583L7.87467 13.3333H2.49967C2.05523 13.3333 1.66634 13.1667 1.33301 12.8333C0.999674 12.5 0.833008 12.1111 0.833008 11.6667V10C0.833008 9.90278 0.846897 9.79861 0.874674 9.6875C0.902452 9.57639 0.93023 9.47222 0.958008 9.375L3.45801 3.5C3.58301 3.22222 3.79134 2.98611 4.08301 2.79167C4.37467 2.59722 4.68023 2.5 4.99967 2.5ZM12.4997 4.16667H4.99967L2.49967 10V11.6667H9.99967L8.87467 16.25L12.4997 12.625V4.16667ZM14.1663 13.3333V11.6667H16.6663V4.16667H14.1663V2.5H18.333V13.3333H14.1663Z" fill={votes.initial === 'down' ? '#FC6839' : '#8D8A87'}/></g>
              </svg>
            </button>
          </div>
        )}

        {/* Conversation messages */}
        {messages.map((msg, mi) => (
          <div key={mi} style={{ marginTop: 16 }}>
            {msg.role === 'user' ? (
              <div className="flex flex-col items-end gap-1">
                <div className="px-4 py-3 text-sm max-w-[85%] whitespace-pre-wrap" style={{ backgroundColor: '#FFF0E5', color: '#1a1a1a', border: '1px solid #FFD4B0', borderRadius: 8 }}>
                  {msg.text}
                </div>
                <div className="flex items-center gap-1 mr-1 mt-1">
                  <button className="hover:opacity-70 transition-opacity">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <mask id={`mask_pop_copy_${mi}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><rect width="20" height="20" fill="#D9D9D9"/></mask>
                      <g mask={`url(#mask_pop_copy_${mi})`}><path d="M7.5 15C7.04167 15 6.64944 14.8369 6.32333 14.5108C5.99667 14.1842 5.83333 13.7917 5.83333 13.3333V3.33332C5.83333 2.87499 5.99667 2.48249 6.32333 2.15582C6.64944 1.82971 7.04167 1.66666 7.5 1.66666H15C15.4583 1.66666 15.8508 1.82971 16.1775 2.15582C16.5036 2.48249 16.6667 2.87499 16.6667 3.33332V13.3333C16.6667 13.7917 16.5036 14.1842 16.1775 14.5108C15.8508 14.8369 15.4583 15 15 15H7.5ZM7.5 13.3333H15V3.33332H7.5V13.3333ZM4.16667 18.3333C3.70833 18.3333 3.31583 18.1703 2.98917 17.8442C2.66306 17.5175 2.5 17.125 2.5 16.6667V5.83332C2.5 5.59721 2.58 5.39916 2.74 5.23916C2.89944 5.07971 3.09722 4.99999 3.33333 4.99999C3.56944 4.99999 3.7675 5.07971 3.9275 5.23916C4.08694 5.39916 4.16667 5.59721 4.16667 5.83332V16.6667H12.5C12.7361 16.6667 12.9342 16.7467 13.0942 16.9067C13.2536 17.0661 13.3333 17.2639 13.3333 17.5C13.3333 17.7361 13.2536 17.9339 13.0942 18.0933C12.9342 18.2533 12.7361 18.3333 12.5 18.3333H4.16667Z" fill="#6F6F6F"/></g>
                    </svg>
                  </button>
                  <button className="hover:opacity-70 transition-opacity">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <mask id={`mask_pop_edit_${mi}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><rect width="20" height="20" fill="#D9D9D9"/></mask>
                      <g mask={`url(#mask_pop_edit_${mi})`}><path d="M4.16667 15.8334H5.33333L12.5208 8.64585L11.3542 7.47919L4.16667 14.6667V15.8334ZM16.0833 7.43752L12.5417 3.93752L13.7083 2.77085C14.0278 2.45141 14.4203 2.29169 14.8858 2.29169C15.3508 2.29169 15.7431 2.45141 16.0625 2.77085L17.2292 3.93752C17.5486 4.25696 17.7153 4.64252 17.7292 5.09419C17.7431 5.5453 17.5903 5.93058 17.2708 6.25002L16.0833 7.43752ZM3.33333 17.5C3.09722 17.5 2.89944 17.42 2.74 17.26C2.58 17.1006 2.5 16.9028 2.5 16.6667V14.3125C2.5 14.2014 2.52083 14.0939 2.5625 13.99C2.60417 13.8856 2.66667 13.7917 2.75 13.7084L11.3333 5.12502L14.875 8.66669L6.29167 17.25C6.20833 17.3334 6.11472 17.3959 6.01083 17.4375C5.90639 17.4792 5.79861 17.5 5.6875 17.5H3.33333Z" fill="#6F6F6F"/></g>
                    </svg>
                  </button>
                  <button className="hover:opacity-70 transition-opacity">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <mask id={`mask_pop_del_${mi}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><rect width="20" height="20" fill="#D9D9D9"/></mask>
                      <g mask={`url(#mask_pop_del_${mi})`}><path d="M5.83301 17.5C5.37467 17.5 4.98245 17.3369 4.65634 17.0108C4.32967 16.6842 4.16634 16.2917 4.16634 15.8333V5C3.93023 5 3.73217 4.92028 3.57217 4.76083C3.41273 4.60083 3.33301 4.40278 3.33301 4.16667C3.33301 3.93056 3.41273 3.7325 3.57217 3.5725C3.73217 3.41306 3.93023 3.33333 4.16634 3.33333H7.49967C7.49967 3.09722 7.57967 2.89917 7.73967 2.73917C7.89912 2.57972 8.0969 2.5 8.33301 2.5H11.6663C11.9025 2.5 12.1005 2.57972 12.2605 2.73917C12.42 2.89917 12.4997 3.09722 12.4997 3.33333H15.833C16.0691 3.33333 16.2669 3.41306 16.4263 3.5725C16.5863 3.7325 16.6663 3.93056 16.6663 4.16667C16.6663 4.40278 16.5863 4.60083 16.4263 4.76083C16.2669 4.92028 16.0691 5 15.833 5V15.8333C15.833 16.2917 15.67 16.6842 15.3438 17.0108C15.0172 17.3369 14.6247 17.5 14.1663 17.5H5.83301ZM5.83301 5V15.8333H14.1663V5H5.83301ZM7.49967 13.3333C7.49967 13.5694 7.57967 13.7672 7.73967 13.9267C7.89912 14.0867 8.0969 14.1667 8.33301 14.1667C8.56912 14.1667 8.76717 14.0867 8.92717 13.9267C9.08662 13.7672 9.16634 13.5694 9.16634 13.3333V7.5C9.16634 7.26389 9.08662 7.06583 8.92717 6.90583C8.76717 6.74639 8.56912 6.66667 8.33301 6.66667C8.0969 6.66667 7.89912 6.74639 7.73967 6.90583C7.57967 7.06583 7.49967 7.26389 7.49967 7.5V13.3333ZM10.833 13.3333C10.833 13.5694 10.913 13.7672 11.073 13.9267C11.2325 14.0867 11.4302 14.1667 11.6663 14.1667C11.9025 14.1667 12.1005 14.0867 12.2605 13.9267C12.42 13.7672 12.4997 13.5694 12.4997 13.3333V7.5C12.4997 7.26389 12.42 7.06583 12.2605 6.90583C12.1005 6.74639 11.9025 6.66667 11.6663 6.66667C11.4302 6.66667 11.2325 6.74639 11.073 6.90583C10.913 7.06583 10.833 7.26389 10.833 7.5V13.3333Z" fill="#6F6F6F"/></g>
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 items-start">
                <svg width="20" height="20" viewBox="14 8 62 62" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ marginTop: -2 }}>
                  <rect x="19.0464" y="12.4535" width="50.4" height="50.4" rx="25.2" fill="url(#paint_pop_msg)"/>
                  <path d="M43.0806 28.0993C43.1186 27.8951 43.4112 27.8951 43.4492 28.0993L43.8704 30.3629C44.4091 33.2584 46.6746 35.5236 49.5704 36.0623L51.8342 36.4835C52.0384 36.5215 52.0384 36.814 51.8342 36.852L49.5704 37.2731C46.6746 37.8118 44.4091 40.0771 43.8704 42.9726L43.4492 45.2362C43.4112 45.4404 43.1186 45.4404 43.0806 45.2362L42.6595 42.9726C42.1207 40.0771 39.8552 37.8118 36.9595 37.2731L34.6956 36.852C34.4914 36.814 34.4914 36.5215 34.6956 36.4835L36.9595 36.0623C39.8552 35.5236 42.1207 33.2584 42.6595 30.3629L43.0806 28.0993Z" fill="white"/>
                  <path d="M50.898 40.663C50.9127 40.584 51.0259 40.584 51.0406 40.663L51.2035 41.5386C51.4119 42.6586 52.2883 43.5349 53.4084 43.7433L54.2841 43.9062C54.3631 43.9209 54.3631 44.034 54.2841 44.0487L53.4084 44.2116C52.2883 44.42 51.4119 45.2963 51.2035 46.4163L51.0406 47.2919C51.0259 47.3709 50.9127 47.3709 50.898 47.2919L50.7351 46.4163C50.5267 45.2963 49.6504 44.42 48.5302 44.2116L47.6545 44.0487C47.5755 44.034 47.5755 43.9209 47.6545 43.9062L48.5302 43.7433C49.6504 43.5349 50.5267 42.6586 50.7351 41.5386L50.898 40.663Z" fill="white"/>
                  <defs><linearGradient id="paint_pop_msg" x1="19.0464" y1="40.0309" x2="69.4464" y2="40.0309" gradientUnits="userSpaceOnUse"><stop stopColor="#FFB352"/><stop offset="0.5" stopColor="#FC6839"/><stop offset="1" stopColor="#EB2E24"/></linearGradient></defs>
                </svg>
                <div className="flex-1 min-w-0">
                  {msg.loading ? (
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#FC6839' }}>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-orange-200 rounded-full animate-spin" style={{ borderTopColor: '#FC6839' }} />
                      Searching...
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700">{msg.text}</p>
                      {msg.results && (
                        <div className="flex flex-col mt-2" style={{ gap: 12 }}>
                          {msg.results.map((r, ri) => (
                            <PopoverContentCard
                              key={r.demo.id}
                              match={r}
                              cardKey={`msg-${mi}-${ri}`}
                              expandedInfo={expandedInfo}
                              onToggleInfo={toggleInfo}
                              onReplace={(m) => {
                                if (m.demo.id === activeDemoId) {
                                  setActiveDemoId('')
                                  onDeselect(nodeId)
                                } else {
                                  setActiveDemoId(m.demo.id)
                                  onReplace(nodeId, m)
                                }
                              }}
                              isSelected={r.demo.id === activeDemoId}
                            />
                          ))}
                        </div>
                      )}
                      {msg.results && (
                        <div className="flex items-center" style={{ gap: 16, marginTop: 16 }}>
                          <button onClick={() => setVotes((v) => ({ ...v, [mi]: 'up' }))} className="hover:opacity-70 transition-opacity">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <mask id={`mask_pop_vup_${mi}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask>
                              <g mask={`url(#mask_pop_vup_${mi})`}><path d="M15.0003 17.5H5.83366V6.66665L11.667 0.833313L12.7087 1.87498C12.8059 1.9722 12.8857 2.10415 12.9482 2.27081C13.0107 2.43748 13.042 2.5972 13.042 2.74998V3.04165L12.1253 6.66665H17.5003C17.9448 6.66665 18.3337 6.83331 18.667 7.16665C19.0003 7.49998 19.167 7.88887 19.167 8.33331V9.99998C19.167 10.0972 19.1531 10.2014 19.1253 10.3125C19.0975 10.4236 19.0698 10.5278 19.042 10.625L16.542 16.5C16.417 16.7778 16.2087 17.0139 15.917 17.2083C15.6253 17.4028 15.3198 17.5 15.0003 17.5ZM7.50033 15.8333H15.0003L17.5003 9.99998V8.33331H10.0003L11.1253 3.74998L7.50033 7.37498V15.8333ZM5.83366 6.66665V8.33331H3.33366V15.8333H5.83366V17.5H1.66699V6.66665H5.83366Z" fill={votes[mi] === 'up' ? '#FC6839' : '#8D8A87'}/></g>
                            </svg>
                          </button>
                          <button onClick={() => setVotes((v) => ({ ...v, [mi]: 'down' }))} className="hover:opacity-70 transition-opacity">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <mask id={`mask_pop_vdn_${mi}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask>
                              <g mask={`url(#mask_pop_vdn_${mi})`}><path d="M4.99967 2.5H14.1663V13.3333L8.33301 19.1667L7.29134 18.125C7.19412 18.0278 7.11426 17.8958 7.05176 17.7292C6.98926 17.5625 6.95801 17.4028 6.95801 17.25V16.9583L7.87467 13.3333H2.49967C2.05523 13.3333 1.66634 13.1667 1.33301 12.8333C0.999674 12.5 0.833008 12.1111 0.833008 11.6667V10C0.833008 9.90278 0.846897 9.79861 0.874674 9.6875C0.902452 9.57639 0.93023 9.47222 0.958008 9.375L3.45801 3.5C3.58301 3.22222 3.79134 2.98611 4.08301 2.79167C4.37467 2.59722 4.68023 2.5 4.99967 2.5ZM12.4997 4.16667H4.99967L2.49967 10V11.6667H9.99967L8.87467 16.25L12.4997 12.625V4.16667ZM14.1663 13.3333V11.6667H16.6663V4.16667H14.1663V2.5H18.333V13.3333H14.1663Z" fill={votes[mi] === 'down' ? '#FC6839' : '#8D8A87'}/></g>
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      </div>

      {/* Input field */}
      <div className="p-4">
        <div
          className="bg-white flex flex-col transition-shadow duration-200"
          style={{
            borderRadius: 6,
            border: inputFocused ? '2px solid #F44C10' : '1px solid #D0CBC6',
            boxShadow: inputFocused ? '0 0 0 5px rgba(255, 150, 89, 0.5)' : 'none',
            padding: inputFocused ? 0 : 1,
          }}
        >
          <div className="flex-1 px-4 pt-3 pb-1">
            <textarea
              ref={textareaRef}
              autoFocus
              value={inputText}
              placeholder="What kind of content are you looking for?"
              className="w-full resize-none outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-transparent overflow-hidden"
              rows={1}
              style={{ maxHeight: 120 }}
              onChange={(e) => {
                setInputText(e.target.value)
                const el = e.target
                el.style.height = 'auto'
                el.style.height = el.scrollHeight + 'px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </div>
          <div className="flex items-center px-4 pb-3">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { toggleVoice(); textareaRef.current?.focus() }}
              disabled={!voiceSupported}
              className={`shrink-0 transition-colors ${
                isListening
                  ? 'text-red-500 animate-pulse'
                  : voiceSupported
                    ? 'text-gray-400 hover:text-gray-600'
                    : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
            <div className="flex-1" style={{ padding: '0 24px' }}>
              <AudioWaveform analyserRef={analyserRef} active={isListening} />
            </div>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSend}
              className="shrink-0 transition-colors"
              style={{ color: inputText.trim() ? '#FC6839' : '#d1d5db' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
      </div>

    </div>
  )
}

export default function FlowCanvas({ onContentChange }: { onContentChange?: (hasContent: boolean) => void }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const { screenToFlowPosition, getNodes, getEdges } = useReactFlow()
  const updateNodeInternals = useUpdateNodeInternals()
  const [chatOpen, setChatOpen] = useState(false)
  const [panelHeight, setPanelHeight] = useState(600)

  const COLLAPSED_W = 320
  const COLLAPSED_H = 48
  const PANEL_W = 440

  type PanelAnim = 'idle' | 'expand-width' | 'expand-height' | 'content-in' | 'content-out' | 'collapse-height' | 'collapse-width'
  const [panelAnim, setPanelAnim] = useState<PanelAnim>('idle')
  const [panelW, setPanelW] = useState(COLLAPSED_W)
  const [panelH, setPanelH] = useState(COLLAPSED_H)
  const [contentVisible, setContentVisible] = useState(false)
  const [helperVisible, setHelperVisible] = useState(true)
  const [hasChatStarted, setHasChatStarted] = useState(false)
  const [removedDemoIds, setRemovedDemoIds] = useState<string[]>([])
  const chatNodeIdsRef = useRef<Set<string>>(new Set())
  const vacatedSlotsRef = useRef<Map<string, { ctaNodeId: string; sourceHandle: string; position: { x: number; y: number } }>>(new Map())
  const popoverCacheRef = useRef<Map<string, { alternatives: ContentMatch[]; messages: PopoverMessage[]; votes: Record<string, 'up' | 'down'> }>>(new Map())

  const canvasState = useMemo<CanvasState>(() => ({
    hasDemoCards: nodes.some((n) => n.type === 'demoCardNode'),
    demoCardCount: nodes.filter((n) => n.type === 'demoCardNode').length,
    hasDiscoveryQuestion: nodes.some((n) => n.type === 'ctaNode'),
    hasFullScreenDialog: nodes.some((n) => n.type === 'fullScreenDialogNode'),
    hasStartNode: nodes.some((n) => n.type === 'startNode'),
    nodeCount: nodes.length,
    edgeCount: edges.length,
  }), [nodes, edges])
  const panelResizing = useRef(false)
  const [isResizing, setIsResizing] = useState(false)
  const panelResizeStart = useRef({ y: 0, h: 0 })
  const prevNodeCount = useRef(0)
  const [ghostText, setGhostText] = useState<string | null>(null)
  const [inputBottom, setInputBottom] = useState(false)
  const headingRef = useRef<HTMLDivElement>(null)
  const chatWrapRef = useRef<HTMLDivElement>(null)

  type TransitionPhase = 'none' | 'stage-fading' | 'bar-reveal' | 'panel-opening' | 'done'
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>('none')
  const hasTransitioned = useRef(false)
  const pendingNodesRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null)

  const [replaceTarget, setReplaceTarget] = useState<{
    nodeId: string
    title: string
    demoId: string
    anchorRect: { x: number; y: number; width: number; height: number }
  } | null>(null)

  const showWelcome = nodes.length === 0 && transitionPhase === 'none'
  const isWelcomeMode = showWelcome || transitionPhase === 'stage-fading'

  const startPanelTransition = useCallback(() => {
    if (hasTransitioned.current) return
    hasTransitioned.current = true
    setTransitionPhase('stage-fading')

    const headingEl = headingRef.current
    const chatWrapEl = chatWrapRef.current
    const wrapperEl = headingEl?.parentElement

    // Step 1: Chat content disappears quickly (100ms)
    const scrollAreaEl = chatWrapEl?.querySelector('[data-scroll-area]') as HTMLElement | null
    if (scrollAreaEl) {
      scrollAreaEl.style.transition = 'opacity 0.1s ease'
      scrollAreaEl.style.opacity = '0'
    }

    // Step 2: After content gone, sparkle+heading animate down toward center (500ms)
    setTimeout(() => {
      if (headingEl && wrapperEl) {
        const wrapperRect = wrapperEl.getBoundingClientRect()
        const headingRect = headingEl.getBoundingClientRect()
        const centerY = wrapperRect.top + wrapperRect.height / 2
        const headingDelta = centerY - headingRect.top - headingRect.height / 2
        headingEl.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.12s ease'
        headingEl.style.transform = `translateY(${headingDelta * 0.85}px)`
      }

      // Step 3: Input animates up toward center (500ms)
      const inputEl = chatWrapEl?.querySelector('[data-chat-input]') as HTMLElement | null
      if (inputEl && wrapperEl) {
        const wrapperRect = wrapperEl.getBoundingClientRect()
        const inputRect = inputEl.getBoundingClientRect()
        const centerY = wrapperRect.top + wrapperRect.height / 2
        const inputDelta = centerY - inputRect.top - inputRect.height / 2
        inputEl.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.12s ease'
        inputEl.style.transform = `translateY(${inputDelta * 0.85}px)`
      }

      // Step 4: Fade out while still approaching each other
      setTimeout(() => {
        if (headingEl) headingEl.style.opacity = '0'
        const inputEl2 = chatWrapEl?.querySelector('[data-chat-input]') as HTMLElement | null
        if (inputEl2) inputEl2.style.opacity = '0'
      }, 100)
    }, 120)

    // Step 5: Clean up inline styles and start panel animation
    setTimeout(() => {
      // Reset all direct DOM style overrides so React can take over
      if (headingEl) {
        headingEl.style.transition = ''
        headingEl.style.transform = ''
        headingEl.style.opacity = ''
      }
      const scrollArea2 = chatWrapEl?.querySelector('[data-scroll-area]') as HTMLElement | null
      if (scrollArea2) {
        scrollArea2.style.transition = ''
        scrollArea2.style.opacity = ''
      }
      const inputEl3 = chatWrapEl?.querySelector('[data-chat-input]') as HTMLElement | null
      if (inputEl3) {
        inputEl3.style.transition = ''
        inputEl3.style.transform = ''
        inputEl3.style.opacity = ''
      }
      setTransitionPhase('bar-reveal')
    }, 750)

    setTimeout(() => {
      setTransitionPhase('panel-opening')
      setChatOpen(true)

      const fullH = reactFlowWrapper.current?.getBoundingClientRect().height
        ? reactFlowWrapper.current.getBoundingClientRect().height - 32
        : 600
      setPanelHeight(fullH)

      setPanelAnim('expand-width')
      setPanelW(PANEL_W)

      setTimeout(() => {
        setPanelAnim('expand-height')
        setPanelH(fullH)
      }, 350)

      setTimeout(() => {
        setPanelAnim('content-in')
        setContentVisible(true)
      }, 700)

      setTimeout(() => {
        setPanelAnim('idle')
        if (pendingNodesRef.current) {
          const pending = pendingNodesRef.current
          pendingNodesRef.current = null
          setNodes(pending.nodes)
          setEdges(pending.edges)
        }
        setTransitionPhase('done')
        setTimeout(() => {
          const scrollArea = document.querySelector('[data-scroll-area]')
          if (scrollArea) scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' })
        }, 100)
      }, 1000)
    }, 1100)
  }, [setNodes, setEdges])

  useEffect(() => {
    onContentChange?.(nodes.length > 0)
    if (prevNodeCount.current === 0 && nodes.length > 0 && !hasTransitioned.current) {
      startPanelTransition()
    }
    prevNodeCount.current = nodes.length
  }, [nodes.length, onContentChange, startPanelTransition])

  useEffect(() => {
    const currentChatIds = new Set(
      nodes.filter((n) => n.id.startsWith('chat-')).map((n) => n.id.replace('chat-', ''))
    )
    const prevIds = chatNodeIdsRef.current
    const removed = [...prevIds].filter((id) => !currentChatIds.has(id))
    if (removed.length > 0) {
      setRemovedDemoIds((prev) => [...prev, ...removed])
    }
    chatNodeIdsRef.current = currentChatIds
  }, [nodes])

  const handleFirstSend = useCallback((text?: string) => {
    setHelperVisible(false)

    const headingEl = headingRef.current
    const chatWrapEl = chatWrapRef.current
    const parentEl = headingEl?.parentElement
    if (!headingEl || !parentEl) {
      setHasChatStarted(true)
      return
    }

    const parentRect = parentEl.getBoundingClientRect()
    const headingRect = headingEl.getBoundingClientRect()
    const targetTop = parentRect.top + 24
    const deltaY = targetTop - headingRect.top

    const dur = '0.5s'
    const ease = 'cubic-bezier(0.4, 0, 0.2, 1)'

    headingEl.style.transition = `transform ${dur} ${ease}`
    headingEl.style.transform = `translateY(${deltaY}px)`

    const scrollAreaEl = chatWrapEl?.querySelector('[data-scroll-area]') as HTMLElement | null
    if (scrollAreaEl) {
      scrollAreaEl.style.transition = `transform ${dur} ${ease}`
      scrollAreaEl.style.transform = `translateY(${deltaY}px)`
    }

    const inputEl = chatWrapEl?.querySelector('[data-chat-input]') as HTMLElement | null
    if (inputEl) {
      const inputRect = inputEl.getBoundingClientRect()
      const inputTargetTop = parentRect.bottom - 56 - inputRect.height
      const inputDeltaY = inputTargetTop - inputRect.top
      inputEl.style.transition = `transform ${dur} ${ease}`
      inputEl.style.transform = `translateY(${inputDeltaY}px)`
    }

    if (text) {
      setGhostText(text)
      setTimeout(() => setGhostText(null), 700)
    }

    setTimeout(() => {
      headingEl.style.transition = ''
      headingEl.style.transform = ''
      if (scrollAreaEl) {
        scrollAreaEl.style.transition = ''
        scrollAreaEl.style.transform = ''
      }
      if (inputEl) {
        inputEl.style.transition = ''
        inputEl.style.transform = ''
      }
      setHasChatStarted(true)
      setInputBottom(true)
    }, 550)
  }, [])

  const handleExpand = useCallback(() => {
    setChatOpen(true)
    const fullH = reactFlowWrapper.current?.getBoundingClientRect().height
      ? reactFlowWrapper.current.getBoundingClientRect().height - 32
      : panelHeight

    setPanelAnim('expand-width')
    setPanelW(PANEL_W)

    setTimeout(() => {
      setPanelAnim('expand-height')
      setPanelH(fullH)
      setPanelHeight(fullH)
    }, 350)

    setTimeout(() => {
      setPanelAnim('content-in')
      setContentVisible(true)
    }, 700)

    setTimeout(() => {
      setPanelAnim('idle')
      const scrollArea = document.querySelector('[data-scroll-area]')
      if (scrollArea) scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' })
    }, 1000)
  }, [panelHeight])

  const handleCollapse = useCallback(() => {
    setPanelAnim('content-out')
    setContentVisible(false)

    setTimeout(() => {
      setPanelAnim('collapse-height')
      setPanelH(COLLAPSED_H)
    }, 300)

    setTimeout(() => {
      setPanelAnim('collapse-width')
      setPanelW(COLLAPSED_W)
    }, 650)

    setTimeout(() => {
      setChatOpen(false)
      setPanelAnim('idle')
    }, 1000)
  }, [])

  const onPanelResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    panelResizing.current = true
    setIsResizing(true)
    panelResizeStart.current = { y: e.clientY, h: panelH }
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev: MouseEvent) => {
      if (!panelResizing.current) return
      const delta = ev.clientY - panelResizeStart.current.y
      const parentH = reactFlowWrapper.current?.getBoundingClientRect().height ?? 800
      const maxH = parentH - 32
      const newH = Math.max(300, Math.min(maxH, panelResizeStart.current.h + delta))
      setPanelHeight(newH)
      setPanelH(newH)
    }
    const onUp = () => {
      panelResizing.current = false
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [panelHeight])

  const onConnect: OnConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const interactionType = event.dataTransfer.getData('application/reactflow')
      if (!interactionType) return

      const mappedType = nodeTypeMap[interactionType]
      if (!mappedType) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      let nodeData: Record<string, unknown> = {}
      const rawData = event.dataTransfer.getData('application/reactflow-data')
      if (rawData) {
        try { nodeData = JSON.parse(rawData) } catch { /* ignore */ }
      }

      const newNode: Node = {
        id: getNodeId(),
        type: mappedType,
        position,
        data: nodeData,
      }

      setNodes((nds) => [...nds, newNode])
    },
    [screenToFlowPosition, setNodes],
  )

  const handleCreateDemo = useCallback((proposal: DemoProposal, selectedContent: SelectedContent[]) => {
    console.log('[FlowCanvas] handleCreateDemo called', { template: proposal.template, selectedCount: selectedContent.length, items: selectedContent.map(s => ({ persona: s.persona, title: s.demo.demo.title })) })
    const newNodes: Node[] = []
    const newEdges: Edge[] = []
    const COL_GAP = 550
    const ROW_GAP = 300

    const wrapper = reactFlowWrapper.current
    const wrapperRect = wrapper?.getBoundingClientRect()
    const screenW = wrapperRect?.width ?? window.innerWidth
    const screenH = wrapperRect?.height ?? window.innerHeight
    const centerScreen = screenToFlowPosition({ x: screenW / 2, y: screenH / 2 })
    const startX = centerScreen.x - 200
    const startY = centerScreen.y - 200

    const uniquePersonas = [...new Set(selectedContent.map((s) => s.persona))]
    const personaSelections = uniquePersonas.map((name) => ({
      name,
      items: selectedContent.filter((s) => s.persona === name),
    }))

    // Decide best-fit template based on actual selections:
    // - 1 persona, 1 item → Single Asset
    // - multiple personas, 1 item each → 1 Discovery Branch
    // - multiple personas with 2+ items per any persona → 2 Discovery Branches
    // - 1 persona, 2+ items → 1 Discovery Branch (question asks about content)
    const hasMultiplePersonas = uniquePersonas.length > 1
    const anyPersonaHasMultiple = personaSelections.some((p) => p.items.length > 1)
    const totalItems = selectedContent.length

    let effectiveTemplate: 'single_asset' | '1_disco_branch' | '2_disco_branch'
    if (totalItems === 1 && !hasMultiplePersonas) {
      effectiveTemplate = 'single_asset'
    } else if (hasMultiplePersonas && anyPersonaHasMultiple) {
      effectiveTemplate = '2_disco_branch'
    } else {
      effectiveTemplate = '1_disco_branch'
    }

    // --- Template 1: Single Asset ---
    if (effectiveTemplate === 'single_asset') {
      const sel = selectedContent[0]
      newNodes.push({
        id: getNodeId(),
        type: 'demoCardNode',
        position: { x: startX, y: startY },
        data: { demoId: sel.demo.demo.id, title: sel.demo.demo.title, creator: sel.demo.demo.creator, preview: sel.demo.demo.preview },
      })
    }

    // --- Template 2: 1 Discovery Branch ---
    // 1 question → branches lead directly to content (video, tour, or both)
    if (effectiveTemplate === '1_disco_branch') {
      const questionId = getNodeId()

      // Use topics as answers when available, otherwise fall back to personas
      const useTopics = proposal.topics && proposal.topics.length >= 2
      const answers = useTopics ? proposal.topics! : (hasMultiplePersonas ? uniquePersonas : selectedContent.map((s) =>
        s.demo.demo.title.length > 45 ? s.demo.demo.title.slice(0, 42) + '...' : s.demo.demo.title
      ))

      newNodes.push({
        id: questionId,
        type: 'ctaNode',
        position: { x: startX, y: startY },
        data: {
          question: useTopics ? proposal.discoveryQuestion : (hasMultiplePersonas ? proposal.discoveryQuestion : 'Which of these is most relevant to you?'),
          answers,
        },
      })

      if (useTopics) {
        const topicList = proposal.topics!
        // Build a map of topic → best content by checking painPointMatches first,
        // then falling back to distributing selectedContent in order.
        const topicContentMap = new Map<number, SelectedContent>()
        const usedIds = new Set<string>()

        // First pass: match via painPointMatches
        topicList.forEach((topic, ti) => {
          for (const sel of selectedContent) {
            if (usedIds.has(sel.demo.demo.id)) continue
            const persona = proposal.personas.find((p) => p.name === sel.persona)
            if (!persona) continue
            const ppMatch = persona.painPointMatches?.find(
              (pp) => pp.painPoint === topic && pp.matches.some((m) => m.demo.id === sel.demo.demo.id)
            )
            if (ppMatch) {
              topicContentMap.set(ti, sel)
              usedIds.add(sel.demo.demo.id)
              break
            }
          }
        })

        // Second pass: fill any unmatched topics with remaining selectedContent in order
        let selIdx = 0
        topicList.forEach((_, ti) => {
          if (topicContentMap.has(ti)) return
          while (selIdx < selectedContent.length && usedIds.has(selectedContent[selIdx].demo.demo.id)) selIdx++
          if (selIdx < selectedContent.length) {
            topicContentMap.set(ti, selectedContent[selIdx])
            usedIds.add(selectedContent[selIdx].demo.demo.id)
            selIdx++
          }
        })

        // Create nodes for each topic answer
        topicContentMap.forEach((sel, ti) => {
          const cardId = getNodeId()
          newNodes.push({
            id: cardId,
            type: 'demoCardNode',
            position: { x: startX + COL_GAP, y: startY + ti * ROW_GAP },
            data: { demoId: sel.demo.demo.id, title: sel.demo.demo.title, creator: sel.demo.demo.creator, preview: sel.demo.demo.preview },
          })
          newEdges.push({
            id: `e-${questionId}-${cardId}`,
            source: questionId,
            sourceHandle: `answer-${ti}`,
            target: cardId,
            type: 'deletable',
          })
        })
      } else if (hasMultiplePersonas) {
        personaSelections.forEach((ps, pi) => {
          const best = ps.items[0]
          if (best) {
            const cardId = getNodeId()
            newNodes.push({
              id: cardId,
              type: 'demoCardNode',
              position: { x: startX + COL_GAP, y: startY + pi * ROW_GAP },
              data: { demoId: best.demo.demo.id, title: best.demo.demo.title, creator: best.demo.demo.creator, preview: best.demo.demo.preview },
            })
            newEdges.push({
              id: `e-${questionId}-${cardId}`,
              source: questionId,
              sourceHandle: `answer-${pi}`,
              target: cardId,
              type: 'deletable',
            })
          }
        })
      } else {
        selectedContent.forEach((sel, i) => {
          const cardId = getNodeId()
          newNodes.push({
            id: cardId,
            type: 'demoCardNode',
            position: { x: startX + COL_GAP, y: startY + i * 260 },
            data: { demoId: sel.demo.demo.id, title: sel.demo.demo.title, creator: sel.demo.demo.creator, preview: sel.demo.demo.preview },
          })
          newEdges.push({
            id: `e-${questionId}-${cardId}`,
            source: questionId,
            sourceHandle: `answer-${i}`,
            target: cardId,
            type: 'deletable',
          })
        })
      }
    }

    // --- Template 3: 2 Discovery Branches ---
    // Question 1 (persona) → Question 2 (interest/content) → content cards
    if (effectiveTemplate === '2_disco_branch') {
      const q1Id = getNodeId()
      newNodes.push({
        id: q1Id,
        type: 'ctaNode',
        position: { x: startX, y: startY },
        data: { question: proposal.discoveryQuestion, answers: uniquePersonas },
      })

      let yAccum = startY
      personaSelections.forEach((ps, pi) => {
        const branchY = yAccum

        if (ps.items.length > 1) {
          const q2Id = getNodeId()
          const subAnswers = ps.items.map((s) =>
            s.demo.demo.title.length > 45 ? s.demo.demo.title.slice(0, 42) + '...' : s.demo.demo.title
          )
          newNodes.push({
            id: q2Id,
            type: 'ctaNode',
            position: { x: startX + COL_GAP, y: branchY },
            data: { question: `What's most important to you?`, answers: subAnswers },
          })
          newEdges.push({
            id: `e-${q1Id}-${q2Id}`,
            source: q1Id,
            sourceHandle: `answer-${pi}`,
            target: q2Id,
            type: 'deletable',
          })

          ps.items.forEach((sel, mi) => {
            const cardId = getNodeId()
            newNodes.push({
              id: cardId,
              type: 'demoCardNode',
              position: { x: startX + COL_GAP * 2, y: branchY + mi * 260 },
              data: { demoId: sel.demo.demo.id, title: sel.demo.demo.title, creator: sel.demo.demo.creator, preview: sel.demo.demo.preview },
            })
            newEdges.push({
              id: `e-${q2Id}-${cardId}`,
              source: q2Id,
              sourceHandle: `answer-${mi}`,
              target: cardId,
              type: 'deletable',
            })
          })

          yAccum += Math.max(1, ps.items.length) * 260 + 60
        } else {
          const cardId = getNodeId()
          newNodes.push({
            id: cardId,
            type: 'demoCardNode',
            position: { x: startX + COL_GAP, y: branchY },
            data: { demoId: ps.items[0].demo.demo.id, title: ps.items[0].demo.demo.title, creator: ps.items[0].demo.demo.creator, preview: ps.items[0].demo.demo.preview },
          })
          newEdges.push({
            id: `e-${q1Id}-${cardId}`,
            source: q1Id,
            sourceHandle: `answer-${pi}`,
            target: cardId,
            type: 'deletable',
          })

          yAccum += ROW_GAP
        }
      })
    }

    console.log('[FlowCanvas] placing on canvas', { effectiveTemplate, nodesCount: newNodes.length, edgesCount: newEdges.length, nodes: newNodes.map(n => ({ id: n.id, type: n.type, data: n.data })) })

    if (!hasTransitioned.current) {
      pendingNodesRef.current = { nodes: newNodes, edges: newEdges }
      startPanelTransition()
    } else {
      setNodes((nds) => [...nds, ...newNodes])
      setEdges((eds) => [...eds, ...newEdges])
    }
  }, [setNodes, setEdges, screenToFlowPosition, startPanelTransition])

  const handleCreateNode = useCallback((type: 'fullScreenDialogNode' | 'ctaNode', data?: Record<string, unknown>) => {
    const wrapper = reactFlowWrapper.current
    const wrapperRect = wrapper?.getBoundingClientRect()
    const screenW = wrapperRect?.width ?? window.innerWidth
    const screenH = wrapperRect?.height ?? window.innerHeight
    const center = screenToFlowPosition({ x: screenW / 2, y: screenH / 2 })

    const existingFSD = nodes.find((n) => n.type === type)
    if (existingFSD && data) {
      setNodes((nds) => nds.map((n) =>
        n.id === existingFSD.id ? { ...n, data: { ...n.data, ...data } } : n
      ))
      return
    }

    const newNode: Node = {
      id: getNodeId(),
      type,
      position: { x: center.x - 150, y: center.y - 100 },
      data: data || {},
    }

    if (!hasTransitioned.current) {
      pendingNodesRef.current = { nodes: [newNode], edges: [] }
      startPanelTransition()
    } else {
      setNodes((nds) => [...nds, newNode])
    }
  }, [setNodes, screenToFlowPosition, nodes, startPanelTransition])

  const handleToggleContent = useCallback((match: ContentMatch, selected: boolean) => {
    const demoId = match.demo.id
    const cardNodeId = `chat-${demoId}`
    const currentNodes = getNodes()
    const currentEdges = getEdges()

    if (selected) {
      const ctaNodes = currentNodes.filter((n) => n.type === 'ctaNode')
      const demoCards = currentNodes.filter((n) => n.type === 'demoCardNode')

      // Check for a vacated slot from a previously removed card
      let slot: { ctaNodeId: string; sourceHandle: string; position: { x: number; y: number } } | undefined

      // First: look for any vacated slot keyed by exact category
      const categoryKey = match.demo.title
      if (vacatedSlotsRef.current.has(categoryKey)) {
        slot = vacatedSlotsRef.current.get(categoryKey)
        vacatedSlotsRef.current.delete(categoryKey)
      }

      // Second: look for any vacated slot whose CTA node is on stage
      if (!slot) {
        const ctaIds = new Set(ctaNodes.map((n) => n.id))
        for (const [key, val] of vacatedSlotsRef.current.entries()) {
          if (ctaIds.has(val.ctaNodeId)) {
            slot = val
            vacatedSlotsRef.current.delete(key)
            break
          }
        }
      }

      // Third: if still no slot, check for orphaned answer handles on any CTA node
      if (!slot && ctaNodes.length > 0) {
        for (const cta of ctaNodes) {
          const answers: string[] = (cta.data as { answers?: string[] }).answers ?? []
          for (let ai = 0; ai < answers.length; ai++) {
            const handle = `answer-${ai}`
            const hasEdge = currentEdges.some((e) => e.source === cta.id && e.sourceHandle === handle)
            if (!hasEdge) {
              const usedPositions = demoCards
                .filter((dc) => currentEdges.some((e) => e.source === cta.id && e.target === dc.id))
                .map((dc) => dc.position)
              const avgY = usedPositions.length > 0
                ? usedPositions.reduce((sum, p) => sum + p.y, 0) / usedPositions.length
                : cta.position.y
              slot = {
                ctaNodeId: cta.id,
                sourceHandle: handle,
                position: { x: cta.position.x + 550, y: avgY + ai * 180 },
              }
              break
            }
          }
          if (slot) break
        }
      }

      const ctaNode = ctaNodes[0]

      const newNode: Node = {
        id: cardNodeId,
        type: 'demoCardNode',
        position: slot
          ? slot.position
          : ctaNode
            ? { x: ctaNode.position.x + 400, y: ctaNode.position.y + demoCards.length * 180 }
            : { x: (demoCards[demoCards.length - 1]?.position.x ?? 400), y: (demoCards[demoCards.length - 1]?.position.y ?? 0) + 180 },
        data: { demoId: match.demo.id, title: match.demo.title, creator: match.demo.creator, preview: match.demo.preview },
      }

      if (slot) {
        setNodes((nds) => [...nds, newNode])
        const slotRef = slot
        setTimeout(() => {
          setEdges((eds) => [
            ...eds,
            {
              id: `e-${slotRef.ctaNodeId}-${cardNodeId}`,
              source: slotRef.ctaNodeId,
              sourceHandle: slotRef.sourceHandle,
              target: cardNodeId,
              type: 'deletable',
            },
          ])
        }, 50)
      } else if (ctaNode) {
        const currentAnswers: string[] = (ctaNode.data as { answers?: string[] }).answers ?? []
        const answerLabel = match.demo.title.length > 45
          ? match.demo.title.slice(0, 42) + '...'
          : match.demo.title
        const newAnswerIndex = currentAnswers.length

        setNodes((nds) => [
          ...nds.map((n) =>
            n.id === ctaNode.id
              ? { ...n, data: { ...n.data, answers: [...currentAnswers, answerLabel] } }
              : n
          ),
          newNode,
        ])

        setTimeout(() => {
          updateNodeInternals(ctaNode.id)
          setTimeout(() => {
            setEdges((eds) => [
              ...eds,
              {
                id: `e-${ctaNode.id}-${cardNodeId}`,
                source: ctaNode.id,
                sourceHandle: `answer-${newAnswerIndex}`,
                target: cardNodeId,
                type: 'deletable',
              },
            ])
          }, 300)
        }, 400)
      } else {
        setNodes((nds) => [...nds, newNode])
      }
    } else {
      const targetNode = currentNodes.find((n) => (n.data as { demoId?: string }).demoId === demoId)
      if (targetNode) {
        const incomingEdge = currentEdges.find((e) => e.target === targetNode.id && e.sourceHandle)
        if (incomingEdge && incomingEdge.sourceHandle) {
          const categoryKey = (targetNode.data as { title?: string }).title ?? demoId
          vacatedSlotsRef.current.set(categoryKey, {
            ctaNodeId: incomingEdge.source,
            sourceHandle: incomingEdge.sourceHandle,
            position: { ...targetNode.position },
          })
        }
        setNodes((nds) => nds.filter((n) => n.id !== targetNode.id))
        setEdges((eds) => eds.filter((e) => e.source !== targetNode.id && e.target !== targetNode.id))
      }
    }
  }, [getNodes, getEdges, setNodes, setEdges])

  useEffect(() => {
    const handler = (e: Event) => {
      const { nodeId, demoId: evtDemoId, title: evtTitle } = (e as CustomEvent).detail as { nodeId: string; demoId: string; title: string }
      let finalDemoId = evtDemoId
      if (!finalDemoId) {
        const found = allDemos.find((d) => d.title === evtTitle)
        finalDemoId = found?.id || `unknown-${nodeId}`
      }
      const wrapper = reactFlowWrapper.current
      if (!wrapper) return
      const el = wrapper.querySelector(`[data-id="${nodeId}"]`) as HTMLElement | null
      if (!el) return
      const wrapperRect = wrapper.getBoundingClientRect()
      const nodeRect = el.getBoundingClientRect()
      setReplaceTarget({
        nodeId,
        title: evtTitle,
        demoId: finalDemoId,
        anchorRect: {
          x: nodeRect.left - wrapperRect.left,
          y: nodeRect.top - wrapperRect.top,
          width: nodeRect.width,
          height: nodeRect.height,
        },
      })
      setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === nodeId })))
    }
    document.addEventListener('open-replace-popover', handler)
    return () => document.removeEventListener('open-replace-popover', handler)
  }, [setNodes])

  const handlePopoverDeselect = useCallback((nodeId: string) => {
    const currentNodes = getNodes()
    const currentEdges = getEdges()
    const targetNode = currentNodes.find((n) => n.id === nodeId)
    if (!targetNode) return

    const incomingEdge = currentEdges.find((e) => e.target === targetNode.id && e.sourceHandle)
    if (incomingEdge && incomingEdge.sourceHandle) {
      const slotKey = `popover-${nodeId}`
      vacatedSlotsRef.current.set(slotKey, {
        ctaNodeId: incomingEdge.source,
        sourceHandle: incomingEdge.sourceHandle,
        position: { ...targetNode.position },
      })
    }

    setNodes((nds) => nds.filter((n) => n.id !== targetNode.id))
    setEdges((eds) => eds.filter((e) => e.source !== targetNode.id && e.target !== targetNode.id))
    setReplaceTarget((prev) => prev ? { ...prev, demoId: '' } : null)
  }, [getNodes, getEdges, setNodes, setEdges])

  const handleReplace = useCallback((nodeId: string, match: ContentMatch) => {
    rejectDemo(replaceTarget?.demoId ?? '')

    const currentNodes = getNodes()
    const existingNode = currentNodes.find((n) => n.id === nodeId)

    if (existingNode) {
      setNodes((nds) => nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, demoId: match.demo.id, title: match.demo.title, creator: match.demo.creator, preview: match.demo.preview } }
          : n
      ))
      setReplaceTarget((prev) => prev ? { ...prev, demoId: match.demo.id, title: match.demo.title } : null)
    } else {
      const slotKey = `popover-${nodeId}`
      const slot = vacatedSlotsRef.current.get(slotKey)
      const newCardId = getNodeId()
      const position = slot ? slot.position : { x: 0, y: 0 }

      const newNode: Node = {
        id: newCardId,
        type: 'demoCardNode',
        position,
        data: { demoId: match.demo.id, title: match.demo.title, creator: match.demo.creator, preview: match.demo.preview },
      }
      setNodes((nds) => [...nds, newNode])

      if (slot) {
        setTimeout(() => {
          setEdges((eds) => [
            ...eds,
            {
              id: `e-${slot.ctaNodeId}-${newCardId}`,
              source: slot.ctaNodeId,
              sourceHandle: slot.sourceHandle,
              target: newCardId,
              type: 'deletable',
            },
          ])
        }, 100)
        vacatedSlotsRef.current.delete(slotKey)
      }

      setReplaceTarget((prev) => prev ? { ...prev, nodeId: newCardId, demoId: match.demo.id, title: match.demo.title } : null)
    }
  }, [setNodes, setEdges, getNodes, replaceTarget])

  const handlePaneClick = useCallback(() => {
    setReplaceTarget(null)
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
  }, [setNodes])

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: 'deletable',
          style: { stroke: '#FC6839', strokeWidth: 3, strokeDasharray: '8 4', strokeLinecap: 'round' },
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
        className="bg-gray-50"
      >
        <Background variant={BackgroundVariant.Dots} gap={14} size={1.5} color="#b0b0b0" />
        {/* Controls replaced by custom toolbar */}
      </ReactFlow>

      {/* Custom controls toolbar */}
      <ControlsToolbar />

      {/* Replace content popover */}
      {replaceTarget && (
        <ReplacePopover
          nodeId={replaceTarget.nodeId}
          title={replaceTarget.title}
          demoId={replaceTarget.demoId}
          anchorRect={replaceTarget.anchorRect}
          wrapperRef={reactFlowWrapper}
          onReplace={handleReplace}
          onDeselect={handlePopoverDeselect}
          onDismiss={() => {
            setReplaceTarget(null)
            setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
          }}
          cachedState={popoverCacheRef.current.get(replaceTarget.nodeId)}
          onSaveState={(nid, state) => { popoverCacheRef.current.set(nid, state) }}
        />
      )}

      {/* Persistent chat wrapper — always mounted, single AgenticChat instance */}
      <div
        className={
          isWelcomeMode
            ? `absolute inset-0 flex flex-col items-center pointer-events-none z-10 ${!hasChatStarted ? 'justify-center' : ''}`
            : 'absolute top-4 left-4 z-20'
        }
        style={
          isWelcomeMode
            ? {
                ...(hasChatStarted ? { paddingTop: 24 } : {}),
              }
            : {
                opacity: transitionPhase === 'bar-reveal' ? 1 : undefined,
                transition: transitionPhase === 'bar-reveal' ? 'opacity 0.4s ease' : undefined,
              }
        }
      >
        {/* Welcome decorations — sparkle + heading above the chat */}
        {isWelcomeMode && (
          <div ref={headingRef} className="flex flex-col items-center pointer-events-auto w-full" style={{ maxWidth: 640, margin: '0 auto' }}>
            <div className="mb-4" style={{ transform: 'translateY(24px)' }}>
              <SparkleIcon size={92} />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              Let&apos;s build something together!
            </h1>
          </div>
        )}

        {/* Panel chrome wrapper — visible when not in welcome mode */}
        <div
          className={isWelcomeMode ? 'contents' : 'relative flex flex-col rounded-2xl border border-gray-200 shadow-lg overflow-hidden backdrop-blur-sm'}
          style={isWelcomeMode ? undefined : {
            width: panelW,
            height: panelH,
            background: panelH <= COLLAPSED_H + 10
              ? 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 60%, rgba(255,255,255,0.3) 100%)'
              : 'rgba(255,255,255,0.8)',
            transition: isResizing
              ? 'background 0.3s ease'
              : 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1), height 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease',
          }}
        >
          {/* Green activity dot — rendered outside overflow-hidden header */}
          {!isWelcomeMode && hasChatStarted && (
            <span className="absolute z-30 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" style={{ top: 11, right: 15 }} />
          )}

          {/* Panel header */}
          {!isWelcomeMode && (
            <>
              <CornerGlow />
              <div
                className="relative flex items-center px-4 shrink-0 bg-white rounded-t-2xl"
                style={{
                  height: COLLAPSED_H,
                  minHeight: COLLAPSED_H,
                  borderBottom: contentVisible ? '1px solid #f3f4f6' : 'none',
                }}
              >
                <div className="flex items-center shrink-0" style={{ marginRight: 12 }}>
                  <svg width="28" height="28" viewBox="14 8 62 62" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="19.0464" y="12.4535" width="50.4" height="50.4" rx="25.2" fill="url(#paint_header_sparkle)" />
                    <path d="M43.0806 28.0993C43.1186 27.8951 43.4112 27.8951 43.4492 28.0993L43.8704 30.3629C44.4091 33.2584 46.6746 35.5236 49.5704 36.0623L51.8342 36.4835C52.0384 36.5215 52.0384 36.814 51.8342 36.852L49.5704 37.2731C46.6746 37.8118 44.4091 40.0771 43.8704 42.9726L43.4492 45.2362C43.4112 45.4404 43.1186 45.4404 43.0806 45.2362L42.6595 42.9726C42.1207 40.0771 39.8552 37.8118 36.9595 37.2731L34.6956 36.852C34.4914 36.814 34.4914 36.5215 34.6956 36.4835L36.9595 36.0623C39.8552 35.5236 42.1207 33.2584 42.6595 30.3629L43.0806 28.0993Z" fill="white"/>
                    <path d="M50.898 40.663C50.9127 40.584 51.0259 40.584 51.0406 40.663L51.2035 41.5386C51.4119 42.6586 52.2883 43.5349 53.4084 43.7433L54.2841 43.9062C54.3631 43.9209 54.3631 44.034 54.2841 44.0487L53.4084 44.2116C52.2883 44.42 51.4119 45.2963 51.2035 46.4163L51.0406 47.2919C51.0259 47.3709 50.9127 47.3709 50.898 47.2919L50.7351 46.4163C50.5267 45.2963 49.6504 44.42 48.5302 44.2116L47.6545 44.0487C47.5755 44.034 47.5755 43.9209 47.6545 43.9062L48.5302 43.7433C49.6504 43.5349 50.5267 42.6586 50.7351 41.5386L50.898 40.663Z" fill="white"/>
                    <defs>
                      <linearGradient id="paint_header_sparkle" x1="19.0464" y1="40.0309" x2="69.4464" y2="40.0309" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FFB352"/><stop offset="0.5" stopColor="#FC6839"/><stop offset="1" stopColor="#EB2E24"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <span className="text-base font-semibold whitespace-nowrap leading-none" style={{ color: '#FC6839', marginLeft: -2 }}>Consensus AI</span>
                <div className="flex-1" />
                <button
                  onClick={panelAnim !== 'idle' ? undefined : (contentVisible ? handleCollapse : handleExpand)}
                  className="text-[#172537] hover:text-[#FC6839] transition-colors p-1 rounded-md"
                  style={{ cursor: panelAnim !== 'idle' ? 'default' : 'pointer' }}
                >
                  <svg width="22" height="17" viewBox="0 0 22 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.5" y="0.5" width="21" height="16" rx="3.5" stroke="currentColor"/>
                    <line x1="6.64844" y1="0.5" x2="6.64844" y2="17" stroke="currentColor"/>
                  </svg>
                </button>
                {/* green dot rendered outside overflow-hidden via portal-like placement */}
              </div>
            </>
          )}

          {/* Chat body wrapper — content fades in panel mode, always visible in welcome mode */}
          <div
            className={isWelcomeMode ? 'w-full pointer-events-auto' : 'flex-1 overflow-hidden'}
            style={isWelcomeMode
              ? { maxWidth: 640, margin: '0 auto' }
              : {
                  opacity: contentVisible ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: contentVisible ? 'auto' : 'none',
                }
            }
          >
            <div ref={chatWrapRef} className={isWelcomeMode ? '' : 'h-full overflow-hidden'}>
              <AgenticChat mode={isWelcomeMode ? 'full' : 'panel'} onFirstSend={handleFirstSend} onCreateDemo={handleCreateDemo} onToggleContent={handleToggleContent} onCreateNode={handleCreateNode} removedDemoIds={removedDemoIds} inputBottom={inputBottom} canvasState={canvasState} />
            </div>
          </div>

          {/* Resize handle — only when panel is open */}
          {!isWelcomeMode && contentVisible && panelAnim === 'idle' && (
            <div
              onMouseDown={onPanelResizeStart}
              className="h-2 cursor-row-resize flex items-center justify-center shrink-0 hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
          )}
        </div>

        {/* Welcome helper text & ghost */}
        {isWelcomeMode && (
          <>
            <p
              className="text-xs text-gray-900 mt-4 text-center pointer-events-auto"
              style={{
                opacity: (helperVisible && transitionPhase === 'none') ? 1 : 0,
                transition: 'opacity 0.1s ease-out',
              }}
            >
              Tell Consensus AI what you want to build or drag content and interactions on to the stage.
            </p>
            {ghostText && <GhostText text={ghostText} onDone={() => setGhostText(null)} />}
          </>
        )}
      </div>
    </div>
  )
}
