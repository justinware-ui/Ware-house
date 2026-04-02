import { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import AgenticChat, { type SelectedContent } from './AgenticChat'
import type { DemoProposal, ContentMatch, CanvasState } from '../lib/aiEngine'
import { findReplacements, rejectDemo } from '../lib/aiEngine'
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
  cta: 'ctaNode',
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

interface ReplacePopoverProps {
  nodeId: string
  title: string
  demoId: string
  anchorRect: { x: number; y: number; width: number; height: number }
  wrapperRef: React.RefObject<HTMLDivElement | null>
  onReplace: (nodeId: string, match: ContentMatch) => void
  onDismiss: () => void
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
}: {
  match: ContentMatch
  cardKey: string
  expandedInfo: Record<string, boolean>
  onToggleInfo: (k: string) => void
  onReplace: (match: ContentMatch) => void
}) {
  const colors = CONF_COLOR[match.confidence]
  const isInfoOpen = !!expandedInfo[cardKey]
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-visible">
      {showPreview && (
        <PreviewModal url={match.demo.preview} title={match.demo.title} onClose={() => setShowPreview(false)} />
      )}
      <div className="flex items-center gap-3 px-3 py-3">
        <img src={getPopoverThumb(match.demo.title)} alt="" className="w-10 h-10 rounded-lg shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{match.demo.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{match.demo.creator}</span>
            <span className="text-xs text-[#FC6839] font-semibold">Show more</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
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

          {/* Preview icon (outlined) */}
          <div className="relative group/preview flex items-center">
            <button className="hover:opacity-70 transition-opacity" onClick={() => setShowPreview(true)}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 5.5C6.5 5.5 3.73 7.86 2.5 10c1.23 2.14 4 4.5 7.5 4.5s6.27-2.36 7.5-4.5c-1.23-2.14-4-4.5-7.5-4.5Z" stroke="#293748" strokeWidth="1.5" strokeLinejoin="round"/>
                <circle cx="10" cy="10" r="2.75" stroke="#293748" strokeWidth="1.5"/>
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/preview:opacity-100 transition-opacity shadow-lg z-50" style={{ backgroundColor: '#293748' }}>
              Preview
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: '#293748' }} />
            </div>
          </div>

          {/* Switch / Replace icon */}
          <div className="relative group/switch flex items-center">
            <button className="hover:opacity-70 transition-opacity" onClick={() => onReplace(match)}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id={`mask_switch_pop_${cardKey}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                  <rect width="20" height="20" fill="#D9D9D9"/>
                </mask>
                <g mask={`url(#mask_switch_pop_${cardKey})`}>
                  <path d="M10.0417 16.6667C8.18056 16.6667 6.59722 16.0209 5.29167 14.7292C3.98611 13.4375 3.33333 11.8612 3.33333 10V9.85421L2.58333 10.6042C2.43056 10.757 2.23611 10.8334 2 10.8334C1.76389 10.8334 1.56944 10.757 1.41667 10.6042C1.26389 10.4514 1.1875 10.257 1.1875 10.0209C1.1875 9.78476 1.26389 9.59032 1.41667 9.43754L3.58333 7.27087C3.66667 7.18754 3.75694 7.12837 3.85417 7.09337C3.95139 7.05893 4.05556 7.04171 4.16667 7.04171C4.27778 7.04171 4.38194 7.05893 4.47917 7.09337C4.57639 7.12837 4.66667 7.18754 4.75 7.27087L6.91667 9.43754C7.06944 9.59032 7.14583 9.78476 7.14583 10.0209C7.14583 10.257 7.06944 10.4514 6.91667 10.6042C6.76389 10.757 6.56944 10.8334 6.33333 10.8334C6.09722 10.8334 5.90278 10.757 5.75 10.6042L5 9.85421V10C5 11.3889 5.48972 12.5695 6.46917 13.5417C7.44806 14.5139 8.63889 15 10.0417 15C10.3194 15 10.5903 14.9759 10.8542 14.9275C11.1181 14.8787 11.3819 14.8056 11.6458 14.7084C11.7847 14.6528 11.9342 14.6389 12.0942 14.6667C12.2536 14.6945 12.3889 14.7639 12.5 14.875C12.75 15.125 12.8508 15.3923 12.8025 15.6767C12.7536 15.9617 12.5694 16.1598 12.25 16.2709C11.8889 16.3959 11.5244 16.4931 11.1567 16.5625C10.7883 16.632 10.4167 16.6667 10.0417 16.6667ZM15.8333 12.9584C15.7222 12.9584 15.6181 12.9409 15.5208 12.9059C15.4236 12.8714 15.3333 12.8125 15.25 12.7292L13.0833 10.5625C12.9306 10.4098 12.8542 10.2153 12.8542 9.97921C12.8542 9.7431 12.9306 9.54865 13.0833 9.39587C13.2361 9.2431 13.4306 9.16671 13.6667 9.16671C13.9028 9.16671 14.0972 9.2431 14.25 9.39587L15 10.1459V10C15 8.61115 14.5106 7.4306 13.5317 6.45837C12.5522 5.48615 11.3611 5.00004 9.95833 5.00004C9.68056 5.00004 9.40972 5.02448 9.14583 5.07337C8.88194 5.12171 8.61806 5.19449 8.35417 5.29171C8.21528 5.34726 8.06611 5.36115 7.90667 5.33337C7.74667 5.3056 7.61111 5.23615 7.5 5.12504C7.25 4.87504 7.14917 4.60754 7.1975 4.32254C7.24639 4.0381 7.43056 3.84032 7.75 3.72921C8.11111 3.60421 8.47583 3.50699 8.84417 3.43754C9.21194 3.3681 9.58333 3.33337 9.95833 3.33337C11.8194 3.33337 13.4028 3.97921 14.7083 5.27087C16.0139 6.56254 16.6667 8.13893 16.6667 10V10.1459L17.4167 9.39587C17.5694 9.2431 17.7639 9.16671 18 9.16671C18.2361 9.16671 18.4306 9.2431 18.5833 9.39587C18.7361 9.54865 18.8125 9.7431 18.8125 9.97921C18.8125 10.2153 18.7361 10.4098 18.5833 10.5625L16.4167 12.7292C16.3333 12.8125 16.2431 12.8714 16.1458 12.9059C16.0486 12.9409 15.9444 12.9584 15.8333 12.9584Z" fill="#172537"/>
                </g>
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/switch:opacity-100 transition-opacity shadow-lg z-50" style={{ backgroundColor: '#293748' }}>
              Replace
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: '#293748' }} />
            </div>
          </div>

          {/* Add icon */}
          <div className="relative group/add flex items-center">
            <button onClick={() => onReplace(match)} className="transition-all hover:opacity-80">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#FC6839" strokeWidth="1.5"/>
                <path d="M12 8v8M8 12h8" stroke="#FC6839" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/add:opacity-100 transition-opacity shadow-lg z-50" style={{ backgroundColor: '#293748' }}>
              Add
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: '#293748' }} />
            </div>
          </div>
        </div>
      </div>

      {isInfoOpen && (
        <div className="mx-3 mb-3 px-3 py-2.5 rounded-lg text-xs border" style={{ borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }}>
          <strong>Why this content:</strong> {match.relevanceReason}
        </div>
      )}
    </div>
  )
}

function ReplacePopover({ nodeId, title, demoId, anchorRect, wrapperRef, onReplace, onDismiss }: ReplacePopoverProps) {
  const [alternatives, setAlternatives] = useState<ContentMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedInfo, setExpandedInfo] = useState<Record<string, boolean>>({})
  const popoverRef = useRef<HTMLDivElement>(null)
  const [liveRect, setLiveRect] = useState(anchorRect)
  const [popoverWidth, setPopoverWidth] = useState(380)
  const resizing = useRef<{ startX: number; startW: number } | null>(null)

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

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      setAlternatives(findReplacements(demoId, title, 3))
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [demoId, title])

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

  const toggleInfo = (k: string) => setExpandedInfo((prev) => ({ ...prev, [k]: !prev[k] }))

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 rounded-xl border border-gray-200 bg-white shadow-xl p-2"
      style={{
        left: liveRect.x + liveRect.width + 12,
        top: liveRect.y,
        width: popoverWidth,
        animation: 'fadeSlideIn 0.2s ease-out',
      }}
    >
      {/* Right-edge resize handle */}
      <div
        className="absolute top-0 right-0 w-2 h-full cursor-ew-resize z-10"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          resizing.current = { startX: e.clientX, startW: popoverWidth }
        }}
      />
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <svg width="22" height="22" viewBox="14 8 62 62" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <rect x="19.0464" y="12.4535" width="50.4" height="50.4" rx="25.2" fill="url(#paint_popover_sparkle)"/>
          <path d="M43.0806 28.0993C43.1186 27.8951 43.4112 27.8951 43.4492 28.0993L43.8704 30.3629C44.4091 33.2584 46.6746 35.5236 49.5704 36.0623L51.8342 36.4835C52.0384 36.5215 52.0384 36.814 51.8342 36.852L49.5704 37.2731C46.6746 37.8118 44.4091 40.0771 43.8704 42.9726L43.4492 45.2362C43.4112 45.4404 43.1186 45.4404 43.0806 45.2362L42.6595 42.9726C42.1207 40.0771 39.8552 37.8118 36.9595 37.2731L34.6956 36.852C34.4914 36.814 34.4914 36.5215 34.6956 36.4835L36.9595 36.0623C39.8552 35.5236 42.1207 33.2584 42.6595 30.3629L43.0806 28.0993Z" fill="white"/>
          <path d="M50.898 40.663C50.9127 40.584 51.0259 40.584 51.0406 40.663L51.2035 41.5386C51.4119 42.6586 52.2883 43.5349 53.4084 43.7433L54.2841 43.9062C54.3631 43.9209 54.3631 44.034 54.2841 44.0487L53.4084 44.2116C52.2883 44.42 51.4119 45.2963 51.2035 46.4163L51.0406 47.2919C51.0259 47.3709 50.9127 47.3709 50.898 47.2919L50.7351 46.4163C50.5267 45.2963 49.6504 44.42 48.5302 44.2116L47.6545 44.0487C47.5755 44.034 47.5755 43.9209 47.6545 43.9062L48.5302 43.7433C49.6504 43.5349 50.5267 42.6586 50.7351 41.5386L50.898 40.663Z" fill="white"/>
          <defs>
            <linearGradient id="paint_popover_sparkle" x1="19.0464" y1="40.0309" x2="69.4464" y2="40.0309" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFB352"/><stop offset="0.5" stopColor="#FC6839"/><stop offset="1" stopColor="#EB2E24"/>
            </linearGradient>
          </defs>
        </svg>
        <span className="text-sm font-semibold" style={{ color: '#FC6839' }}>Replace this content?</span>
        <button onClick={onDismiss} className="ml-auto p-1 rounded hover:bg-gray-100 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1 1 13" stroke="#6F6F6F" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div className="px-4 py-3">
        <p className="text-xs text-gray-500 mb-6">
          Here are alternatives I found for <span className="font-medium text-gray-700">&ldquo;{title.length > 40 ? title.slice(0, 37) + '...' : title}&rdquo;</span>
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-4 justify-center text-xs text-gray-400">
            <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
            Finding alternatives...
          </div>
        ) : alternatives.length === 0 ? (
          <p className="text-xs text-gray-400 py-3 text-center">No alternatives found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {alternatives.map((alt, i) => (
              <PopoverContentCard
                key={alt.demo.id}
                match={alt}
                cardKey={`pop-${i}`}
                expandedInfo={expandedInfo}
                onToggleInfo={toggleInfo}
                onReplace={(m) => onReplace(nodeId, m)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input field */}
      <div className="p-4">
        <div
          className="bg-white rounded-2xl flex flex-col transition-shadow duration-200"
          style={{
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <div className="flex-1 px-3 pt-2.5 pb-1">
            <textarea
              autoFocus
              placeholder="What kind of content are you looking for?"
              className="w-full resize-none outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-transparent overflow-hidden"
              rows={1}
              style={{ maxHeight: 120 }}
              onChange={(e) => {
                const el = e.target
                el.style.height = 'auto'
                el.style.height = el.scrollHeight + 'px'
              }}
              onFocus={(e) => {
                const wrapper = e.target.closest('.rounded-2xl') as HTMLElement | null
                if (wrapper) {
                  wrapper.style.border = '2px solid #F44C10'
                  wrapper.style.boxShadow = '0 0 0 5px rgba(255, 150, 89, 0.5)'
                  wrapper.style.padding = '0'
                }
              }}
              onBlur={(e) => {
                const wrapper = e.target.closest('.rounded-2xl') as HTMLElement | null
                if (wrapper) {
                  wrapper.style.border = '1px solid #e5e7eb'
                  wrapper.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  wrapper.style.padding = '1px'
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between px-3 pb-2">
            <button onMouseDown={(e) => e.preventDefault()} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
            <button className="transition-colors" style={{ color: '#d1d5db' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
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
  const { screenToFlowPosition } = useReactFlow()
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

    if (selected) {
      const ctaNode = nodes.find((n) => n.type === 'ctaNode')
      const demoCards = nodes.filter((n) => n.type === 'demoCardNode')

      const newNode: Node = {
        id: cardNodeId,
        type: 'demoCardNode',
        position: ctaNode
          ? { x: ctaNode.position.x + 400, y: ctaNode.position.y + demoCards.length * 180 }
          : { x: (demoCards[demoCards.length - 1]?.position.x ?? 400), y: (demoCards[demoCards.length - 1]?.position.y ?? 0) + 180 },
        data: { demoId: match.demo.id, title: match.demo.title, creator: match.demo.creator, preview: match.demo.preview },
      }

      if (ctaNode) {
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
      setNodes((nds) => nds.filter((n) => n.id !== cardNodeId))
      setEdges((eds) => eds.filter((e) => e.source !== cardNodeId && e.target !== cardNodeId))
    }
  }, [setNodes, setEdges, nodes])

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
    }
    document.addEventListener('open-replace-popover', handler)
    return () => document.removeEventListener('open-replace-popover', handler)
  }, [])

  const handleReplace = useCallback((nodeId: string, match: ContentMatch) => {
    rejectDemo(replaceTarget?.demoId ?? '')
    setNodes((nds) => nds.map((n) =>
      n.id === nodeId
        ? { ...n, data: { ...n.data, demoId: match.demo.id, title: match.demo.title, creator: match.demo.creator, preview: match.demo.preview } }
        : n
    ))
    setReplaceTarget(null)
  }, [setNodes, replaceTarget])

  const handlePaneClick = useCallback(() => {
    setReplaceTarget(null)
  }, [])

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
          onDismiss={() => setReplaceTarget(null)}
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
