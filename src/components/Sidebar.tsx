import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Monitor,
  MousePointerClick,
  HelpCircle,
  FileText,
} from 'lucide-react'
import PreviewModal from './PreviewModal'
import thumbTableHero from '../assets/thumb-table-hero.svg'
import thumbContent from '../assets/thumb-content.svg'
import thumbDynamicTour from '../assets/thumb-dynamic-tour.svg'
import { demos as realDemos } from '../data/demos'

const thumbnails = [thumbTableHero, thumbContent]

const interactions = [
  { id: 'fullscreen', label: 'Full Screen Dialog', icon: Monitor, color: '#8b5cf6' },
  { id: 'cta', label: 'Call to Action', icon: MousePointerClick, color: '#FC6839' },
  { id: 'discovery', label: 'Discovery Question', icon: HelpCircle, color: '#22c55e' },
  { id: 'leadcapture', label: 'Lead Capture Form', icon: FileText, color: '#1e40af' },
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
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const expandPanel = useCallback(() => {
    if (!collapsed) return
    setContentVisible(false)
    setCollapsed(false)
    setTimeout(() => setContentVisible(true), 320)
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
        <div className="flex flex-col items-center h-full cursor-pointer" onClick={expandPanel} style={{ paddingTop: 20 }}>
          {/* Interaction type squares */}
          <div className="shrink-0 flex flex-col items-center" style={{ gap: 11 }}>
            {interactions.map(({ id, label, icon: Icon, color }) => (
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
                <Icon size={22} style={{ color }} />
              </div>
            ))}
          </div>

          {/* Demo / Dynamic Tours icon button */}
          <div className="shrink-0 flex items-center justify-center" style={{ marginTop: 16 }}>
            <div
              onMouseEnter={(e) => { setDemoIconHover(true); const r = e.currentTarget.getBoundingClientRect(); setTooltip({ text: activeTab, x: r.left, y: r.top + r.height / 2 }) }}
              onMouseLeave={() => { setDemoIconHover(false); setTooltip(null) }}
              className="flex items-center justify-center cursor-pointer"
              style={{ width: 32, height: 32 }}
            >
              {activeTab === 'Recommended' ? (
                demoIconHover ? (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="16" fill="#FC6839" fillOpacity="0.15"/>
                    <mask id="mask_rec_hover" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="6" y="6" width="20" height="20">
                      <rect x="6" y="6" width="20" height="20" fill="#D9D9D9"/>
                    </mask>
                    <g mask="url(#mask_rec_hover)">
                      <path d="M14.9346 6.94376C14.9708 6.74922 15.2496 6.74922 15.2858 6.94376L15.687 9.1004C16.2002 11.859 18.3584 14.0172 21.1171 14.5305L23.2737 14.9317C23.4683 14.9679 23.4683 15.2466 23.2737 15.2828L21.1171 15.6841C18.3584 16.1973 16.2002 18.3555 15.687 21.1141L15.2858 23.2708C15.2496 23.4653 14.9708 23.4653 14.9346 23.2708L14.5334 21.1141C14.0202 18.3555 11.862 16.1973 9.10333 15.6841L6.94669 15.2828C6.75214 15.2466 6.75214 14.9679 6.94669 14.9317L9.10333 14.5305C11.862 14.0172 14.0202 11.859 14.5334 9.1004L14.9346 6.94376Z" fill="#FC6839"/>
                      <path d="M22.3819 18.9137C22.3959 18.8384 22.5037 18.8384 22.5177 18.9137L22.6729 19.7479C22.8714 20.8151 23.7063 21.6499 24.7734 21.8484L25.6076 22.0036C25.6829 22.0176 25.6829 22.1255 25.6076 22.1395L24.7734 22.2947C23.7063 22.4932 22.8714 23.328 22.6729 24.3952L22.5177 25.2294C22.5037 25.3046 22.3959 25.3046 22.3819 25.2294L22.2267 24.3952C22.0281 23.328 21.1933 22.4932 20.1262 22.2947L19.2919 22.1395C19.2167 22.1255 19.2167 22.0176 19.2919 22.0036L20.1262 21.8484C21.1933 21.6499 22.0281 20.8151 22.2267 19.7479L22.3819 18.9137Z" fill="#FC6839"/>
                    </g>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <mask id="mask_rec_default" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="6" y="6" width="20" height="20">
                      <rect x="6" y="6" width="20" height="20" fill="#D9D9D9"/>
                    </mask>
                    <g mask="url(#mask_rec_default)">
                      <path d="M14.9346 6.94376C14.9708 6.74922 15.2496 6.74922 15.2858 6.94376L15.687 9.1004C16.2002 11.859 18.3584 14.0172 21.1171 14.5305L23.2737 14.9317C23.4683 14.9679 23.4683 15.2466 23.2737 15.2828L21.1171 15.6841C18.3584 16.1973 16.2002 18.3555 15.687 21.1141L15.2858 23.2708C15.2496 23.4653 14.9708 23.4653 14.9346 23.2708L14.5334 21.1141C14.0202 18.3555 11.862 16.1973 9.10333 15.6841L6.94669 15.2828C6.75214 15.2466 6.75214 14.9679 6.94669 14.9317L9.10333 14.5305C11.862 14.0172 14.0202 11.859 14.5334 9.1004L14.9346 6.94376Z" fill="#FC6839"/>
                      <path d="M22.3819 18.9137C22.3959 18.8384 22.5037 18.8384 22.5177 18.9137L22.6729 19.7479C22.8714 20.8151 23.7063 21.6499 24.7734 21.8484L25.6076 22.0036C25.6829 22.0176 25.6829 22.1255 25.6076 22.1395L24.7734 22.2947C23.7063 22.4932 22.8714 23.328 22.6729 24.3952L22.5177 25.2294C22.5037 25.3046 22.3959 25.3046 22.3819 25.2294L22.2267 24.3952C22.0281 23.328 21.1933 22.4932 20.1262 22.2947L19.2919 22.1395C19.2167 22.1255 19.2167 22.0176 19.2919 22.0036L20.1262 21.8484C21.1933 21.6499 22.0281 20.8151 22.2267 19.7479L22.3819 18.9137Z" fill="#FC6839"/>
                    </g>
                  </svg>
                )
              ) : activeTab === 'Dynamic Tours' ? (
                demoIconHover ? (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="16" fill="#FC6839" fillOpacity="0.15"/>
                    <path d="M22.5449 13.6367C23.3449 13.6367 24 14.2908 24 15.0908C24 16.1452 22.9529 16.7339 22.1748 16.4941L19.585 19.0762C19.8322 19.8616 19.2362 20.9092 18.1816 20.9092C17.1199 20.9091 16.5311 19.8543 16.7783 19.0762L14.9238 17.2217C14.7057 17.2871 14.3852 17.2871 14.167 17.2217L10.8584 20.5381C11.0982 21.3161 10.5092 22.363 9.45508 22.3633C8.6552 22.3633 8.00017 21.709 8 20.9092C8 19.8548 9.04707 19.2652 9.8252 19.5049L13.1416 16.1963C12.8944 15.4109 13.4914 14.3633 14.5459 14.3633C15.6074 14.3636 16.1964 15.4182 15.9492 16.1963L17.8037 18.0508C18.0218 17.9854 18.3415 17.9854 18.5596 18.0508L21.1416 15.4619C20.9016 14.6838 21.4906 13.6369 22.5449 13.6367ZM10.1816 13.6367L11.6367 14L10.1816 14.3633L9.81836 15.8184L9.45508 14.3633L8 14L9.45508 13.6367L9.81836 12.1816L10.1816 13.6367ZM18.8652 11.5059L20.3633 12.1816L18.8652 12.8584L18.1816 14.3633L17.5127 12.8584L16 12.1816L17.5127 11.5059L18.1816 10L18.8652 11.5059Z" fill="#FC6839"/>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M22.5449 13.6367C23.3449 13.6367 24 14.2908 24 15.0908C24 16.1452 22.9529 16.7339 22.1748 16.4941L19.585 19.0762C19.8322 19.8616 19.2362 20.9092 18.1816 20.9092C17.1199 20.9091 16.5311 19.8543 16.7783 19.0762L14.9238 17.2217C14.7057 17.2871 14.3852 17.2871 14.167 17.2217L10.8584 20.5381C11.0982 21.3161 10.5092 22.363 9.45508 22.3633C8.6552 22.3633 8.00017 21.709 8 20.9092C8 19.8548 9.04707 19.2652 9.8252 19.5049L13.1416 16.1963C12.8944 15.4109 13.4914 14.3633 14.5459 14.3633C15.6074 14.3636 16.1964 15.4182 15.9492 16.1963L17.8037 18.0508C18.0218 17.9854 18.3415 17.9854 18.5596 18.0508L21.1416 15.4619C20.9016 14.6838 21.4906 13.6369 22.5449 13.6367ZM10.1816 13.6367L11.6367 14L10.1816 14.3633L9.81836 15.8184L9.45508 14.3633L8 14L9.45508 13.6367L9.81836 12.1816L10.1816 13.6367ZM18.8652 11.5059L20.3633 12.1816L18.8652 12.8584L18.1816 14.3633L17.5127 12.8584L16 12.1816L17.5127 11.5059L18.1816 10L18.8652 11.5059Z" fill="#FC6839"/>
                  </svg>
                )
              ) : (
                demoIconHover ? (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="16" fill="#FC6839" fillOpacity="0.15"/>
                    <mask id="mask_demo_hover" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="6" y="6" width="20" height="20">
                      <rect x="6" y="6" width="20" height="20" fill="#D9D9D9"/>
                    </mask>
                    <g mask="url(#mask_demo_hover)">
                      <path d="M13.9165 13.7707V18.229C13.9165 18.5623 14.0623 18.8054 14.354 18.9582C14.6457 19.1109 14.9304 19.0971 15.2082 18.9165L18.6665 16.7082C18.9304 16.5554 19.0623 16.3193 19.0623 15.9998C19.0623 15.6804 18.9304 15.4443 18.6665 15.2915L15.2082 13.0832C14.9304 12.9026 14.6457 12.8887 14.354 13.0415C14.0623 13.1943 13.9165 13.4373 13.9165 13.7707ZM15.9998 24.3332C14.8471 24.3332 13.7637 24.1143 12.7498 23.6765C11.7359 23.2393 10.854 22.6457 10.104 21.8957C9.354 21.1457 8.76039 20.2637 8.32317 19.2498C7.88539 18.2359 7.6665 17.1526 7.6665 15.9998C7.6665 14.8471 7.88539 13.7637 8.32317 12.7498C8.76039 11.7359 9.354 10.854 10.104 10.104C10.854 9.354 11.7359 8.76011 12.7498 8.32234C13.7637 7.88511 14.8471 7.6665 15.9998 7.6665C17.1526 7.6665 18.2359 7.88511 19.2498 8.32234C20.2637 8.76011 21.1457 9.354 21.8957 10.104C22.6457 10.854 23.2393 11.7359 23.6765 12.7498C24.1143 13.7637 24.3332 14.8471 24.3332 15.9998C24.3332 17.1526 24.1143 18.2359 23.6765 19.2498C23.2393 20.2637 22.6457 21.1457 21.8957 21.8957C21.1457 22.6457 20.2637 23.2393 19.2498 23.6765C18.2359 24.1143 17.1526 24.3332 15.9998 24.3332ZM15.9998 22.6665C17.8471 22.6665 19.4201 22.0173 20.719 20.719C22.0173 19.4201 22.6665 17.8471 22.6665 15.9998C22.6665 14.1526 22.0173 12.5796 20.719 11.2807C19.4201 9.98234 17.8471 9.33317 15.9998 9.33317C14.1526 9.33317 12.5798 9.98234 11.2815 11.2807C9.98261 12.5796 9.33317 14.1526 9.33317 15.9998C9.33317 17.8471 9.98261 19.4201 11.2815 20.719C12.5798 22.0173 14.1526 22.6665 15.9998 22.6665Z" fill="#F44C10"/>
                    </g>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <mask id="mask_demo_default" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="6" y="6" width="20" height="20">
                      <rect x="6" y="6" width="20" height="20" fill="#D9D9D9"/>
                    </mask>
                    <g mask="url(#mask_demo_default)">
                      <path d="M13.9165 13.7707V18.229C13.9165 18.5623 14.0623 18.8054 14.354 18.9582C14.6457 19.1109 14.9304 19.0971 15.2082 18.9165L18.6665 16.7082C18.9304 16.5554 19.0623 16.3193 19.0623 15.9998C19.0623 15.6804 18.9304 15.4443 18.6665 15.2915L15.2082 13.0832C14.9304 12.9026 14.6457 12.8887 14.354 13.0415C14.0623 13.1943 13.9165 13.4373 13.9165 13.7707ZM15.9998 24.3332C14.8471 24.3332 13.7637 24.1143 12.7498 23.6765C11.7359 23.2393 10.854 22.6457 10.104 21.8957C9.354 21.1457 8.76039 20.2637 8.32317 19.2498C7.88539 18.2359 7.6665 17.1526 7.6665 15.9998C7.6665 14.8471 7.88539 13.7637 8.32317 12.7498C8.76039 11.7359 9.354 10.854 10.104 10.104C10.854 9.354 11.7359 8.76011 12.7498 8.32234C13.7637 7.88511 14.8471 7.6665 15.9998 7.6665C17.1526 7.6665 18.2359 7.88511 19.2498 8.32234C20.2637 8.76011 21.1457 9.354 21.8957 10.104C22.6457 10.854 23.2393 11.7359 23.6765 12.7498C24.1143 13.7637 24.3332 14.8471 24.3332 15.9998C24.3332 17.1526 24.1143 18.2359 23.6765 19.2498C23.2393 20.2637 22.6457 21.1457 21.8957 21.8957C21.1457 22.6457 20.2637 23.2393 19.2498 23.6765C18.2359 24.1143 17.1526 24.3332 15.9998 24.3332ZM15.9998 22.6665C17.8471 22.6665 19.4201 22.0173 20.719 20.719C22.0173 19.4201 22.6665 17.8471 22.6665 15.9998C22.6665 14.1526 22.0173 12.5796 20.719 11.2807C19.4201 9.98234 17.8471 9.33317 15.9998 9.33317C14.1526 9.33317 12.5798 9.98234 11.2815 11.2807C9.98261 12.5796 9.33317 14.1526 9.33317 15.9998C9.33317 17.8471 9.98261 19.4201 11.2815 20.719C12.5798 22.0173 14.1526 22.6665 15.9998 22.6665Z" fill="#FC6839"/>
                    </g>
                  </svg>
                )
              )}
            </div>
          </div>

          {/* Search icon circle */}
          <div className="shrink-0 flex items-center justify-center" style={{ marginTop: 14 }}>
            <div
              onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ text: 'Search', x: r.left, y: r.top + r.height / 2 }) }}
              onMouseLeave={() => setTooltip(null)}
              className="flex items-center justify-center cursor-pointer"
              style={{ width: 40, height: 40, borderRadius: 20, border: '1px solid #D0CBC6', background: 'white' }}
            >
              <svg width="20" height="20" viewBox="0.8 -2.2 20 20" fill="none">
                <path d="M16.75 14.917L12.0833 10.25C11.6667 10.583 11.1875 10.847 10.6458 11.042C10.1042 11.236 9.52778 11.333 8.91667 11.333C7.40278 11.333 6.12167 10.809 5.07333 9.761C4.02444 8.712 3.5 7.431 3.5 5.917C3.5 4.403 4.02444 3.121 5.07333 2.072C6.12167 1.024 7.40278 0.5 8.91667 0.5C10.4306 0.5 11.7119 1.024 12.7608 2.072C13.8092 3.121 14.3333 4.403 14.3333 5.917C14.3333 6.528 14.2361 7.104 14.0417 7.646C13.8472 8.187 13.5833 8.667 13.25 9.083L17.9375 13.771C18.0903 13.924 18.1667 14.111 18.1667 14.333C18.1667 14.556 18.0833 14.75 17.9167 14.917C17.7639 15.069 17.5694 15.146 17.3333 15.146C17.0972 15.146 16.9028 15.069 16.75 14.917ZM8.91667 9.667C9.95833 9.667 10.8439 9.302 11.5733 8.573C12.3022 7.844 12.6667 6.958 12.6667 5.917C12.6667 4.875 12.3022 3.989 11.5733 3.26C10.8439 2.531 9.95833 2.167 8.91667 2.167C7.875 2.167 6.98944 2.531 6.26 3.26C5.53111 3.989 5.16667 4.875 5.16667 5.917C5.16667 6.958 5.53111 7.844 6.26 8.573C6.98944 9.302 7.875 9.667 8.91667 9.667Z" fill="#172537"/>
              </svg>
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
          {interactions.map(({ id, label, icon: Icon, color }) => (
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
                <Icon size={18} style={{ color, marginTop: 15 }} />
              </div>
              <span className="text-[10px] text-gray-600 text-center leading-tight font-medium" style={{ opacity: contentVisible ? 1 : 0, transition: 'opacity 250ms ease-in' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="pt-14 flex items-center gap-6" style={{ borderBottom: '1px solid #D0CBC6', paddingLeft: 36, paddingRight: 36, opacity: contentVisible ? 1 : 0, transition: 'opacity 250ms ease-in' }}>
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

      {/* Filter + search */}
      <div className="px-9 pt-14 pb-6 flex items-center gap-2" style={{ opacity: contentVisible ? 1 : 0, transition: 'opacity 250ms ease-in' }}>
        {/* Filter button (SVG) */}
        <button
          className="shrink-0"
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setFilterHover(true)}
          onMouseLeave={() => setFilterHover(false)}
        >
          {filterHover ? (
            <svg width="78" height="32" viewBox="0 0 78 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="78" height="32" rx="16" fill="#7D2CAF"/>
              <path d="M18 11.624V12.98H14.508V15.128H17.184V16.46H14.508V20H12.828V11.624H18ZM20.0433 12.56C19.7473 12.56 19.4993 12.468 19.2993 12.284C19.1073 12.092 19.0113 11.856 19.0113 11.576C19.0113 11.296 19.1073 11.064 19.2993 10.88C19.4993 10.688 19.7473 10.592 20.0433 10.592C20.3393 10.592 20.5833 10.688 20.7753 10.88C20.9753 11.064 21.0753 11.296 21.0753 11.576C21.0753 11.856 20.9753 12.092 20.7753 12.284C20.5833 12.468 20.3393 12.56 20.0433 12.56ZM20.8713 13.352V20H19.1913V13.352H20.8713ZM24.2111 11.12V20H22.5311V11.12H24.2111ZM27.827 14.732V17.948C27.827 18.172 27.879 18.336 27.983 18.44C28.095 18.536 28.279 18.584 28.535 18.584H29.315V20H28.259C26.843 20 26.135 19.312 26.135 17.936V14.732H25.343V13.352H26.135V11.708H27.827V13.352H29.315V14.732H27.827ZM36.7033 16.532C36.7033 16.772 36.6873 16.988 36.6553 17.18H31.7953C31.8353 17.66 32.0033 18.036 32.2993 18.308C32.5953 18.58 32.9593 18.716 33.3913 18.716C34.0153 18.716 34.4593 18.448 34.7233 17.912H36.5353C36.3433 18.552 35.9753 19.08 35.4313 19.496C34.8873 19.904 34.2193 20.108 33.4273 20.108C32.7873 20.108 32.2113 19.968 31.6993 19.688C31.1953 19.4 30.7993 18.996 30.5113 18.476C30.2313 17.956 30.0913 17.356 30.0913 16.676C30.0913 15.988 30.2313 15.384 30.5113 14.864C30.7913 14.344 31.1833 13.944 31.6873 13.664C32.1913 13.384 32.7713 13.244 33.4273 13.244C34.0593 13.244 34.6233 13.38 35.1193 13.652C35.6233 13.924 36.0113 14.312 36.2833 14.816C36.5633 15.312 36.7033 15.884 36.7033 16.532ZM34.9633 16.052C34.9553 15.62 34.7993 15.276 34.4953 15.02C34.1913 14.756 33.8193 14.624 33.3793 14.624C32.9633 14.624 32.6113 14.752 32.3233 15.008C32.0433 15.256 31.8713 15.604 31.8073 16.052H34.9633ZM39.6096 14.384C39.8256 14.032 40.1056 13.756 40.4496 13.556C40.8016 13.356 41.2016 13.256 41.6496 13.256V15.02H41.2056C40.6776 15.02 40.2776 15.144 40.0056 15.392C39.7416 15.64 39.6096 16.072 39.6096 16.688V20H37.9296V13.352H39.6096V14.384Z" fill="white"/>
              <mask id="mask_filter_hover" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="50" y="8" width="16" height="16">
                <rect x="50" y="8" width="16" height="16" fill="#D9D9D9"/>
              </mask>
              <g mask="url(#mask_filter_hover)">
                <path d="M59.3331 16.6665V20.6665C59.3331 20.8554 59.2693 21.0136 59.1418 21.1412C59.0138 21.2692 58.8553 21.3332 58.6664 21.3332H57.3331C57.1442 21.3332 56.986 21.2692 56.8584 21.1412C56.7304 21.0136 56.6664 20.8554 56.6664 20.6665V16.6665L52.7998 11.7332C52.6331 11.5109 52.6082 11.2776 52.7251 11.0332C52.8416 10.7887 53.0442 10.6665 53.3331 10.6665H62.6664C62.9553 10.6665 63.1582 10.7887 63.2751 11.0332C63.3916 11.2776 63.3664 11.5109 63.1998 11.7332L59.3331 16.6665ZM57.9998 16.1998L61.2998 11.9998H54.6998L57.9998 16.1998Z" fill="white"/>
              </g>
            </svg>
          ) : (
            <svg width="78" height="32" viewBox="0 0 78 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="78" height="32" rx="16" fill="#9B50CA"/>
              <path d="M18 11.624V12.98H14.508V15.128H17.184V16.46H14.508V20H12.828V11.624H18ZM20.0433 12.56C19.7473 12.56 19.4993 12.468 19.2993 12.284C19.1073 12.092 19.0113 11.856 19.0113 11.576C19.0113 11.296 19.1073 11.064 19.2993 10.88C19.4993 10.688 19.7473 10.592 20.0433 10.592C20.3393 10.592 20.5833 10.688 20.7753 10.88C20.9753 11.064 21.0753 11.296 21.0753 11.576C21.0753 11.856 20.9753 12.092 20.7753 12.284C20.5833 12.468 20.3393 12.56 20.0433 12.56ZM20.8713 13.352V20H19.1913V13.352H20.8713ZM24.2111 11.12V20H22.5311V11.12H24.2111ZM27.827 14.732V17.948C27.827 18.172 27.879 18.336 27.983 18.44C28.095 18.536 28.279 18.584 28.535 18.584H29.315V20H28.259C26.843 20 26.135 19.312 26.135 17.936V14.732H25.343V13.352H26.135V11.708H27.827V13.352H29.315V14.732H27.827ZM36.7033 16.532C36.7033 16.772 36.6873 16.988 36.6553 17.18H31.7953C31.8353 17.66 32.0033 18.036 32.2993 18.308C32.5953 18.58 32.9593 18.716 33.3913 18.716C34.0153 18.716 34.4593 18.448 34.7233 17.912H36.5353C36.3433 18.552 35.9753 19.08 35.4313 19.496C34.8873 19.904 34.2193 20.108 33.4273 20.108C32.7873 20.108 32.2113 19.968 31.6993 19.688C31.1953 19.4 30.7993 18.996 30.5113 18.476C30.2313 17.956 30.0913 17.356 30.0913 16.676C30.0913 15.988 30.2313 15.384 30.5113 14.864C30.7913 14.344 31.1833 13.944 31.6873 13.664C32.1913 13.384 32.7713 13.244 33.4273 13.244C34.0593 13.244 34.6233 13.38 35.1193 13.652C35.6233 13.924 36.0113 14.312 36.2833 14.816C36.5633 15.312 36.7033 15.884 36.7033 16.532ZM34.9633 16.052C34.9553 15.62 34.7993 15.276 34.4953 15.02C34.1913 14.756 33.8193 14.624 33.3793 14.624C32.9633 14.624 32.6113 14.752 32.3233 15.008C32.0433 15.256 31.8713 15.604 31.8073 16.052H34.9633ZM39.6096 14.384C39.8256 14.032 40.1056 13.756 40.4496 13.556C40.8016 13.356 41.2016 13.256 41.6496 13.256V15.02H41.2056C40.6776 15.02 40.2776 15.144 40.0056 15.392C39.7416 15.64 39.6096 16.072 39.6096 16.688V20H37.9296V13.352H39.6096V14.384Z" fill="white"/>
              <mask id="mask_filter_default" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="50" y="8" width="16" height="16">
                <rect x="50" y="8" width="16" height="16" fill="#D9D9D9"/>
              </mask>
              <g mask="url(#mask_filter_default)">
                <path d="M59.3331 16.6665V20.6665C59.3331 20.8554 59.2693 21.0136 59.1418 21.1412C59.0138 21.2692 58.8553 21.3332 58.6664 21.3332H57.3331C57.1442 21.3332 56.986 21.2692 56.8584 21.1412C56.7304 21.0136 56.6664 20.8554 56.6664 20.6665V16.6665L52.7998 11.7332C52.6331 11.5109 52.6082 11.2776 52.7251 11.0332C52.8416 10.7887 53.0442 10.6665 53.3331 10.6665H62.6664C62.9553 10.6665 63.1582 10.7887 63.2751 11.0332C63.3916 11.2776 63.3664 11.5109 63.1998 11.7332L59.3331 16.6665ZM57.9998 16.1998L61.2998 11.9998H54.6998L57.9998 16.1998Z" fill="white"/>
              </g>
            </svg>
          )}
        </button>

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
            type="text"
            placeholder="Search"
            className="text-sm outline-none bg-transparent flex-1 min-w-0 placeholder:opacity-50"
            style={{ color: '#172537' }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Demo list */}
      <div className="relative flex-1 overflow-hidden mb-6">
        <div className="absolute top-0 left-0 right-0 h-3 z-10 pointer-events-none transition-opacity duration-200" style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(0,0,0,0.06) 0%, transparent 100%)', opacity: canScrollUp && contentVisible ? 1 : 0 }} />
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
