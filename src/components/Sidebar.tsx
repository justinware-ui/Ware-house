'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Monitor,
  FileText,
} from 'lucide-react'
import PreviewModal from './PreviewModal'
import thumbTableHero from '../assets/thumb-table-hero.svg'
import thumbContent from '../assets/thumb-content.svg'
import thumbDynamicTour from '../assets/thumb-dynamic-tour.svg'
import { demos as realDemos } from '../data/demos'

const thumbnails = [thumbTableHero, thumbContent]

function CtaIcon({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <path d="M7.57073 12.4878C6.32195 12.4228 5.26829 11.9415 4.40976 11.0439C3.55122 10.1463 3.12195 9.06667 3.12195 7.80488C3.12195 6.50407 3.57724 5.39837 4.4878 4.4878C5.39837 3.57724 6.50407 3.12195 7.80488 3.12195C9.06667 3.12195 10.1463 3.55122 11.0439 4.40976C11.9415 5.26829 12.4228 6.32195 12.4878 7.57073L10.8488 7.08293C10.6797 6.38049 10.3154 5.80488 9.7561 5.3561C9.19675 4.90732 8.54634 4.68293 7.80488 4.68293C6.94634 4.68293 6.21138 4.98862 5.6 5.6C4.98862 6.21138 4.68293 6.94634 4.68293 7.80488C4.68293 8.54634 4.90732 9.19675 5.3561 9.7561C5.80488 10.3154 6.38049 10.6797 7.08293 10.8488L7.57073 12.4878ZM8.50732 15.5707C8.39024 15.5967 8.27317 15.6098 8.1561 15.6098H7.80488C6.7252 15.6098 5.71057 15.4049 4.76098 14.9951C3.81138 14.5854 2.98537 14.0293 2.28293 13.3268C1.58049 12.6244 1.02439 11.7984 0.614634 10.8488C0.204878 9.89919 0 8.88455 0 7.80488C0 6.7252 0.204878 5.71057 0.614634 4.76098C1.02439 3.81138 1.58049 2.98537 2.28293 2.28293C2.98537 1.58049 3.81138 1.02439 4.76098 0.614634C5.71057 0.204878 6.7252 0 7.80488 0C8.88455 0 9.89919 0.204878 10.8488 0.614634C11.7984 1.02439 12.6244 1.58049 13.3268 2.28293C14.0293 2.98537 14.5854 3.81138 14.9951 4.76098C15.4049 5.71057 15.6098 6.7252 15.6098 7.80488V8.1561C15.6098 8.27317 15.5967 8.39024 15.5707 8.50732L14.0488 8.03902V7.80488C14.0488 6.06179 13.4439 4.58537 12.2341 3.37561C11.0244 2.16585 9.54797 1.56098 7.80488 1.56098C6.06179 1.56098 4.58537 2.16585 3.37561 3.37561C2.16585 4.58537 1.56098 6.06179 1.56098 7.80488C1.56098 9.54797 2.16585 11.0244 3.37561 12.2341C4.58537 13.4439 6.06179 14.0488 7.80488 14.0488H8.03902L8.50732 15.5707ZM14.4585 16L11.122 12.6634L10.1463 15.6098L7.80488 7.80488L15.6098 10.1463L12.6634 11.122L16 14.4585L14.4585 16Z" fill="currentColor"/>
    </svg>
  )
}

function DiscoveryIcon({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="-3 -1.5 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <path d="M3.99627 -0.000547647C5.22027 -0.000547647 6.19827 0.335452 6.93027 1.00745C7.67427 1.67945 8.04627 2.59745 8.04627 3.76145C8.04627 4.97345 7.66227 5.88545 6.89427 6.49745C6.12627 7.10945 5.10627 7.41545 3.83427 7.41545L3.76227 8.83745H1.98027L1.89027 6.01145H2.48427C3.64827 6.01145 4.53627 5.85545 5.14827 5.54345C5.77227 5.23145 6.08427 4.63745 6.08427 3.76145C6.08427 3.12545 5.89827 2.62745 5.52627 2.26745C5.16627 1.90745 4.66227 1.72745 4.01427 1.72745C3.36627 1.72745 2.85627 1.90145 2.48427 2.24945C2.11227 2.59745 1.92627 3.08345 1.92627 3.70745H0.000273488C0.000273488 2.98745 0.162273 2.34545 0.486273 1.78145C0.810273 1.21745 1.27227 0.779452 1.87227 0.467453C2.48427 0.155452 3.19227 -0.000547647 3.99627 -0.000547647ZM2.84427 12.8155C2.47227 12.8155 2.16027 12.6895 1.90827 12.4375C1.65627 12.1855 1.53027 11.8735 1.53027 11.5015C1.53027 11.1295 1.65627 10.8175 1.90827 10.5655C2.16027 10.3135 2.47227 10.1875 2.84427 10.1875C3.20427 10.1875 3.51027 10.3135 3.76227 10.5655C4.01427 10.8175 4.14027 11.1295 4.14027 11.5015C4.14027 11.8735 4.01427 12.1855 3.76227 12.4375C3.51027 12.6895 3.20427 12.8155 2.84427 12.8155Z" fill="currentColor"/>
    </svg>
  )
}

function HotspotIcon({ size = 18 }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(-45.5254, -42.25)">
        <circle cx="53.526" cy="50.2507" r="2.66667" fill="currentColor"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M52.5678 42.978C52.8813 42.9371 53.2007 42.916 53.5247 42.916C53.8488 42.916 54.1682 42.9371 54.4817 42.978C54.8468 43.0256 55.1042 43.3602 55.0565 43.7253C55.0089 44.0904 54.6743 44.3477 54.3092 44.3001C54.0528 44.2666 53.7909 44.2493 53.5247 44.2493C53.2585 44.2493 52.9967 44.2666 52.7402 44.3001C52.3751 44.3477 52.0406 44.0904 51.9929 43.7253C51.9453 43.3602 52.2027 43.0256 52.5678 42.978ZM57.0547 44.5538C57.279 44.2619 57.6976 44.2071 57.9895 44.4314C58.4973 44.8216 58.9525 45.2768 59.3427 45.7846C59.567 46.0765 59.5122 46.4951 59.2203 46.7194C58.9283 46.9437 58.5098 46.889 58.2855 46.597C57.9659 46.1811 57.593 45.8082 57.1771 45.4886C56.8851 45.2643 56.8303 44.8457 57.0547 44.5538ZM49.9948 44.5538C50.2191 44.8457 50.1643 45.2643 49.8724 45.4886C49.4565 45.8082 49.0836 46.1811 48.764 46.597C48.5397 46.889 48.1211 46.9437 47.8292 46.7194C47.5372 46.4951 47.4824 46.0765 47.7068 45.7846C48.097 45.2768 48.5522 44.8216 49.06 44.4314C49.3519 44.2071 49.7704 44.2619 49.9948 44.5538ZM60.0488 48.7176C60.4139 48.6699 60.7485 48.9273 60.7961 49.2924C60.837 49.6059 60.8581 49.9253 60.8581 50.2493C60.8581 50.5734 60.837 50.8928 60.7961 51.2063C60.7485 51.5714 60.4139 51.8288 60.0488 51.7811C59.6837 51.7335 59.4264 51.3989 59.474 51.0338C59.5074 50.7774 59.5247 50.5156 59.5247 50.2493C59.5247 49.9831 59.5074 49.7213 59.474 49.4649C59.4264 49.0998 59.6837 48.7652 60.0488 48.7176ZM47.0007 48.7176C47.3657 48.7652 47.6231 49.0998 47.5755 49.4649C47.542 49.7213 47.5247 49.9831 47.5247 50.2493C47.5247 50.5156 47.542 50.7774 47.5755 51.0338C47.6231 51.3989 47.3657 51.7335 47.0007 51.7811C46.6356 51.8288 46.301 51.5714 46.2534 51.2063C46.2125 50.8928 46.1914 50.5734 46.1914 50.2493C46.1914 49.9253 46.2125 49.6059 46.2534 49.2924C46.301 48.9273 46.6356 48.6699 47.0007 48.7176ZM59.2203 53.7793C59.5122 54.0036 59.567 54.4222 59.3427 54.7141C58.9525 55.2219 58.4973 55.6771 57.9895 56.0673C57.6976 56.2916 57.279 56.2368 57.0547 55.9449C56.8303 55.653 56.8851 55.2344 57.1771 55.0101C57.593 54.6905 57.9659 54.3176 58.2855 53.9017C58.5098 53.6097 58.9283 53.5549 59.2203 53.7793ZM47.8292 53.7793C48.1211 53.5549 48.5397 53.6097 48.764 53.9017C49.0836 54.3176 49.4565 54.6905 49.8724 55.0101C50.1643 55.2344 50.2191 55.653 49.9948 55.9449C49.7704 56.2368 49.3519 56.2916 49.06 56.0673C48.5522 55.6771 48.097 55.2219 47.7068 54.7141C47.4824 54.4222 47.5372 54.0036 47.8292 53.7793ZM51.9929 56.7734C52.0406 56.4083 52.3751 56.151 52.7402 56.1986C52.9967 56.2321 53.2585 56.2493 53.5247 56.2493C53.7909 56.2493 54.0528 56.2321 54.3092 56.1986C54.6743 56.151 55.0089 56.4083 55.0565 56.7734C55.1042 57.1385 54.8468 57.4731 54.4817 57.5207C54.1682 57.5616 53.8488 57.5827 53.5247 57.5827C53.2007 57.5827 52.8813 57.5616 52.5678 57.5207C52.2027 57.4731 51.9453 57.1385 51.9929 56.7734Z" fill="currentColor"/>
      </g>
    </svg>
  )
}

const interactions = [
  { id: 'fullscreen', label: 'Full Screen Dialog', icon: Monitor, color: '#8b5cf6', bgColor: undefined as string | undefined },
  { id: 'discovery', label: 'Discovery Question', icon: DiscoveryIcon, color: '#22c55e', bgColor: undefined as string | undefined },
  { id: 'cta', label: 'Call to Action', icon: CtaIcon, color: '#FC6839', bgColor: undefined as string | undefined },
  { id: 'leadcapture', label: 'Lead Capture Form', icon: FileText, color: '#1e40af', bgColor: undefined as string | undefined },
  { id: 'hotspot', label: 'Screengrab & Hotspots', icon: HotspotIcon, color: '#D4A017', bgColor: '#FCE39F' },
]

const tabs = ['Demos', 'Dynamic Tours', 'Recommended'] as const

const demos = realDemos.map((d) => ({
  id: d.id,
  title: d.title,
  creator: d.creator,
  type: d.type,
  preview: d.preview,
  thumb: thumbnails[Math.floor(Math.random() * thumbnails.length)],
}))

const MIN_WIDTH = 320
const MAX_WIDTH = 620

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Demos')
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return 420
    const saved = localStorage.getItem('sidebar-width')
    return saved ? Number(saved) : 420
  })
  const [previewDemo, setPreviewDemo] = useState<{ url: string; title: string } | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const shuffled = [...demos].sort(() => Math.random() - 0.5)
    const count = Math.max(2, Math.floor(Math.random() * Math.ceil(demos.length / 3)) + 1)
    return new Set(shuffled.slice(0, count).map((d) => d.id))
  })
  const [searchFocused, setSearchFocused] = useState(false)
  const [filterHover, setFilterHover] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [contentVisible, setContentVisible] = useState(true)
  const [demoIconHover, setDemoIconHover] = useState(false)
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const expandPanel = useCallback((focusSearch = false) => {
    if (!collapsed) return
    setTooltip(null)
    setContentVisible(false)
    setCollapsed(false)
    setTimeout(() => {
      setContentVisible(true)
      if (focusSearch) {
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
    }, 320)
  }, [collapsed])

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const delta = startX.current - e.clientX
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta))
      setWidth(newWidth)
      localStorage.setItem('sidebar-width', String(newWidth))
    }
    const onMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const updateScrollShadows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollUp(el.scrollTop > 4)
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4)
  }, [])

  useEffect(() => {
    updateScrollShadows()
  }, [updateScrollShadows])

  const onDragStart = (event: React.DragEvent, interactionType: string, nodeData?: Record<string, string>) => {
    event.dataTransfer.setData('application/reactflow', interactionType)
    if (nodeData) {
      event.dataTransfer.setData('application/reactflow-data', JSON.stringify(nodeData))
    }
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <>
    <div className="relative shrink-0 flex">
      {/* Collapse / Expand toggle button — outside aside to avoid overflow clip */}
      <button
        onClick={() => {
          if (collapsed) {
            expandPanel()
          } else {
            setCollapsed(true)
            setTooltip(null)
            setContentVisible(true)
          }
        }}
        className="absolute z-20 flex items-center justify-center transition-transform duration-200 hover:scale-110"
        style={{
          width: 32,
          height: 32,
          top: '50%',
          left: -16 - 32,
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0.5" y="0.5" width="31" height="31" rx="15.5" fill="white" stroke="#D0CBC6"/>
          <mask id="mask_collapse_toggle" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="7" y="7" width="18" height="18">
            <rect x="7" y="7" width="18" height="18" fill="#D9D9D9"/>
          </mask>
          <g mask="url(#mask_collapse_toggle)">
            <path d={collapsed
              ? "M16.9751 19.9751L13.5251 16.5251C13.4501 16.4501 13.3971 16.3688 13.3661 16.2813C13.3346 16.1938 13.3188 16.1001 13.3188 16.0001C13.3188 15.9001 13.3346 15.8063 13.3661 15.7188C13.3971 15.6313 13.4501 15.5501 13.5251 15.4751L16.9751 12.0251C17.1126 11.8876 17.2876 11.8188 17.5001 11.8188C17.7126 11.8188 17.8876 11.8876 18.0251 12.0251C18.1626 12.1626 18.2313 12.3376 18.2313 12.5501C18.2313 12.7626 18.1626 12.9376 18.0251 13.0751L15.1001 16.0001L18.0251 18.9251C18.1626 19.0626 18.2313 19.2376 18.2313 19.4501C18.2313 19.6626 18.1626 19.8376 18.0251 19.9751C17.8876 20.1126 17.7126 20.1813 17.5001 20.1813C17.2876 20.1813 17.1126 20.1126 16.9751 19.9751Z"
              : "M15.0249 19.9751L18.4749 16.5251C18.5499 16.4501 18.6029 16.3688 18.6339 16.2813C18.6654 16.1938 18.6812 16.1001 18.6812 16.0001C18.6812 15.9001 18.6654 15.8063 18.6339 15.7188C18.6029 15.6313 18.5499 15.5501 18.4749 15.4751L15.0249 12.0251C14.8874 11.8876 14.7124 11.8188 14.4999 11.8188C14.2874 11.8188 14.1124 11.8876 13.9749 12.0251C13.8374 12.1626 13.7687 12.3376 13.7687 12.5501C13.7687 12.7626 13.8374 12.9376 13.9749 13.0751L16.8999 16.0001L13.9749 18.9251C13.8374 19.0626 13.7687 19.2376 13.7687 19.4501C13.7687 19.6626 13.8374 19.8376 13.9749 19.9751C14.1124 20.1126 14.2874 20.1813 14.4999 20.1813C14.7124 20.1813 14.8874 20.1126 15.0249 19.9751Z"
            } fill="#6F6F6F"/>
          </g>
        </svg>
      </button>

    <aside
      className="relative border-l border-gray-200 flex flex-col shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out"
      style={{ backgroundColor: '#F7F4F2', width: collapsed ? 98 : width }}
    >

      {/* Collapsed view */}
      {collapsed && (
        <div className="flex flex-col items-center h-full cursor-pointer" onClick={() => expandPanel()} style={{ paddingTop: 20 }}>
          {/* Interaction type squares */}
          <div className="shrink-0 flex flex-col items-center" style={{ gap: 11 }}>
          {interactions.map(({ id, label, icon: Icon, color, bgColor }) => (
            <div
              key={id}
              draggable
              onDragStart={(e) => onDragStart(e, id, id === 'cta' ? { variant: 'cta' } : undefined)}
              onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ text: label, x: r.left, y: r.top + r.height / 2 }) }}
              onMouseLeave={() => setTooltip(null)}
              className="flex items-center justify-center cursor-grab border border-[#D0CBC6] hover:border-[#FC6839] hover:shadow-sm transition-all bg-white"
              style={{
                width: 60,
                height: 60,
                borderRadius: 8,
                boxShadow: '0 2px 8px -4px rgba(48,41,33,0.2)',
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{ width: 32, height: 32, borderRadius: 4, backgroundColor: bgColor ?? `${color}33` }}
              >
                <Icon size={18} style={{ color: '#293748' }} />
              </div>
            </div>
          ))}
          </div>

          {/* Search icon circle */}
          <div className="shrink-0 flex items-center justify-center" style={{ marginTop: 16 }}>
            <div
              onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ text: 'Search', x: r.left, y: r.top + r.height / 2 }) }}
              onMouseLeave={() => setTooltip(null)}
              onClick={(e) => { e.stopPropagation(); expandPanel(true) }}
              className="flex items-center justify-center cursor-pointer"
              style={{ width: 40, height: 40, borderRadius: 20, border: '1px solid #D0CBC6', background: 'white' }}
            >
              <svg width="20" height="20" viewBox="0.8 -2.2 20 20" fill="none">
                <path d="M16.75 14.917L12.0833 10.25C11.6667 10.583 11.1875 10.847 10.6458 11.042C10.1042 11.236 9.52778 11.333 8.91667 11.333C7.40278 11.333 6.12167 10.809 5.07333 9.761C4.02444 8.712 3.5 7.431 3.5 5.917C3.5 4.403 4.02444 3.121 5.07333 2.072C6.12167 1.024 7.40278 0.5 8.91667 0.5C10.4306 0.5 11.7119 1.024 12.7608 2.072C13.8092 3.121 14.3333 4.403 14.3333 5.917C14.3333 6.528 14.2361 7.104 14.0417 7.646C13.8472 8.187 13.5833 8.667 13.25 9.083L17.9375 13.771C18.0903 13.924 18.1667 14.111 18.1667 14.333C18.1667 14.556 18.0833 14.75 17.9167 14.917C17.7639 15.069 17.5694 15.146 17.3333 15.146C17.0972 15.146 16.9028 15.069 16.75 14.917ZM8.91667 9.667C9.95833 9.667 10.8439 9.302 11.5733 8.573C12.3022 7.844 12.6667 6.958 12.6667 5.917C12.6667 4.875 12.3022 3.989 11.5733 3.26C10.8439 2.531 9.95833 2.167 8.91667 2.167C7.875 2.167 6.98944 2.531 6.26 3.26C5.53111 3.989 5.16667 4.875 5.16667 5.917C5.16667 6.958 5.53111 7.844 6.26 8.573C6.98944 9.302 7.875 9.667 8.91667 9.667Z" fill="#172537"/>
              </svg>
            </div>
          </div>

          {/* Demo / Dynamic Tours / Recommended icon button */}
          <div className="shrink-0 flex items-center justify-center" style={{ marginTop: 14 }}>
            <div
              onMouseEnter={(e) => { setDemoIconHover(true); const r = e.currentTarget.getBoundingClientRect(); setTooltip({ text: activeTab, x: r.left, y: r.top + r.height / 2 }) }}
              onMouseLeave={() => { setDemoIconHover(false); setTooltip(null) }}
              className="flex items-center justify-center cursor-pointer"
              style={{ width: 40, height: 40 }}
            >
              {activeTab === 'Recommended' ? (
                demoIconHover ? (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect width="40" height="40" rx="20" fill="#FC6839" fillOpacity="0.15"/>
                    <mask id="mask_rec_hov" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="10" y="10" width="20" height="20"><rect x="10" y="10" width="20" height="20" fill="#D9D9D9"/></mask>
                    <g mask="url(#mask_rec_hov)">
                      <path d="M18.9346 10.9438C18.9708 10.7492 19.2496 10.7492 19.2858 10.9438L19.687 13.1004C20.2002 15.859 22.3584 18.0172 25.1171 18.5305L27.2737 18.9317C27.4683 18.9679 27.4683 19.2466 27.2737 19.2828L25.1171 19.6841C22.3584 20.1973 20.2002 22.3555 19.687 25.1141L19.2858 27.2708C19.2496 27.4653 18.9708 27.4653 18.9346 27.2708L18.5334 25.1141C18.0202 22.3555 15.862 20.1973 13.1033 19.6841L10.9467 19.2828C10.7521 19.2466 10.7521 18.9679 10.9467 18.9317L13.1033 18.5305C15.862 18.0172 18.0202 15.859 18.5334 13.1004L18.9346 10.9438Z" fill="#FC6839"/>
                      <path d="M26.3819 22.9137C26.3959 22.8384 26.5037 22.8384 26.5177 22.9137L26.6729 23.7479C26.8714 24.8151 27.7063 25.6499 28.7734 25.8484L29.6076 26.0036C29.6829 26.0176 29.6829 26.1255 29.6076 26.1395L28.7734 26.2947C27.7063 26.4932 26.8714 27.328 26.6729 28.3952L26.5177 29.2294C26.5037 29.3046 26.3959 29.3046 26.3819 29.2294L26.2267 28.3952C26.0281 27.328 25.1933 26.4932 24.1262 26.2947L23.2919 26.1395C23.2167 26.1255 23.2167 26.0176 23.2919 26.0036L24.1262 25.8484C25.1933 25.6499 26.0281 24.8151 26.2267 23.7479L26.3819 22.9137Z" fill="#FC6839"/>
                    </g>
                  </svg>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <mask id="mask_rec_def" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="10" y="10" width="20" height="20"><rect x="10" y="10" width="20" height="20" fill="#D9D9D9"/></mask>
                    <g mask="url(#mask_rec_def)">
                      <path d="M18.9346 10.9438C18.9708 10.7492 19.2496 10.7492 19.2858 10.9438L19.687 13.1004C20.2002 15.859 22.3584 18.0172 25.1171 18.5305L27.2737 18.9317C27.4683 18.9679 27.4683 19.2466 27.2737 19.2828L25.1171 19.6841C22.3584 20.1973 20.2002 22.3555 19.687 25.1141L19.2858 27.2708C19.2496 27.4653 18.9708 27.4653 18.9346 27.2708L18.5334 25.1141C18.0202 22.3555 15.862 20.1973 13.1033 19.6841L10.9467 19.2828C10.7521 19.2466 10.7521 18.9679 10.9467 18.9317L13.1033 18.5305C15.862 18.0172 18.0202 15.859 18.5334 13.1004L18.9346 10.9438Z" fill="#FC6839"/>
                      <path d="M26.3819 22.9137C26.3959 22.8384 26.5037 22.8384 26.5177 22.9137L26.6729 23.7479C26.8714 24.8151 27.7063 25.6499 28.7734 25.8484L29.6076 26.0036C29.6829 26.0176 29.6829 26.1255 29.6076 26.1395L28.7734 26.2947C27.7063 26.4932 26.8714 27.328 26.6729 28.3952L26.5177 29.2294C26.5037 29.3046 26.3959 29.3046 26.3819 29.2294L26.2267 28.3952C26.0281 27.328 25.1933 26.4932 24.1262 26.2947L23.2919 26.1395C23.2167 26.1255 23.2167 26.0176 23.2919 26.0036L24.1262 25.8484C25.1933 25.6499 26.0281 24.8151 26.2267 23.7479L26.3819 22.9137Z" fill="#FC6839"/>
                    </g>
                  </svg>
                )
              ) : activeTab === 'Dynamic Tours' ? (
                demoIconHover ? (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect width="40" height="40" rx="20" fill="#FC6839" fillOpacity="0.15"/>
                    <path d="M26.5449 17.6367C27.3449 17.6367 28 18.2908 28 19.0908C28 20.1452 26.9529 20.7339 26.1748 20.4941L23.585 23.0762C23.8322 23.8616 23.2362 24.9092 22.1816 24.9092C21.1199 24.9091 20.5311 23.8543 20.7783 23.0762L18.9238 21.2217C18.7057 21.2871 18.3852 21.2871 18.167 21.2217L14.8584 24.5381C15.0982 25.3161 14.5092 26.363 13.4551 26.3633C12.6552 26.3633 12.0002 25.709 12 24.9092C12 23.8548 13.0471 23.2652 13.8252 23.5049L17.1416 20.1963C16.8944 19.4109 17.4914 18.3633 18.5459 18.3633C19.6074 18.3636 20.1964 19.4182 19.9492 20.1963L21.8037 22.0508C22.0218 21.9854 22.3415 21.9854 22.5596 22.0508L25.1416 19.4619C24.9016 18.6838 25.4906 17.6369 26.5449 17.6367ZM14.1816 17.6367L15.6367 18L14.1816 18.3633L13.8184 19.8184L13.4551 18.3633L12 18L13.4551 17.6367L13.8184 16.1816L14.1816 17.6367ZM22.8652 15.5059L24.3633 16.1816L22.8652 16.8584L22.1816 18.3633L21.5127 16.8584L20 16.1816L21.5127 15.5059L22.1816 14L22.8652 15.5059Z" fill="#FC6839"/>
                  </svg>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M26.5449 17.6367C27.3449 17.6367 28 18.2908 28 19.0908C28 20.1452 26.9529 20.7339 26.1748 20.4941L23.585 23.0762C23.8322 23.8616 23.2362 24.9092 22.1816 24.9092C21.1199 24.9091 20.5311 23.8543 20.7783 23.0762L18.9238 21.2217C18.7057 21.2871 18.3852 21.2871 18.167 21.2217L14.8584 24.5381C15.0982 25.3161 14.5092 26.363 13.4551 26.3633C12.6552 26.3633 12.0002 25.709 12 24.9092C12 23.8548 13.0471 23.2652 13.8252 23.5049L17.1416 20.1963C16.8944 19.4109 17.4914 18.3633 18.5459 18.3633C19.6074 18.3636 20.1964 19.4182 19.9492 20.1963L21.8037 22.0508C22.0218 21.9854 22.3415 21.9854 22.5596 22.0508L25.1416 19.4619C24.9016 18.6838 25.4906 17.6369 26.5449 17.6367ZM14.1816 17.6367L15.6367 18L14.1816 18.3633L13.8184 19.8184L13.4551 18.3633L12 18L13.4551 17.6367L13.8184 16.1816L14.1816 17.6367ZM22.8652 15.5059L24.3633 16.1816L22.8652 16.8584L22.1816 18.3633L21.5127 16.8584L20 16.1816L21.5127 15.5059L22.1816 14L22.8652 15.5059Z" fill="#FC6839"/>
                  </svg>
                )
              ) : (
                demoIconHover ? (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect width="40" height="40" rx="20" fill="#FC6839" fillOpacity="0.15"/>
                    <mask id="mask_demo_hov" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="10" y="10" width="20" height="20"><rect x="10" y="10" width="20" height="20" fill="#D9D9D9"/></mask>
                    <g mask="url(#mask_demo_hov)">
                      <path d="M17.9165 17.7707V22.229C17.9165 22.5623 18.0623 22.8054 18.354 22.9582C18.6457 23.1109 18.9304 23.0971 19.2082 22.9165L22.6665 20.7082C22.9304 20.5554 23.0623 20.3193 23.0623 19.9998C23.0623 19.6804 22.9304 19.4443 22.6665 19.2915L19.2082 17.0832C18.9304 16.9026 18.6457 16.8887 18.354 17.0415C18.0623 17.1943 17.9165 17.4373 17.9165 17.7707ZM19.9998 28.3332C18.8471 28.3332 17.7637 28.1143 16.7498 27.6765C15.7359 27.2393 14.854 26.6457 14.104 25.8957C13.354 25.1457 12.7604 24.2637 12.3232 23.2498C11.8854 22.2359 11.6665 21.1526 11.6665 19.9998C11.6665 18.8471 11.8854 17.7637 12.3232 16.7498C12.7604 15.7359 13.354 14.854 14.104 14.104C14.854 13.354 15.7359 12.7601 16.7498 12.3223C17.7637 11.8851 18.8471 11.6665 19.9998 11.6665C21.1526 11.6665 22.2359 11.8851 23.2498 12.3223C24.2637 12.7601 25.1457 13.354 25.8957 14.104C26.6457 14.854 27.2393 15.7359 27.6765 16.7498C28.1143 17.7637 28.3332 18.8471 28.3332 19.9998C28.3332 21.1526 28.1143 22.2359 27.6765 23.2498C27.2393 24.2637 26.6457 25.1457 25.8957 25.8957C25.1457 26.6457 24.2637 27.2393 23.2498 27.6765C22.2359 28.1143 21.1526 28.3332 19.9998 28.3332ZM19.9998 26.6665C21.8471 26.6665 23.4201 26.0173 24.719 24.719C26.0173 23.4201 26.6665 21.8471 26.6665 19.9998C26.6665 18.1526 26.0173 16.5796 24.719 15.2807C23.4201 13.9823 21.8471 13.3332 19.9998 13.3332C18.1526 13.3332 16.5798 13.9823 15.2815 15.2807C13.9826 16.5796 13.3332 18.1526 13.3332 19.9998C13.3332 21.8471 13.9826 23.4201 15.2815 24.719C16.5798 26.0173 18.1526 26.6665 19.9998 26.6665Z" fill="#F44C10"/>
                    </g>
                  </svg>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <mask id="mask_demo_def" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="10" y="10" width="20" height="20"><rect x="10" y="10" width="20" height="20" fill="#D9D9D9"/></mask>
                    <g mask="url(#mask_demo_def)">
                      <path d="M17.9165 17.7707V22.229C17.9165 22.5623 18.0623 22.8054 18.354 22.9582C18.6457 23.1109 18.9304 23.0971 19.2082 22.9165L22.6665 20.7082C22.9304 20.5554 23.0623 20.3193 23.0623 19.9998C23.0623 19.6804 22.9304 19.4443 22.6665 19.2915L19.2082 17.0832C18.9304 16.9026 18.6457 16.8887 18.354 17.0415C18.0623 17.1943 17.9165 17.4373 17.9165 17.7707ZM19.9998 28.3332C18.8471 28.3332 17.7637 28.1143 16.7498 27.6765C15.7359 27.2393 14.854 26.6457 14.104 25.8957C13.354 25.1457 12.7604 24.2637 12.3232 23.2498C11.8854 22.2359 11.6665 21.1526 11.6665 19.9998C11.6665 18.8471 11.8854 17.7637 12.3232 16.7498C12.7604 15.7359 13.354 14.854 14.104 14.104C14.854 13.354 15.7359 12.7601 16.7498 12.3223C17.7637 11.8851 18.8471 11.6665 19.9998 11.6665C21.1526 11.6665 22.2359 11.8851 23.2498 12.3223C24.2637 12.7601 25.1457 13.354 25.8957 14.104C26.6457 14.854 27.2393 15.7359 27.6765 16.7498C28.1143 17.7637 28.3332 18.8471 28.3332 19.9998C28.3332 21.1526 28.1143 22.2359 27.6765 23.2498C27.2393 24.2637 26.6457 25.1457 25.8957 25.8957C25.1457 26.6457 24.2637 27.2393 23.2498 27.6765C22.2359 28.1143 21.1526 28.3332 19.9998 28.3332ZM19.9998 26.6665C21.8471 26.6665 23.4201 26.0173 24.719 24.719C26.0173 23.4201 26.6665 21.8471 26.6665 19.9998C26.6665 18.1526 26.0173 16.5796 24.719 15.2807C23.4201 13.9823 21.8471 13.3332 19.9998 13.3332C18.1526 13.3332 16.5798 13.9823 15.2815 15.2807C13.9826 16.5796 13.3332 18.1526 13.3332 19.9998C13.3332 21.8471 13.9826 23.4201 15.2815 24.719C16.5798 26.0173 18.1526 26.6665 19.9998 26.6665Z" fill="#FC6839"/>
                    </g>
                  </svg>
                )
              )}
            </div>
          </div>

          {/* Demo card tiles — scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto w-full mt-4 mb-6" style={{ paddingBottom: 16 }}>
            <div className="flex flex-col items-center" style={{ gap: 10 }}>
              {demos.map((demo, i) => {
                const isType = activeTab === 'Dynamic Tours'
                const bgColor = i % 2 === 0 ? '#C3EBD8' : '#FFDFCF'
                return (
                  <div
                    key={demo.id}
                    draggable
                    onDragStart={(e) => {
                      const cardThumb = activeTab === 'Dynamic Tours' ? thumbDynamicTour : demo.thumb
                      onDragStart(e, `card-${activeTab.toLowerCase().replace(/\s+/g, '-')}`, { demoId: demo.id, title: demo.title, creator: demo.creator, thumb: cardThumb, preview: demo.preview })
                    }}
                    onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ text: demo.title, x: r.left, y: r.top + r.height / 2 }) }}
                    onMouseLeave={() => setTooltip(null)}
                    className="shrink-0 flex items-center justify-center cursor-grab border border-[#D0CBC6] hover:border-[#FC6839] hover:shadow-sm transition-all bg-white"
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 8,
                      boxShadow: '0 2px 8px -4px rgba(48,41,33,0.2)',
                    }}
                  >
                    <div
                      className="flex items-center justify-center overflow-hidden"
                      style={{ width: 32, height: 32, borderRadius: 4, backgroundColor: bgColor }}
                    >
                      <img
                        src={isType ? thumbDynamicTour : demo.thumb}
                        alt=""
                        style={{ width: 32, height: 32, objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Expanded view */}
      {!collapsed && <>
      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10 hover:bg-brand-500/20 active:bg-brand-500/30 transition-colors flex items-center justify-center"
      >
        <div className="w-1 h-10 rounded-full bg-gray-300" />
      </div>
      {/* Interaction types */}
      <div className="px-9 pt-9 pb-3">
        <h2 className="text-xs font-semibold text-navy-600 uppercase tracking-wider mb-3" style={{ opacity: contentVisible ? 1 : 0, transition: 'opacity 250ms ease-in' }}>
          Interactions
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {interactions.map(({ id, label, icon: Icon, color, bgColor }) => (
            <div
              key={id}
              draggable
              onDragStart={(e) => onDragStart(e, id, id === 'cta' ? { variant: 'cta' } : undefined)}
              className="relative flex flex-col items-center gap-1.5 p-2 rounded-lg border border-gray-200 bg-white cursor-grab hover:border-brand-300 hover:shadow-sm transition-all group"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-1 left-1/2 -translate-x-1/2" style={{ transform: 'translateX(-50%) rotate(90deg)', opacity: contentVisible ? 1 : 0, transition: 'opacity 250ms ease-in' }}>
                <path d="M7.5 16.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.163-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.326.326.49.718.49 1.177s-.164.851-.49 1.177c-.326.327-.718.49-1.177.49Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.164-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.327.326.49.718.49 1.177s-.163.851-.49 1.177c-.326.327-.718.49-1.177.49ZM7.5 11.666c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.163-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.326.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.164-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.326.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489ZM7.5 6.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.163-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.327.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.164-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.327.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489Z" fill="#8D8A87"/>
              </svg>
              <div className="w-full aspect-[4/3] flex items-center justify-center" style={{ opacity: contentVisible ? 1 : 0, transition: 'opacity 250ms ease-in' }}>
                <div
                  className="flex items-center justify-center rounded-md"
                  style={{ width: 32, height: 32, backgroundColor: bgColor ?? `${color}33`, marginTop: 15 }}
                >
                  <Icon size={16} style={{ color: '#293748' }} />
                </div>
              </div>
              <span className="text-[10px] text-gray-600 text-center leading-tight font-medium" style={{ opacity: contentVisible ? 1 : 0, transition: 'opacity 250ms ease-in' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter + search */}
      <div className="px-9 pt-10 pb-6 flex items-center gap-2" style={{ opacity: contentVisible ? 1 : 0, transition: 'opacity 250ms ease-in' }}>
        {/* Search field */}
        <div
          className="flex-1 min-w-0 flex items-center gap-2 bg-white transition-shadow duration-200"
          style={{
            height: 32,
            borderRadius: 16,
            border: searchFocused ? '2px solid #F44C10' : '1px solid #D0CBC6',
            boxShadow: searchFocused ? '0 0 0 5px rgba(255, 150, 89, 0.5)' : 'none',
            padding: searchFocused ? '0 15px' : '0 16px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <mask id="mask_search_sidebar" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
              <rect width="16" height="16" fill="#D9D9D9"/>
            </mask>
            <g mask="url(#mask_search_sidebar)">
              <path d="M12.6 13.5333L8.86667 9.8C8.53333 10.0667 8.15 10.2778 7.71667 10.4333C7.28333 10.5889 6.82222 10.6667 6.33333 10.6667C5.12222 10.6667 4.09733 10.2473 3.25867 9.4087C2.41956 8.5696 2 7.5444 2 6.3333C2 5.1222 2.41956 4.0971 3.25867 3.258C4.09733 2.4193 5.12222 2 6.33333 2C7.54444 2 8.56956 2.4193 9.40867 3.258C10.2473 4.0971 10.6667 5.1222 10.6667 6.3333C10.6667 6.8222 10.5889 7.2833 10.4333 7.7167C10.2778 8.15 10.0667 8.5333 9.8 8.8667L13.55 12.6167C13.6722 12.7389 13.7333 12.8889 13.7333 13.0667C13.7333 13.2444 13.6667 13.4 13.5333 13.5333C13.4111 13.6556 13.2556 13.7167 13.0667 13.7167C12.8778 13.7167 12.7222 13.6556 12.6 13.5333ZM6.33333 9.3333C7.16667 9.3333 7.87511 9.0418 8.45867 8.4587C9.04178 7.8751 9.33333 7.1667 9.33333 6.3333C9.33333 5.5 9.04178 4.7916 8.45867 4.208C7.87511 3.6249 7.16667 3.3333 6.33333 3.3333C5.5 3.3333 4.79156 3.6249 4.208 4.208C3.62489 4.7916 3.33333 5.5 3.33333 6.3333C3.33333 7.1667 3.62489 7.8751 4.208 8.4587C4.79156 9.0418 5.5 9.3333 6.33333 9.3333Z" fill="#172537"/>
            </g>
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search"
            className="text-sm outline-none bg-transparent flex-1 min-w-0 placeholder:opacity-50"
            style={{ color: '#172537' }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        {/* Filter button */}
        <button
          className="shrink-0 flex items-center justify-center rounded-full transition-colors"
          style={{
            width: 32,
            height: 32,
            backgroundColor: filterHover ? '#7D2CAF' : '#9B50CA',
            cursor: 'pointer',
          }}
          onMouseEnter={() => setFilterHover(true)}
          onMouseLeave={() => setFilterHover(false)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <mask id="mask_filter_icon" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
              <rect width="24" height="24" fill="#D9D9D9"/>
            </mask>
            <g mask="url(#mask_filter_icon)">
              <path d="M14.0009 13V19C14.0009 19.2833 13.9052 19.5207 13.7139 19.712C13.5219 19.904 13.2842 20 13.0009 20H11.0009C10.7176 20 10.4802 19.904 10.2889 19.712C10.0969 19.5207 10.0009 19.2833 10.0009 19V13L4.20088 5.6C3.95088 5.26667 3.91355 4.91667 4.08888 4.55C4.26355 4.18333 4.56755 4 5.00088 4H19.0009C19.4342 4 19.7386 4.18333 19.9139 4.55C20.0886 4.91667 20.0509 5.26667 19.8009 5.6L14.0009 13ZM12.0009 12.3L16.9509 6H7.05088L12.0009 12.3Z" fill="white"/>
            </g>
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="pt-4 flex items-center gap-6" style={{ borderBottom: '1px solid #D0CBC6', paddingLeft: 36, paddingRight: 36, opacity: contentVisible ? 1 : 0, transition: 'opacity 250ms ease-in' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="group/tab relative text-sm transition-colors hover:!text-[#FC6839] flex items-center"
              style={{
                color: '#172537',
                fontWeight: isActive ? 600 : 400,
                marginBottom: -1,
              }}
            >
              {tab === 'Recommended' && (
                <svg width="14" height="14" viewBox="2 10 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 -ml-1 -mr-1" style={{ transform: 'translate(-7px, -11px)' }}>
                  <path d="M11.4273 11.1084C11.465 10.9066 11.7551 10.9066 11.7928 11.1084L12.2104 13.3465C12.7446 16.2092 14.9911 18.4488 17.8625 18.9814L20.1073 19.3978C20.3098 19.4354 20.3098 19.7246 20.1073 19.7622L17.8625 20.1785C14.9911 20.7111 12.7446 22.9508 12.2104 25.8135L11.7928 28.0515C11.7551 28.2534 11.465 28.2534 11.4273 28.0515L11.0097 25.8135C10.4754 22.9508 8.22901 20.7111 5.35761 20.1785L3.11281 19.7622C2.91031 19.7246 2.91031 19.4354 3.11281 19.3978L5.35761 18.9814C8.22901 18.4488 10.4754 16.2092 11.0097 13.3465L11.4273 11.1084Z" fill="url(#paint0_sidebar_sparkle)"/>
                  <path d="M19.1688 23.5301C19.1834 23.452 19.2956 23.452 19.3102 23.5301L19.4717 24.3958C19.6784 25.5032 20.5473 26.3695 21.6581 26.5755L22.5264 26.7366C22.6047 26.7511 22.6047 26.863 22.5264 26.8775L21.6581 27.0386C20.5473 27.2446 19.6784 28.111 19.4717 29.2184L19.3102 30.0841C19.2956 30.1622 19.1834 30.1622 19.1688 30.0841L19.0072 29.2184C18.8006 28.111 17.9316 27.2446 16.8209 27.0386L15.9525 26.8775C15.8742 26.863 15.8742 26.7511 15.9525 26.7366L16.8209 26.5755C17.9316 26.3695 18.8006 25.5032 19.0072 24.3958L19.1688 23.5301Z" fill="url(#paint1_sidebar_sparkle)"/>
                  <defs>
                    <linearGradient id="paint0_sidebar_sparkle" x1="2.96094" y1="21.4548" x2="22.5851" y2="21.4548" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FFB352"/><stop offset="0.5" stopColor="#FC6839"/><stop offset="1" stopColor="#EB2E24"/>
                    </linearGradient>
                    <linearGradient id="paint1_sidebar_sparkle" x1="2.96094" y1="21.4548" x2="22.5851" y2="21.4548" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FFB352"/><stop offset="0.5" stopColor="#FC6839"/><stop offset="1" stopColor="#EB2E24"/>
                    </linearGradient>
                  </defs>
                </svg>
              )}
              <span className="relative pb-2">
                {tab}
                <span
                  className={`absolute bottom-[-1px] left-0 right-0 transition-all ${isActive ? 'opacity-100 h-[2px] group-hover/tab:h-[4px]' : 'opacity-0 h-[2px] group-hover/tab:opacity-100'}`}
                  style={{ backgroundColor: '#FC6839' }}
                />
              </span>
            </button>
          )
        })}
      </div>

      {/* Demo list */}
      <div className="relative flex-1 overflow-hidden pt-12 mb-6">
        <div className="absolute top-12 left-0 right-0 h-3 z-10 pointer-events-none transition-opacity duration-200" style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(0,0,0,0.06) 0%, transparent 100%)', opacity: canScrollUp && contentVisible ? 1 : 0 }} />
        <div className="absolute bottom-0 left-0 right-0 h-3 z-10 pointer-events-none transition-opacity duration-200" style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 100%, rgba(0,0,0,0.06) 0%, transparent 100%)', opacity: canScrollDown && contentVisible ? 1 : 0 }} />
      <div ref={scrollRef} className="h-full overflow-y-auto px-9 pt-1 pb-1" onScroll={updateScrollShadows}>
        {demos.map((demo) => (
          <div
            key={demo.id}
            draggable
            onDragStart={(e) => {
              const cardThumb = activeTab === 'Dynamic Tours' ? thumbDynamicTour : demo.thumb
              onDragStart(e, `card-${activeTab.toLowerCase().replace(/\s+/g, '-')}`, { demoId: demo.id, title: demo.title, creator: demo.creator, thumb: cardThumb, preview: demo.preview })
            }}
            className="flex items-center bg-white border border-[#D0CBC6] hover:border-[#FC6839] hover:shadow-sm transition-all cursor-grab"
            style={{ padding: 16, borderRadius: 8, marginBottom: 12, gap: 12 }}
          >
            {/* Drag handle */}
            <svg width="16" height="16" viewBox="16 27 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ opacity: contentVisible ? 1 : 0, transition: 'opacity 250ms ease-in' }}>
              <path d="M21.9993 40.3334C21.6327 40.3334 21.3189 40.203 21.058 39.9421C20.7967 39.6807 20.666 39.3667 20.666 39.0001C20.666 38.6334 20.7967 38.3194 21.058 38.0581C21.3189 37.7972 21.6327 37.6667 21.9993 37.6667C22.366 37.6667 22.68 37.7972 22.9413 38.0581C23.2022 38.3194 23.3327 38.6334 23.3327 39.0001C23.3327 39.3667 23.2022 39.6807 22.9413 39.9421C22.68 40.203 22.366 40.3334 21.9993 40.3334ZM25.9993 40.3334C25.6327 40.3334 25.3189 40.203 25.058 39.9421C24.7967 39.6807 24.666 39.3667 24.666 39.0001C24.666 38.6334 24.7967 38.3194 25.058 38.0581C25.3189 37.7972 25.6327 37.6667 25.9993 37.6667C26.366 37.6667 26.68 37.7972 26.9413 38.0581C27.2022 38.3194 27.3327 38.6334 27.3327 39.0001C27.3327 39.3667 27.2022 39.6807 26.9413 39.9421C26.68 40.203 26.366 40.3334 25.9993 40.3334ZM21.9993 36.3334C21.6327 36.3334 21.3189 36.2027 21.058 35.9414C20.7967 35.6805 20.666 35.3667 20.666 35.0001C20.666 34.6334 20.7967 34.3194 21.058 34.0581C21.3189 33.7972 21.6327 33.6667 21.9993 33.6667C22.366 33.6667 22.68 33.7972 22.9413 34.0581C23.2022 34.3194 23.3327 34.6334 23.3327 35.0001C23.3327 35.3667 23.2022 35.6805 22.9413 35.9414C22.68 36.2027 22.366 36.3334 21.9993 36.3334ZM25.9993 36.3334C25.6327 36.3334 25.3189 36.2027 25.058 35.9414C24.7967 35.6805 24.666 35.3667 24.666 35.0001C24.666 34.6334 24.7967 34.3194 25.058 34.0581C25.3189 33.7972 25.6327 33.6667 25.9993 33.6667C26.366 33.6667 26.68 33.7972 26.9413 34.0581C27.2022 34.3194 27.3327 34.6334 27.3327 35.0001C27.3327 35.3667 27.2022 35.6805 26.9413 35.9414C26.68 36.2027 26.366 36.3334 25.9993 36.3334ZM21.9993 32.3334C21.6327 32.3334 21.3189 32.2027 21.058 31.9414C20.7967 31.6805 20.666 31.3667 20.666 31.0001C20.666 30.6334 20.7967 30.3196 21.058 30.0587C21.3189 29.7974 21.6327 29.6667 21.9993 29.6667C22.366 29.6667 22.68 29.7974 22.9413 30.0587C23.2022 30.3196 23.3327 30.6334 23.3327 31.0001C23.3327 31.3667 23.2022 31.6805 22.9413 31.9414C22.68 32.2027 22.366 32.3334 21.9993 32.3334ZM25.9993 32.3334C25.6327 32.3334 25.3189 32.2027 25.058 31.9414C24.7967 31.6805 24.666 31.3667 24.666 31.0001C24.666 30.6334 24.7967 30.3196 25.058 30.0587C25.3189 29.7974 25.6327 29.6667 25.9993 29.6667C26.366 29.6667 26.68 29.7974 26.9413 30.0587C27.2022 30.3196 27.3327 30.6334 27.3327 31.0001C27.3327 31.3667 27.2022 31.6805 26.9413 31.9414C26.68 32.2027 26.366 32.3334 25.9993 32.3334Z" fill="#8D8A87"/>
            </svg>

            {/* Thumbnail */}
            <img
              src={activeTab === 'Dynamic Tours' ? thumbDynamicTour : demo.thumb}
              alt=""
              className="shrink-0 object-cover"
              style={{ width: 31, height: 31, borderRadius: 4, opacity: contentVisible ? 1 : 0, transition: 'opacity 250ms ease-in' }}
            />

            {/* Info */}
            <div className="flex-1 min-w-0" style={{ opacity: contentVisible ? 1 : 0, transition: 'opacity 250ms ease-in' }}>
              <p className="text-sm font-semibold truncate" style={{ color: '#172537' }}>{demo.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs" style={{ color: '#6F6F6F' }}>{demo.creator}</span>
                <button className="text-xs font-semibold hover:opacity-80" style={{ color: '#FC6839' }}>
                  Show more
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center shrink-0" style={{ gap: 10, opacity: contentVisible ? 1 : 0, transition: 'opacity 250ms ease-in' }}>
              {/* Preview (eye) */}
              <button className="hover:opacity-70 transition-opacity" onClick={(e) => { e.stopPropagation(); setPreviewDemo({ url: demo.preview, title: demo.title }) }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <mask id={`mask_eye_sb_${demo.id}`} style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="18" height="18">
                    <rect width="18" height="18" fill="#D9D9D9"/>
                  </mask>
                  <g mask={`url(#mask_eye_sb_${demo.id})`}>
                    <path d="M8.99961 12C9.93711 12 10.7341 11.672 11.3906 11.016C12.0466 10.3595 12.3746 9.5625 12.3746 8.625C12.3746 7.6875 12.0466 6.8905 11.3906 6.234C10.7341 5.578 9.93711 5.25 8.99961 5.25C8.06211 5.25 7.26511 5.578 6.60861 6.234C5.95261 6.8905 5.62461 7.6875 5.62461 8.625C5.62461 9.5625 5.95261 10.3595 6.60861 11.016C7.26511 11.672 8.06211 12 8.99961 12ZM8.99961 10.65C8.43711 10.65 7.95911 10.453 7.56561 10.059C7.17161 9.6655 6.97461 9.1875 6.97461 8.625C6.97461 8.0625 7.17161 7.58425 7.56561 7.19025C7.95911 6.79675 8.43711 6.6 8.99961 6.6C9.56211 6.6 10.0404 6.79675 10.4344 7.19025C10.8279 7.58425 11.0246 8.0625 11.0246 8.625C11.0246 9.1875 10.8279 9.6655 10.4344 10.059C10.0404 10.453 9.56211 10.65 8.99961 10.65ZM8.99961 14.25C7.26211 14.25 5.67461 13.7908 4.23711 12.8723C2.79961 11.9533 1.71211 10.7125 0.974609 9.15C0.937109 9.0875 0.912109 9.00925 0.899609 8.91525C0.887109 8.82175 0.880859 8.725 0.880859 8.625C0.880859 8.525 0.887109 8.428 0.899609 8.334C0.912109 8.2405 0.937109 8.1625 0.974609 8.1C1.71211 6.5375 2.79961 5.297 4.23711 4.3785C5.67461 3.4595 7.26211 3 8.99961 3C10.7371 3 12.3246 3.4595 13.7621 4.3785C15.1996 5.297 16.2871 6.5375 17.0246 8.1C17.0621 8.1625 17.0871 8.2405 17.0996 8.334C17.1121 8.428 17.1184 8.525 17.1184 8.625C17.1184 8.725 17.1121 8.82175 17.0996 8.91525C17.0871 9.00925 17.0621 9.0875 17.0246 9.15C16.2871 10.7125 15.1996 11.9533 13.7621 12.8723C12.3246 13.7908 10.7371 14.25 8.99961 14.25ZM8.99961 12.75C10.4121 12.75 11.7091 12.378 12.8906 11.634C14.0716 10.8905 14.9746 9.8875 15.5996 8.625C14.9746 7.3625 14.0716 6.35925 12.8906 5.61525C11.7091 4.87175 10.4121 4.5 8.99961 4.5C7.58711 4.5 6.29011 4.87175 5.10861 5.61525C3.92761 6.35925 3.02461 7.3625 2.39961 8.625C3.02461 9.8875 3.92761 10.8905 5.10861 11.634C6.29011 12.378 7.58711 12.75 8.99961 12.75Z" fill="#293748"/>
                  </g>
                </svg>
              </button>
              {/* Favorite (heart) */}
              <button
                className="relative group/fav flex items-center justify-center w-8 h-8 transition-all"
                onClick={(e) => {
                  e.stopPropagation()
                  setFavorites((prev) => {
                    const next = new Set(prev)
                    if (next.has(demo.id)) next.delete(demo.id)
                    else next.add(demo.id)
                    return next
                  })
                }}
              >
                <div className="absolute inset-0 rounded-full bg-[#FB56B9]/15 opacity-0 group-hover/fav:opacity-100 transition-opacity" />
                <svg width="20" height="20" viewBox="10 10 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-[1]">
                  {favorites.has(demo.id) ? (
                    <path d="M20 14.664C20.872 13.648 22.208 13 23.6 13C26.064 13 28 14.928 28 17.4C28 20.416 25.28 22.888 21.16 26.624L20 27.68L18.84 26.624C14.72 22.888 12 20.416 12 17.4C12 14.928 13.936 13 16.4 13C17.792 13 19.128 13.648 20 14.664Z" fill="#FB56B9"/>
                  ) : (
                    <path fillRule="evenodd" clipRule="evenodd" d="M20.0818 25.4418L20.0852 25.4387C22.1767 23.5422 23.7835 22.0785 24.8862 20.7294C25.9713 19.4019 26.4 18.382 26.4 17.4C26.4 15.8136 25.1823 14.6 23.6 14.6C22.6917 14.6 21.7934 15.0311 21.2141 15.7061L20 17.1207L18.7859 15.7061C18.2066 15.0311 17.3083 14.6 16.4 14.6C14.8177 14.6 13.6 15.8136 13.6 17.4C13.6 18.382 14.0287 19.4019 15.1138 20.7294C16.2165 22.0785 17.8233 23.5422 19.9148 25.4387L19.9171 25.4408L20 25.52L20.0818 25.4418ZM20 27.68L18.84 26.624C14.72 22.888 12 20.416 12 17.4C12 14.928 13.936 13 16.4 13C17.3006 13 18.1777 13.2712 18.9209 13.7379C19.3265 13.9925 19.6922 14.3053 20 14.664C20.3078 14.3053 20.6735 13.9925 21.0791 13.7379C21.8223 13.2712 22.6994 13 23.6 13C26.064 13 28 14.928 28 17.4C28 20.416 25.28 22.888 21.16 26.624L20 27.68Z" className="fill-[#6F6F6F] group-hover/fav:fill-[#FB56B9]" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      </div>
      </>}
    </aside>
    </div>
    {previewDemo && (
      <PreviewModal url={previewDemo.url} title={previewDemo.title} onClose={() => setPreviewDemo(null)} />
    )}
    {tooltip && createPortal(
      <div
        className="pointer-events-none"
        style={{
          position: 'fixed',
          left: tooltip.x - 8,
          top: tooltip.y,
          transform: 'translate(-100%, -50%)',
          zIndex: 9999,
          height: 34,
          paddingLeft: 12,
          paddingRight: 12,
          borderRadius: 4,
          backgroundColor: '#172537',
          color: 'white',
          fontSize: 13,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          transition: 'opacity 150ms',
        }}
      >
        {tooltip.text}
      </div>,
      document.body
    )}
    </>
  )
}
