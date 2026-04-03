import { useState, useRef, useCallback, useEffect } from 'react'
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

const tabs = ['Recommended', 'Dynamic Tours', 'Demos'] as const

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
  const [width, setWidth] = useState(420)
  const [previewDemo, setPreviewDemo] = useState<{ url: string; title: string } | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const shuffled = [...demos].sort(() => Math.random() - 0.5)
    const count = Math.max(2, Math.floor(Math.random() * Math.ceil(demos.length / 3)) + 1)
    return new Set(shuffled.slice(0, count).map((d) => d.id))
  })
  const [searchFocused, setSearchFocused] = useState(false)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

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

  const onDragStart = (event: React.DragEvent, interactionType: string, nodeData?: Record<string, string>) => {
    event.dataTransfer.setData('application/reactflow', interactionType)
    if (nodeData) {
      event.dataTransfer.setData('application/reactflow-data', JSON.stringify(nodeData))
    }
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <>
    <aside className="relative border-l border-gray-200 flex flex-col shrink-0 overflow-hidden" style={{ backgroundColor: '#F7F4F2', width }}>
      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10 hover:bg-brand-500/20 active:bg-brand-500/30 transition-colors flex items-center justify-center"
      >
        <div className="w-1 h-10 rounded-full bg-gray-300" />
      </div>
      {/* Interaction types */}
      <div className="px-9 pt-9 pb-3">
        <h2 className="text-xs font-semibold text-navy-600 uppercase tracking-wider mb-3">
          Interactions
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {interactions.map(({ id, label, icon: Icon, color }) => (
            <div
              key={id}
              draggable
              onDragStart={(e) => onDragStart(e, id)}
              className="relative flex flex-col items-center gap-1.5 p-2 rounded-lg border border-gray-200 bg-white cursor-grab hover:border-brand-300 hover:shadow-sm transition-all group"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-1 left-1/2 -translate-x-1/2" style={{ transform: 'translateX(-50%) rotate(90deg)' }}>
                <path d="M7.5 16.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.163-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.326.326.49.718.49 1.177s-.164.851-.49 1.177c-.326.327-.718.49-1.177.49Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.164-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.327.326.49.718.49 1.177s-.163.851-.49 1.177c-.326.327-.718.49-1.177.49ZM7.5 11.666c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.163-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.326.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.164-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.326.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489ZM7.5 6.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.163-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.327.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.164-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.327.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489Z" fill="#8D8A87"/>
              </svg>
              <div className="w-full aspect-[4/3] flex items-center justify-center">
                <Icon size={18} style={{ color, marginTop: 15 }} />
              </div>
              <span className="text-[10px] text-gray-600 text-center leading-tight font-medium">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="pt-14 flex items-center gap-6" style={{ borderBottom: '1px solid #D6D1CB', paddingLeft: 30, paddingRight: 36 }}>
        {/* Sparkle icon */}
        <svg width="20" height="20" viewBox="2 10 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 -mr-3 mb-2" style={{ transform: 'translate(8px, -8px)' }}>
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

        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative pb-2 transition-colors text-sm"
            style={{
              color: activeTab === tab ? '#172537' : '#172537',
              opacity: activeTab === tab ? 1 : 0.5,
              borderBottom: activeTab === tab ? '2px solid #EC682B' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filter + search */}
      <div className="px-9 pt-14 pb-6 flex items-center gap-2">
        {/* Filter button */}
        <button className="shrink-0">
          <svg width="107" height="40" viewBox="0 0 107 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="107" height="40" rx="20" fill="#9B50CA"/>
            <path d="M31 15.228V16.81H26.926V19.316H30.048V20.87H26.926V25H24.966V15.228H31ZM33.3838 16.32C33.0385 16.32 32.7492 16.2127 32.5158 15.998C32.2918 15.774 32.1798 15.4987 32.1798 15.172C32.1798 14.8453 32.2918 14.5747 32.5158 14.36C32.7492 14.136 33.0385 14.024 33.3838 14.024C33.7292 14.024 34.0138 14.136 34.2378 14.36C34.4712 14.5747 34.5878 14.8453 34.5878 15.172C34.5878 15.4987 34.4712 15.774 34.2378 15.998C34.0138 16.2127 33.7292 16.32 33.3838 16.32ZM34.3498 17.244V25H32.3898V17.244H34.3498ZM38.2463 14.64V25H36.2863V14.64H38.2463ZM42.4648 18.854V22.606C42.4648 22.8673 42.5255 23.0587 42.6468 23.18C42.7775 23.292 42.9921 23.348 43.2908 23.348H44.2008V25H42.9688C41.3168 25 40.4908 24.1973 40.4908 22.592V18.854H39.5668V17.244H40.4908V15.326H42.4648V17.244H44.2008V18.854H42.4648ZM52.8205 20.954C52.8205 21.234 52.8019 21.486 52.7645 21.71H47.0945C47.1412 22.27 47.3372 22.7087 47.6825 23.026C48.0279 23.3433 48.4525 23.502 48.9565 23.502C49.6845 23.502 50.2025 23.1893 50.5105 22.564H52.6245C52.4005 23.3107 51.9712 23.9267 51.3365 24.412C50.7019 24.888 49.9225 25.126 48.9985 25.126C48.2519 25.126 47.5799 24.9627 46.9825 24.636C46.3945 24.3 45.9325 23.8287 45.5965 23.222C45.2699 22.6153 45.1065 21.9153 45.1065 21.122C45.1065 20.3193 45.2699 19.6147 45.5965 19.008C45.9232 18.4013 46.3805 17.9347 46.9685 17.608C47.5565 17.2813 48.2332 17.118 48.9985 17.118C49.7359 17.118 50.3939 17.2767 50.9725 17.594C51.5605 17.9113 52.0132 18.364 52.3305 18.952C52.6572 19.5307 52.8205 20.198 52.8205 20.954ZM50.7905 20.394C50.7812 19.89 50.5992 19.4887 50.2445 19.19C49.8899 18.882 49.4559 18.728 48.9425 18.728C48.4572 18.728 48.0465 18.8773 47.7105 19.176C47.3839 19.4653 47.1832 19.8713 47.1085 20.394H50.7905ZM56.2112 18.448C56.4632 18.0373 56.7898 17.7153 57.1912 17.482C57.6018 17.2487 58.0685 17.132 58.5912 17.132V19.19H58.0732C57.4572 19.19 56.9905 19.3347 56.6732 19.624C56.3652 19.9133 56.2112 20.4173 56.2112 21.136V25H54.2512V17.244H56.2112V18.448Z" fill="white"/>
            <mask id="mask0_filter" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="67" y="12" width="16" height="16">
              <rect x="67" y="12" width="16" height="16" fill="#D9D9D9"/>
            </mask>
            <g mask="url(#mask0_filter)">
              <path d="M76.3326 20.6667V24.6667C76.3326 24.8556 76.2688 25.0138 76.1413 25.1414C76.0133 25.2694 75.8548 25.3334 75.666 25.3334H74.3326C74.1437 25.3334 73.9855 25.2694 73.858 25.1414C73.73 25.0138 73.666 24.8556 73.666 24.6667V20.6667L69.7993 15.7334C69.6326 15.5111 69.6077 15.2778 69.7246 15.0334C69.8411 14.7889 70.0437 14.6667 70.3326 14.6667H79.666C79.9548 14.6667 80.1577 14.7889 80.2746 15.0334C80.3911 15.2778 80.366 15.5111 80.1993 15.7334L76.3326 20.6667ZM74.9993 20.2L78.2993 16H71.6993L74.9993 20.2Z" fill="white"/>
            </g>
          </svg>
        </button>

        {/* Search field */}
        <div
          className="flex-1 min-w-0 flex items-center gap-2 h-10 px-4 bg-white rounded-full transition-shadow duration-200"
          style={{
            border: searchFocused ? '2px solid #F44C10' : '1px solid #D0CBC6',
            boxShadow: searchFocused ? '0 0 0 5px rgba(255, 150, 89, 0.5)' : 'none',
            padding: searchFocused ? '0 15px' : '0 16px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M12.6 13.5333L8.86667 9.8C8.53333 10.0667 8.15 10.2778 7.71667 10.4333C7.28333 10.5889 6.82222 10.6667 6.33333 10.6667C5.12222 10.6667 4.09733 10.2473 3.25867 9.4087C2.41956 8.5696 2 7.5444 2 6.3333C2 5.1222 2.41956 4.0971 3.25867 3.258C4.09733 2.4193 5.12222 2 6.33333 2C7.54444 2 8.56956 2.4193 9.40867 3.258C10.2473 4.0971 10.6667 5.1222 10.6667 6.3333C10.6667 6.8222 10.5889 7.2833 10.4333 7.7167C10.2778 8.15 10.0667 8.5333 9.8 8.8667L13.55 12.6167C13.6722 12.7389 13.7333 12.8889 13.7333 13.0667C13.7333 13.2444 13.6667 13.4 13.5333 13.5333C13.4111 13.6556 13.2556 13.7167 13.0667 13.7167C12.8778 13.7167 12.7222 13.6556 12.6 13.5333ZM6.33333 9.3333C7.16667 9.3333 7.87511 9.0418 8.45867 8.4587C9.04178 7.8751 9.33333 7.1667 9.33333 6.3333C9.33333 5.5 9.04178 4.7916 8.45867 4.208C7.87511 3.6249 7.16667 3.3333 6.33333 3.3333C5.5 3.3333 4.79156 3.6249 4.208 4.208C3.62489 4.7916 3.33333 5.5 3.33333 6.3333C3.33333 7.1667 3.62489 7.8751 4.208 8.4587C4.79156 9.0418 5.5 9.3333 6.33333 9.3333Z" fill="#172537"/>
          </svg>
          <input
            type="text"
            placeholder="Search"
            className="text-sm outline-none bg-transparent flex-1 min-w-0 text-gray-700 placeholder:text-gray-400"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Demo list */}
      <div className="flex-1 overflow-y-auto px-9 pt-1 pb-1 mb-6">
        {demos.map((demo) => (
          <div
            key={demo.id}
            draggable
            onDragStart={(e) => {
              const cardThumb = activeTab === 'Dynamic Tours' ? thumbDynamicTour : demo.thumb
              onDragStart(e, `card-${activeTab.toLowerCase().replace(/\s+/g, '-')}`, { demoId: demo.id, title: demo.title, creator: demo.creator, thumb: cardThumb, preview: demo.preview })
            }}
            className="flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-200 bg-white hover:border-[#FC6839] hover:shadow-sm transition-all cursor-grab mb-2"
          >
            {/* Drag handle */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M7.5 16.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.163-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.326.326.49.718.49 1.177s-.164.851-.49 1.177c-.326.327-.718.49-1.177.49Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.164-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.327.326.49.718.49 1.177s-.163.851-.49 1.177c-.326.327-.718.49-1.177.49ZM7.5 11.666c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.163-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.326.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.164-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.326.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489ZM7.5 6.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.163-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.327.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.164-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.327.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489Z" fill="#8D8A87"/>
            </svg>

            {/* Thumbnail */}
            <img
              src={activeTab === 'Dynamic Tours' ? thumbDynamicTour : demo.thumb}
              alt=""
              className="w-12 h-12 rounded-lg shrink-0"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{demo.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">{demo.creator}</span>
                <button className="text-xs text-brand-500 font-semibold hover:text-brand-600">
                  Show more
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button className="hover:opacity-70 transition-opacity" onClick={(e) => { e.stopPropagation(); setPreviewDemo({ url: demo.preview, title: demo.title }) }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <mask id={`mask_eye_sb_${demo.id}`} style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                    <rect width="20" height="20" fill="#D9D9D9"/>
                  </mask>
                  <g mask={`url(#mask_eye_sb_${demo.id})`}>
                    <path d="M9.99935 13.3334C11.041 13.3334 11.9266 12.9689 12.656 12.24C13.3849 11.5106 13.7493 10.625 13.7493 9.58337C13.7493 8.54171 13.3849 7.65615 12.656 6.92671C11.9266 6.19782 11.041 5.83337 9.99935 5.83337C8.95768 5.83337 8.07213 6.19782 7.34268 6.92671C6.61379 7.65615 6.24935 8.54171 6.24935 9.58337C6.24935 10.625 6.61379 11.5106 7.34268 12.24C8.07213 12.9689 8.95768 13.3334 9.99935 13.3334ZM9.99935 11.8334C9.37435 11.8334 8.84324 11.6145 8.40602 11.1767C7.96824 10.7395 7.74935 10.2084 7.74935 9.58337C7.74935 8.95837 7.96824 8.42698 8.40602 7.98921C8.84324 7.55198 9.37435 7.33337 9.99935 7.33337C10.6243 7.33337 11.1557 7.55198 11.5935 7.98921C12.0307 8.42698 12.2493 8.95837 12.2493 9.58337C12.2493 10.2084 12.0307 10.7395 11.5935 11.1767C11.1557 11.6145 10.6243 11.8334 9.99935 11.8334ZM9.99935 15.8334C8.06879 15.8334 6.3049 15.3231 4.70768 14.3025C3.11046 13.2814 1.90213 11.9028 1.08268 10.1667C1.04102 10.0973 1.01324 10.0103 0.999349 9.90587C0.98546 9.80199 0.978516 9.69448 0.978516 9.58337C0.978516 9.47226 0.98546 9.36449 0.999349 9.26004C1.01324 9.15615 1.04102 9.06949 1.08268 9.00004C1.90213 7.26393 3.11046 5.8856 4.70768 4.86504C6.3049 3.84393 8.06879 3.33337 9.99935 3.33337C11.9299 3.33337 13.6938 3.84393 15.291 4.86504C16.8882 5.8856 18.0966 7.26393 18.916 9.00004C18.9577 9.06949 18.9855 9.15615 18.9993 9.26004C19.0132 9.36449 19.0202 9.47226 19.0202 9.58337C19.0202 9.69448 19.0132 9.80199 18.9993 9.90587C18.9855 10.0103 18.9577 10.0973 18.916 10.1667C18.0966 11.9028 16.8882 13.2814 15.291 14.3025C13.6938 15.3231 11.9299 15.8334 9.99935 15.8334ZM9.99935 14.1667C11.5688 14.1667 13.0099 13.7534 14.3227 12.9267C15.6349 12.1006 16.6382 10.9862 17.3327 9.58337C16.6382 8.1806 15.6349 7.06587 14.3227 6.23921C13.0099 5.4131 11.5688 5.00004 9.99935 5.00004C8.4299 5.00004 6.98879 5.4131 5.67602 6.23921C4.36379 7.06587 3.36046 8.1806 2.66602 9.58337C3.36046 10.9862 4.36379 12.1006 5.67602 12.9267C6.98879 13.7534 8.4299 14.1667 9.99935 14.1667Z" fill="#293748"/>
                  </g>
                </svg>
              </button>
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
    </aside>
    {previewDemo && (
      <PreviewModal url={previewDemo.url} title={previewDemo.title} onClose={() => setPreviewDemo(null)} />
    )}
    </>
  )
}
