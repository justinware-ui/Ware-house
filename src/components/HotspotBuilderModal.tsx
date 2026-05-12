'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft } from 'lucide-react'
import { demos as rawDemos } from '../data/demos'
import thumbTableHero from '../assets/thumb-table-hero.svg'
import thumbContent from '../assets/thumb-content.svg'

function HotspotIcon({ size = 20, color = '#FF9356' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="4" fill={color}/>
      <path fillRule="evenodd" clipRule="evenodd" d="M10.5646 1.09292C11.0348 1.03158 11.514 1 12 1C12.486 1 12.9652 1.03158 13.4354 1.09292C13.9831 1.16436 14.3691 1.66622 14.2977 2.21387C14.2263 2.76151 13.7244 3.14756 13.1767 3.07612C12.7921 3.02594 12.3993 3 12 3C11.6007 3 11.2079 3.02594 10.8233 3.07612C10.2756 3.14756 9.77374 2.76151 9.70231 2.21387C9.63087 1.66622 10.0169 1.16436 10.5646 1.09292ZM17.2949 3.45668C17.6314 3.01876 18.2593 2.93656 18.6972 3.27309C19.4588 3.8584 20.1416 4.54116 20.7269 5.30283C21.0634 5.74075 20.9812 6.36856 20.5433 6.70508C20.1054 7.0416 19.4776 6.9594 19.1411 6.52148C18.6617 5.89765 18.1024 5.33832 17.4785 4.85892C17.0406 4.5224 16.9584 3.8946 17.2949 3.45668ZM6.70508 3.45668C7.0416 3.8946 6.9594 4.5224 6.52148 4.85893C5.89765 5.33832 5.33832 5.89765 4.85892 6.52149C4.5224 6.9594 3.8946 7.0416 3.45668 6.70508C3.01876 6.36856 2.93656 5.74075 3.27309 5.30283C3.8584 4.54116 4.54116 3.8584 5.30283 3.27309C5.74075 2.93657 6.36856 3.01876 6.70508 3.45668ZM21.7861 9.70231C22.3338 9.63087 22.8356 10.0169 22.9071 10.5646C22.9684 11.0348 23 11.514 23 12C23 12.486 22.9684 12.9652 22.9071 13.4354C22.8356 13.9831 22.3338 14.3691 21.7861 14.2977C21.2385 14.2263 20.8524 13.7244 20.9239 13.1767C20.9741 12.7921 21 12.3993 21 12C21 11.6007 20.9741 11.2079 20.9239 10.8233C20.8524 10.2756 21.2385 9.77374 21.7861 9.70231ZM2.21387 9.70231C2.76151 9.77374 3.14756 10.2756 3.07612 10.8233C3.02594 11.2079 3 11.6007 3 12C3 12.3993 3.02594 12.7921 3.07612 13.1767C3.14756 13.7244 2.76151 14.2263 2.21387 14.2977C1.66622 14.3691 1.16436 13.9831 1.09292 13.4354C1.03158 12.9652 1 12.486 1 12C1 11.514 1.03158 11.0348 1.09292 10.5646C1.16436 10.0169 1.66622 9.63087 2.21387 9.70231ZM20.5433 17.2949C20.9812 17.6314 21.0634 18.2593 20.7269 18.6972C20.1416 19.4588 19.4588 20.1416 18.6972 20.7269C18.2593 21.0634 17.6314 20.9812 17.2949 20.5433C16.9584 20.1054 17.0406 19.4776 17.4785 19.1411C18.1024 18.6617 18.6617 18.1024 19.1411 17.4785C19.4776 17.0406 20.1054 16.9584 20.5433 17.2949ZM3.45668 17.2949C3.8946 16.9584 4.5224 17.0406 4.85893 17.4785C5.33832 18.1024 5.89765 18.6617 6.52149 19.1411C6.9594 19.4776 7.0416 20.1054 6.70508 20.5433C6.36856 20.9812 5.74075 21.0634 5.30283 20.7269C4.54116 20.1416 3.8584 19.4588 3.27309 18.6972C2.93657 18.2593 3.01876 17.6314 3.45668 17.2949ZM9.70231 21.7861C9.77374 21.2385 10.2756 20.8524 10.8233 20.9239C11.2079 20.9741 11.6007 21 12 21C12.3993 21 12.7921 20.9741 13.1767 20.9239C13.7244 20.8524 14.2263 21.2385 14.2977 21.7861C14.3691 22.3338 13.9831 22.8356 13.4354 22.9071C12.9652 22.9684 12.486 23 12 23C11.514 23 11.0348 22.9684 10.5646 22.9071C10.0169 22.8356 9.63087 22.3338 9.70231 21.7861Z" fill={color}/>
    </svg>
  )
}

export interface HotspotMarker {
  id: string
  x: number
  y: number
  title: string
  description: string
  video?: string
  position: 'Top' | 'Bottom' | 'Left' | 'Right'
  width: 'Small(default)' | 'Medium' | 'Large'
  linkedDemoId?: string
}

export interface HotspotPage {
  id: string
  name: string
  imageSrc: string | null
  hotspots: HotspotMarker[]
}

interface Props {
  initialName?: string
  initialPages?: HotspotPage[]
  onSave: (name: string, pages: HotspotPage[]) => void
  onClose: () => void
}

function UploadPrompt({ onUpload }: { onUpload: (src: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onUpload(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) loadFile(f) }}
    >
      <div
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors cursor-pointer"
        style={{
          width: 360,
          height: 240,
          borderColor: isDragOver ? '#FF9356' : '#5A5A5A',
          backgroundColor: isDragOver ? 'rgba(255,147,86,0.08)' : 'rgba(255,255,255,0.04)',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <svg width="48" height="48" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4 opacity-50">
          <path d="M15.167 46.667C11.628 46.667 8.605 45.442 6.098 42.992C3.589 40.542 2.334 37.548 2.334 34.009C2.334 30.976 3.248 28.273 5.076 25.901C6.903 23.528 9.295 22.012 12.251 21.351C13.223 17.773 15.167 14.876 18.084 12.659C21.001 10.442 24.306 9.334 28.001 9.334C32.551 9.334 36.41 10.918 39.579 14.087C42.749 17.257 44.334 21.117 44.334 25.667C47.017 25.978 49.244 27.135 51.014 29.137C52.783 31.141 53.667 33.484 53.667 36.167C53.667 39.084 52.647 41.564 50.606 43.606C48.564 45.647 46.084 46.667 43.167 46.667H30.334C29.051 46.667 27.952 46.211 27.039 45.298C26.125 44.383 25.667 43.284 25.667 42.001V29.867L23.567 31.967C23.14 32.395 22.595 32.609 21.934 32.609C21.273 32.609 20.728 32.395 20.301 31.967C19.873 31.54 19.659 30.995 19.659 30.334C19.659 29.673 19.873 29.128 20.301 28.701L26.367 22.634C26.601 22.401 26.853 22.235 27.126 22.137C27.398 22.041 27.69 21.992 28.001 21.992C28.312 21.992 28.603 22.041 28.876 22.137C29.148 22.235 29.401 22.401 29.634 22.634L35.701 28.701C36.128 29.128 36.342 29.673 36.342 30.334C36.342 30.995 36.128 31.54 35.701 31.967C35.273 32.395 34.728 32.609 34.067 32.609C33.406 32.609 32.862 32.395 32.434 31.967L30.334 29.867V42.001H43.167C44.801 42.001 46.181 41.437 47.309 40.309C48.437 39.181 49.001 37.801 49.001 36.167C49.001 34.534 48.437 33.153 47.309 32.026C46.181 30.898 44.801 30.334 43.167 30.334H39.667V25.667C39.667 22.44 38.53 19.688 36.256 17.412C33.98 15.138 31.228 14.001 28.001 14.001C24.773 14.001 22.022 15.138 19.748 17.412C17.472 19.688 16.334 22.44 16.334 25.667H15.167C12.912 25.667 10.987 26.465 9.392 28.059C7.798 29.653 7.001 31.578 7.001 33.834C7.001 36.09 7.798 38.015 9.392 39.609C10.987 41.203 12.912 42.001 15.167 42.001H18.667C19.328 42.001 19.883 42.225 20.331 42.673C20.777 43.119 21.001 43.673 21.001 44.334C21.001 44.995 20.777 45.549 20.331 45.995C19.883 46.443 19.328 46.667 18.667 46.667H15.167Z" fill="#A0A0A0"/>
        </svg>
        <p className="text-sm text-[#A0A0A0] mb-2">Drop your screenshot here</p>
        <button className="text-sm font-semibold text-[#FF9356] hover:text-[#ffb07c] transition-colors">
          Upload Screenshot
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = '' }} />
    </div>
  )
}

export default function HotspotBuilderModal({ initialName = '', initialPages, onSave, onClose }: Props) {
  const defaultPage: HotspotPage = { id: 'page-1', name: 'Page 1', imageSrc: null, hotspots: [] }

  const [name, setName] = useState(initialName || '')
  const [editingName, setEditingName] = useState(false)
  const [editNameHover, setEditNameHover] = useState(false)
  const [pages, setPages] = useState<HotspotPage[]>(initialPages && initialPages.length > 0 ? initialPages : [defaultPage])
  const [activePageId, setActivePageId] = useState<string>(initialPages?.[0]?.id ?? 'page-1')
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null)
  const [prevSelectedHotspotId, setPrevSelectedHotspotId] = useState<string | null>(null)
  const [demoSearch, setDemoSearch] = useState('')
  const [demoTab, setDemoTab] = useState<'All' | 'Favorites' | 'Dynamic Tours' | 'Recommended'>('All')
  const [demoFavorites, setDemoFavorites] = useState<Set<string>>(new Set())
  const [rightPanelWidth, setRightPanelWidth] = useState(340)
  const resizingPanel = useRef<{ startX: number; startW: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLDivElement>(null)
  const pageFileInputRef = useRef<HTMLInputElement>(null)
  const [replacingPageId, setReplacingPageId] = useState<string | null>(null)

  const activePage = pages.find(p => p.id === activePageId) ?? pages[0]

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus()
  }, [editingName])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingPanel.current) return
      const delta = resizingPanel.current.startX - e.clientX
      const newW = Math.max(280, Math.min(600, resizingPanel.current.startW + delta))
      setRightPanelWidth(newW)
    }
    const onUp = () => { resizingPanel.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const updatePage = useCallback((id: string, updater: (p: HotspotPage) => HotspotPage) => {
    setPages(prev => prev.map(p => p.id === id ? updater(p) : p))
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!activePage.imageSrc) return
    const target = e.currentTarget
    const rect = target.getBoundingClientRect()
    // Only place if clicking canvas bg, not an existing hotspot
    if ((e.target as HTMLElement).dataset.hotspot) return
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const newHotspot: HotspotMarker = { id: `hs-${Date.now()}`, x, y, title: '', description: '', position: 'Top', width: 'Small(default)' }
    updatePage(activePage.id, p => ({ ...p, hotspots: [...p.hotspots, newHotspot] }))
    setSelectedHotspotId(newHotspot.id)
  }, [activePage, updatePage])

  const updateHotspot = useCallback((hsId: string, field: keyof HotspotMarker, value: string) => {
    updatePage(activePage.id, p => ({
      ...p,
      hotspots: p.hotspots.map(h => h.id === hsId ? { ...h, [field]: value } : h),
    }))
  }, [activePage.id, updatePage])

  const deleteHotspot = useCallback((hsId: string) => {
    updatePage(activePage.id, p => ({ ...p, hotspots: p.hotspots.filter(h => h.id !== hsId) }))
    if (selectedHotspotId === hsId) setSelectedHotspotId(null)
  }, [activePage.id, updatePage, selectedHotspotId])

  const deletePage = useCallback((pageId: string) => {
    setPages(prev => {
      const next = prev.filter(p => p.id !== pageId)
      if (activePageId === pageId) {
        setActivePageId(next[0]?.id ?? '')
        setSelectedHotspotId(null)
      }
      return next
    })
  }, [activePageId])

  const selectedHotspot = activePage.hotspots.find(h => h.id === selectedHotspotId) ?? null

  // Demo list helpers
  const allDemos = rawDemos.map((d, i) => ({ ...d, thumb: i % 2 === 0 ? thumbTableHero : thumbContent }))
  const toggleDemoFavorite = (demoId: string) => setDemoFavorites(prev => {
    const next = new Set(prev)
    if (next.has(demoId)) next.delete(demoId)
    else next.add(demoId)
    return next
  })
  const filteredDemos = allDemos.filter(d => {
    const q = demoSearch.toLowerCase()
    const matchesSearch = !q || d.title.toLowerCase().includes(q) || d.creator.toLowerCase().includes(q)
    const matchesTab =
      demoTab === 'All' ? true :
      demoTab === 'Favorites' ? demoFavorites.has(d.id) :
      demoTab === 'Dynamic Tours' ? d.type === 'standard' :
      demoTab === 'Recommended' ? d.visibleInLibrary : true
    return matchesSearch && matchesTab
  })

  const content = (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: '#141414' }}>
      <style>{`
        @keyframes hotspot-pulse {
          0%   { transform: scale(1);    opacity: 0.35; }
          70%  { transform: scale(2.47); opacity: 0; }
          100% { transform: scale(2.47); opacity: 0; }
        }
        .hs-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: hotspot-pulse 2s ease-out infinite;
        }
        .hs-pulse-delay {
          transform-box: fill-box;
          transform-origin: center;
          animation: hotspot-pulse 2s ease-out infinite 0.6s;
        }
      `}</style>

      {/* Header */}
      <div className="shrink-0 flex items-center h-16 px-4 border-b" style={{ background: '#363636', borderColor: '#5A5A5A' }}>
        {/* Back */}
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors mr-2"
        >
          <ChevronLeft size={20} className="text-[#F2F2F2]" />
        </button>

        {/* Name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {editingName ? (
            <input
              ref={nameInputRef}
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => { if (e.key === 'Enter') setEditingName(false) }}
              className="text-base font-semibold text-[#F2F2F2] rounded px-2 py-1 outline-none"
              style={{
                fontFamily: 'Poppins, sans-serif',
                background: 'transparent',
                border: '2px solid #F44C10',
                boxShadow: '0 0 0 5px rgba(255, 147, 86, 0.4)',
                minWidth: 160,
              }}
            />
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-base font-semibold whitespace-nowrap" style={{ fontFamily: 'Poppins, sans-serif', color: name ? '#F2F2F2' : 'rgba(242,242,242,0.4)', fontStyle: name ? 'normal' : 'italic' }}>
                {name || 'Screenshot name…'}
              </span>
              <button
                onClick={() => setEditingName(true)}
                onMouseEnter={() => setEditNameHover(true)}
                onMouseLeave={() => setEditNameHover(false)}
                className="flex items-center justify-center shrink-0"
                style={{ width: 24, height: 24 }}
              >
                {editNameHover ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="12" fill="white" fillOpacity="0.12"/>
                    <mask id="mask_edit_hsb_hov" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="4" y="4" width="16" height="16"><rect x="4" y="4" width="16" height="16" fill="#D9D9D9"/></mask>
                    <g mask="url(#mask_edit_hsb_hov)">
                      <path d="M7.33333 16.6668H8.26667L14.0167 10.9168L13.0833 9.9835L7.33333 15.7335V16.6668ZM16.8667 9.95016L14.0333 7.15016L14.9667 6.21683C15.2222 5.96127 15.5362 5.8335 15.9087 5.8335C16.2807 5.8335 16.5944 5.96127 16.85 6.21683L17.7833 7.15016C18.0389 7.40572 18.1722 7.71416 18.1833 8.0755C18.1944 8.43638 18.0722 8.74461 17.8167 9.00016L16.8667 9.95016ZM6.66667 18.0002C6.47778 18.0002 6.31956 17.9362 6.192 17.8082C6.064 17.6806 6 17.5224 6 17.3335V15.4502C6 15.3613 6.01667 15.2753 6.05 15.1922C6.08333 15.1086 6.13333 15.0335 6.2 14.9668L13.0667 8.10016L15.9 10.9335L9.03333 17.8002C8.96667 17.8668 8.89178 17.9168 8.80867 17.9502C8.72511 17.9835 8.63889 18.0002 8.55 18.0002H6.66667Z" fill="#F2F2F2"/>
                    </g>
                    <line x1="7.6875" y1="17.375" x2="17.8125" y2="17.375" stroke="#F2F2F2" strokeWidth="1.25"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <mask id="mask_edit_hsb_def" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="4" y="4" width="16" height="16"><rect x="4" y="4" width="16" height="16" fill="#D9D9D9"/></mask>
                    <g mask="url(#mask_edit_hsb_def)">
                      <path d="M7.33333 16.6668H8.26667L14.0167 10.9168L13.0833 9.9835L7.33333 15.7335V16.6668ZM16.8667 9.95016L14.0333 7.15016L14.9667 6.21683C15.2222 5.96127 15.5362 5.8335 15.9087 5.8335C16.2807 5.8335 16.5944 5.96127 16.85 6.21683L17.7833 7.15016C18.0389 7.40572 18.1722 7.71416 18.1833 8.0755C18.1944 8.43638 18.0722 8.74461 17.8167 9.00016L16.8667 9.95016ZM6.66667 18.0002C6.47778 18.0002 6.31956 17.9362 6.192 17.8082C6.064 17.6806 6 17.5224 6 17.3335V15.4502C6 15.3613 6.01667 15.2753 6.05 15.1922C6.08333 15.1086 6.13333 15.0335 6.2 14.9668L13.0667 8.10016L15.9 10.9335L9.03333 17.8002C8.96667 17.8668 8.89178 17.9168 8.80867 17.9502C8.72511 17.9835 8.63889 18.0002 8.55 18.0002H6.66667Z" fill="#A0A0A0"/>
                    </g>
                    <line x1="7.6875" y1="17.375" x2="17.8125" y2="17.375" stroke="#A0A0A0" strokeWidth="1.25"/>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white hover:bg-white/10 transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Preview
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <mask id="mask_eye_hsb" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="18" height="18"><rect width="18" height="18" fill="#D9D9D9"/></mask>
              <g mask="url(#mask_eye_hsb)"><path d="M9 12C9.9375 12 10.7344 11.672 11.3906 11.016C12.0469 10.3594 12.375 9.5625 12.375 8.625C12.375 7.6875 12.0469 6.8906 11.3906 6.234C10.7344 5.578 9.9375 5.25 9 5.25C8.0625 5.25 7.2656 5.578 6.609 6.234C5.953 6.8906 5.625 7.6875 5.625 8.625C5.625 9.5625 5.953 10.3594 6.609 11.016C7.2656 11.672 8.0625 12 9 12ZM9 10.65C8.4375 10.65 7.9594 10.453 7.5656 10.059C7.1719 9.6656 6.975 9.1875 6.975 8.625C6.975 8.0625 7.1719 7.5844 7.5656 7.1906C7.9594 6.797 8.4375 6.6 9 6.6C9.5625 6.6 10.0406 6.797 10.4344 7.1906C10.8281 7.5844 11.025 8.0625 11.025 8.625C11.025 9.1875 10.8281 9.6656 10.4344 10.059C10.0406 10.453 9.5625 10.65 9 10.65ZM9 14.25C7.2625 14.25 5.675 13.7906 4.2375 12.8719C2.8 11.9531 1.7125 10.7125 0.975 9.15C0.9375 9.0875 0.9125 9.0094 0.9 8.9156C0.8875 8.8219 0.88125 8.725 0.88125 8.625C0.88125 8.525 0.8875 8.4281 0.9 8.3344C0.9125 8.2406 0.9375 8.1625 0.975 8.1C1.7125 6.5375 2.8 5.2969 4.2375 4.3781C5.675 3.4594 7.2625 3 9 3C10.7375 3 12.325 3.4594 13.7625 4.3781C15.2 5.2969 16.2875 6.5375 17.025 8.1C17.0625 8.1625 17.0875 8.2406 17.1 8.3344C17.1125 8.4281 17.11875 8.525 17.11875 8.625C17.11875 8.725 17.1125 8.8219 17.1 8.9156C17.0875 9.0094 17.0625 9.0875 17.025 9.15C16.2875 10.7125 15.2 11.9531 13.7625 12.8719C12.325 13.7906 10.7375 14.25 9 14.25Z" fill="white"/></g>
            </svg>
          </button>
          <button
            className="px-6 py-2 rounded-full text-sm font-semibold transition-colors"
            style={{ background: '#FF9356', color: '#0E0E0E', fontFamily: 'Poppins, sans-serif' }}
            onClick={() => onSave(name, pages)}
          >
            Save
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            onClick={onClose}
          >
            <X size={20} className="text-[#F2F2F2]" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">

        {/* Left panel — Pages */}
        <div className="shrink-0 flex flex-col border-r overflow-hidden" style={{ width: 240, background: '#363636', borderColor: '#5A5A5A' }}>
          {/* Panel header */}
          <div className="flex items-center h-[68px] px-5 border-b shrink-0" style={{ borderColor: '#5A5A5A' }}>
            <span className="text-lg font-semibold text-[#F2F2F2]" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Pages
            </span>
          </div>

          {/* Pages list */}
          <div className="flex-1 overflow-y-auto py-4 px-4 flex flex-col gap-3">
            {pages.map((page, idx) => (
              <div
                key={page.id}
                className="relative cursor-pointer rounded-lg overflow-hidden shrink-0 group/page"
                style={{
                  border: page.id === activePageId ? '2px solid #FF9356' : '2px solid #535353',
                  height: 100,
                }}
                onClick={() => { setActivePageId(page.id); setSelectedHotspotId(null) }}
              >
                {page.imageSrc ? (
                  <img src={page.imageSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: '#2E2E2E' }}>
                    <span className="text-[10px] text-[#A0A0A0]" style={{ fontFamily: 'Poppins, sans-serif' }}>No image</span>
                  </div>
                )}

                {/* Hotspot count badge */}
                {page.hotspots.length > 0 && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#FF9356' }}>
                    {page.hotspots.length}
                  </div>
                )}

                {/* Hover toolbar */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/page:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black/40 absolute inset-0 rounded-lg pointer-events-none" />
                  <div className="relative z-10 flex items-center bg-white rounded-full border border-[#D6D1CB] px-2 py-2 gap-1 shadow-lg pointer-events-auto">
                    {/* Replace image */}
                    <div className="relative group/replace">
                      <button
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#73716F26] transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setReplacingPageId(page.id)
                          setTimeout(() => pageFileInputRef.current?.click(), 50)
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                          <path d="M10.0417 16.6667C8.18056 16.6667 6.59722 16.0209 5.29167 14.7292C3.98611 13.4375 3.33333 11.8612 3.33333 10V9.85421L2.58333 10.6042C2.43056 10.757 2.23611 10.8334 2 10.8334C1.76389 10.8334 1.56944 10.757 1.41667 10.6042C1.26389 10.4514 1.1875 10.257 1.1875 10.0209C1.1875 9.78476 1.26389 9.59032 1.41667 9.43754L3.58333 7.27087C3.66667 7.18754 3.75694 7.12837 3.85417 7.09337C3.95139 7.05893 4.05556 7.04171 4.16667 7.04171C4.27778 7.04171 4.38194 7.05893 4.47917 7.09337C4.57639 7.12837 4.66667 7.18754 4.75 7.27087L6.91667 9.43754C7.06944 9.59032 7.14583 9.78476 7.14583 10.0209C7.14583 10.257 7.06944 10.4514 6.91667 10.6042C6.76389 10.757 6.56944 10.8334 6.33333 10.8334C6.09722 10.8334 5.90278 10.757 5.75 10.6042L5 9.85421V10C5 11.3889 5.48972 12.5695 6.46917 13.5417C7.44806 14.5139 8.63889 15 10.0417 15C10.3194 15 10.5903 14.9759 10.8542 14.9275C11.1181 14.8787 11.3819 14.8056 11.6458 14.7084C11.7847 14.6528 11.9342 14.6389 12.0942 14.6667C12.2536 14.6945 12.3889 14.7639 12.5 14.875C12.75 15.125 12.8508 15.3923 12.8025 15.6767C12.7536 15.9617 12.5694 16.1598 12.25 16.2709C11.8889 16.3959 11.5244 16.4931 11.1567 16.5625C10.7883 16.632 10.4167 16.6667 10.0417 16.6667ZM15.8333 12.9584C15.7222 12.9584 15.6181 12.9409 15.5208 12.9059C15.4236 12.8714 15.3333 12.8125 15.25 12.7292L13.0833 10.5625C12.9306 10.4098 12.8542 10.2153 12.8542 9.97921C12.8542 9.7431 12.9306 9.54865 13.0833 9.39587C13.2361 9.2431 13.4306 9.16671 13.6667 9.16671C13.9028 9.16671 14.0972 9.2431 14.25 9.39587L15 10.1459V10C15 8.61115 14.5106 7.4306 13.5317 6.45837C12.5522 5.48615 11.3611 5.00004 9.95833 5.00004C9.68056 5.00004 9.40972 5.02448 9.14583 5.07337C8.88194 5.12171 8.61806 5.19449 8.35417 5.29171C8.21528 5.34726 8.06611 5.36115 7.90667 5.33337C7.74667 5.3056 7.61111 5.23615 7.5 5.12504C7.25 4.87504 7.14917 4.60754 7.1975 4.32254C7.24639 4.0381 7.43056 3.84032 7.75 3.72921C8.11111 3.60421 8.47583 3.50699 8.84417 3.43754C9.21194 3.3681 9.58333 3.33337 9.95833 3.33337C11.8194 3.33337 13.4028 3.97921 14.7083 5.27087C16.0139 6.56254 16.6667 8.13893 16.6667 10V10.1459L17.4167 9.39587C17.5694 9.2431 17.7639 9.16671 18 9.16671C18.2361 9.16671 18.4306 9.2431 18.5833 9.39587C18.7361 9.54865 18.8125 9.7431 18.8125 9.97921C18.8125 10.2153 18.7361 10.4098 18.5833 10.5625L16.4167 12.7292C16.3333 12.8125 16.2431 12.8714 16.1458 12.9059C16.0486 12.9409 15.9444 12.9584 15.8333 12.9584Z" fill="#172537"/>
                        </svg>
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-gray-800 text-white text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover/replace:opacity-100 transition-opacity z-20">
                        Replace
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                      </div>
                    </div>

                    {/* Delete page — disabled when only 1 page */}
                    {pages.length > 1 && (
                      <div className="relative group/remove">
                        <button
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#73716F26] transition-colors cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); deletePage(page.id) }}
                        >
                          <X size={16} className="text-[#293748]" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-gray-800 text-white text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover/remove:opacity-100 transition-opacity z-20">
                          Delete
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="absolute bottom-0 inset-x-0 px-2 py-1" style={{ background: 'rgba(0,0,0,0.55)' }}>
                  <span className="text-[10px] text-[#F2F2F2] truncate block" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {page.name || `Page ${idx + 1}`}
                  </span>
                </div>
              </div>
            ))}

            {/* Hidden file input for replacing a page image */}
            <input
              ref={pageFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file && replacingPageId) {
                  const reader = new FileReader()
                  reader.onload = () => {
                    updatePage(replacingPageId, p => ({ ...p, imageSrc: reader.result as string }))
                    setReplacingPageId(null)
                  }
                  reader.readAsDataURL(file)
                }
                e.target.value = ''
              }}
            />
          </div>
        </div>

        {/* Main canvas */}
        <div className="flex-1 min-w-0 relative flex items-center justify-center overflow-hidden" style={{ background: '#141414' }}>
          {activePage.imageSrc ? (
            <div
              ref={canvasRef}
              className="relative select-none"
              style={{ maxWidth: '100%', maxHeight: '100%', cursor: 'crosshair' }}
              onClick={handleCanvasClick}
            >
              <img
                src={activePage.imageSrc}
                alt="Screenshot"
                className="block max-w-full max-h-full"
                style={{ maxHeight: 'calc(100vh - 64px - 80px)', objectFit: 'contain', userSelect: 'none', pointerEvents: 'none' }}
                draggable={false}
              />

              {/* Hotspot markers */}
              {activePage.hotspots.map((hs, idx) => {
                const isSelected = selectedHotspotId === hs.id
                const filterId = `hs-shadow-${hs.id}`
                return (
                  <div
                    key={hs.id}
                    data-hotspot="true"
                    className="absolute cursor-pointer"
                    style={{
                      left: `${hs.x}%`,
                      top: `${hs.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: 48,
                      height: 48,
                      zIndex: 10,
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelectedHotspotId(hs.id === selectedHotspotId ? null : hs.id) }}
                  >
                    <svg
                      width="48" height="48" viewBox="0 0 48 48" fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ pointerEvents: 'none', overflow: 'visible' }}
                    >
                      <defs>
                        <filter id={filterId} x="9" y="15" width="30" height="30" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                          <feOffset dy="6"/>
                          <feGaussianBlur stdDeviation="4"/>
                          <feComposite in2="hardAlpha" operator="out"/>
                          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1"/>
                          <feBlend mode="normal" in="SourceGraphic" in2="effect1" result="shape"/>
                        </filter>
                      </defs>

                      {/* Pulsing outer rings — staggered for continuous ripple */}
                      <circle cx="24" cy="24" r="9.5" fill="#B84000" fillOpacity="0.55" stroke="none" className="hs-pulse" />
                      <circle cx="24" cy="24" r="9.5" fill="#B84000" fillOpacity="0.55" stroke="none" className="hs-pulse-delay" />

                      {/* Selected ring */}
                      {isSelected && (
                        <circle cx="24" cy="24" r="11" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
                      )}

                      {/* Inner filled dot with drop shadow */}
                      <g filter={`url(#${filterId})`}>
                        <circle cx="24" cy="24" r="7" fill="#EC682B" stroke="white" strokeWidth={isSelected ? 2 : 1} />
                      </g>
                    </svg>
                  </div>
                )
              })}
            </div>
          ) : (
            <UploadPrompt onUpload={(src) => updatePage(activePage.id, p => ({ ...p, imageSrc: src }))} />
          )}

        </div>

        {/* Right panel — Hotspot properties */}
        <div
          className="shrink-0 flex flex-col border-l overflow-hidden relative"
          style={{ width: rightPanelWidth, background: '#363636', borderColor: '#5A5A5A' }}
        >
          {/* Left-edge resize grabber */}
          <div
            className="absolute top-0 left-1 w-1 h-full z-10 cursor-ew-resize flex items-center justify-center group"
            style={{ background: 'transparent' }}
            onMouseDown={(e) => {
              e.preventDefault()
              resizingPanel.current = { startX: e.clientX, startW: rightPanelWidth }
            }}
          >
            <div className="w-[3px] h-8 rounded-full transition-opacity" style={{ background: '#888' }} />
          </div>
          {selectedHotspot ? (
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Panel header */}
              <div className="flex items-center h-[68px] px-5 border-b shrink-0" style={{ borderColor: '#5A5A5A' }}>
                <span className="text-lg font-semibold text-[#F2F2F2] flex-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Hotspots
                </span>
                {/* List — navigate to hotspot list */}
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                  onClick={() => { setPrevSelectedHotspotId(selectedHotspotId); setSelectedHotspotId(null) }}
                  title="All hotspots"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {/* Delete */}
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                  onClick={() => deleteHotspot(selectedHotspot.id)}
                  title="Delete hotspot"
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path d="M5.833 17.5c-.458 0-.85-.163-1.177-.49a1.607 1.607 0 0 1-.489-1.177V5H3.333V3.333h4.167V2.5h5v.833h4.167V5H15v10.833c0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489H5.833ZM13.333 5H6.667v10.833h6.666V5ZM8.333 14.167h1.667v-7.5H8.333v7.5Zm2.5 0H12.5v-7.5h-1.667v7.5Z" fill="#A0A0A0"/>
                  </svg>
                </button>
              </div>

              {/* Separator */}
              <div className="h-px shrink-0" style={{ background: '#5A5A5A' }} />

              {/* Fields */}
              <div className="flex flex-col gap-5 px-6 pt-6 pb-4">

                {/* POPUP label */}
                <p className="text-[11px] font-bold text-white uppercase tracking-[1.1px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Popup
                </p>

                {/* Title */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#A0A0A0]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Title <span className="font-bold">*</span>
                  </label>
                  <div className="rounded-[6px] border h-10 flex items-center px-4" style={{ background: '#262626', borderColor: '#444' }}>
                    <input
                      type="text"
                      value={selectedHotspot.title}
                      onChange={(e) => updateHotspot(selectedHotspot.id, 'title', e.target.value)}
                      placeholder="Title"
                      className="w-full bg-transparent text-sm text-[#F2F2F2] outline-none placeholder:text-[#5A5A5A]"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    />
                  </div>
                </div>

                {/* Description with formatting toolbar */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#A0A0A0]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Description
                  </label>
                  {/* Formatting toolbar */}
                  <div className="flex items-center gap-1 px-3 py-1.5 border-b" style={{ background: '#262626', borderColor: '#444', borderRadius: '6px 6px 0 0' }}>
                    {[
                      { title: 'Bold', cmd: 'bold', icon: <span className="font-bold text-sm">B</span> },
                      { title: 'Italic', cmd: 'italic', icon: <span className="italic text-sm">I</span> },
                      { title: 'Underline', cmd: 'underline', icon: <span className="underline text-sm">U</span> },
                      { title: 'Numbered list', cmd: 'insertOrderedList', icon: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )},
                      { title: 'Bulleted list', cmd: 'insertUnorderedList', icon: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )},
                    ].map(({ title, cmd, icon }) => (
                      <button
                        key={cmd}
                        title={title}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          if (descRef.current) {
                            descRef.current.focus()
                            document.execCommand(cmd)
                          }
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded text-[#A0A0A0] hover:text-[#F2F2F2] hover:bg-white/10 transition-colors"
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  {/* Content editable area */}
                  <div
                    ref={descRef}
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder="Description…"
                    onInput={(e) => updateHotspot(selectedHotspot.id, 'description', (e.target as HTMLDivElement).innerHTML)}
                    className="min-h-[100px] px-3 py-2 text-sm text-white outline-none rounded-[0_0_6px_6px] [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[#5A5A5A]"
                    style={{ background: '#262626', border: '1px solid #444', borderTop: 'none', fontFamily: 'Poppins, sans-serif', lineHeight: 1.6, wordBreak: 'break-word', color: '#ffffff' }}
                    dangerouslySetInnerHTML={{ __html: selectedHotspot.description }}
                    key={selectedHotspot.id}
                  />
                </div>

                {/* Video (optional) */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#A0A0A0]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Video (optional)
                  </label>
                  <button
                    className="w-full h-10 rounded-full border-2 text-sm font-semibold transition-colors hover:bg-[#FF9356]/10"
                    style={{ borderColor: '#FF9356', color: '#FF9356', fontFamily: 'Poppins, sans-serif' }}
                    onClick={() => videoInputRef.current?.click()}
                  >
                    {selectedHotspot.video ? 'Change File' : 'Browse File'}
                  </button>
                  {selectedHotspot.video && (
                    <p className="text-[11px] text-[#A0A0A0] truncate mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {selectedHotspot.video}
                    </p>
                  )}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) updateHotspot(selectedHotspot.id, 'video', file.name)
                      e.target.value = ''
                    }}
                  />
                </div>

                {/* Position dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#A0A0A0]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Position
                  </label>
                  <div className="relative">
                    <select
                      value={selectedHotspot.position}
                      onChange={(e) => updateHotspot(selectedHotspot.id, 'position', e.target.value)}
                      className="w-full h-10 rounded-[6px] border px-4 pr-8 text-sm text-[#F2F2F2] appearance-none outline-none cursor-pointer"
                      style={{ background: '#262626', borderColor: '#444', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {['Top', 'Bottom', 'Left', 'Right'].map(opt => (
                        <option key={opt} value={opt} style={{ background: '#262626' }}>{opt}</option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Width dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#A0A0A0]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Width
                  </label>
                  <div className="relative">
                    <select
                      value={selectedHotspot.width}
                      onChange={(e) => updateHotspot(selectedHotspot.id, 'width', e.target.value)}
                      className="w-full h-10 rounded-[6px] border px-4 pr-8 text-sm text-[#F2F2F2] appearance-none outline-none cursor-pointer"
                      style={{ background: '#262626', borderColor: '#444', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {['Small(default)', 'Medium', 'Large'].map(opt => (
                        <option key={opt} value={opt} style={{ background: '#262626' }}>{opt}</option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <button
                    className="self-end text-xs mt-1 hover:opacity-70 transition-opacity"
                    style={{ color: '#FF9356', fontFamily: 'Poppins, sans-serif' }}
                    onClick={() => {
                      updatePage(activePage.id, p => ({
                        ...p,
                        hotspots: p.hotspots.map(h => ({ ...h, width: selectedHotspot.width })),
                      }))
                    }}
                  >
                    Apply to all popups
                  </button>
                </div>

                {/* LINK TO DEMO section */}
                <div className="h-px -mx-6" style={{ background: '#5A5A5A' }} />

                <p className="text-[11px] font-bold text-white uppercase tracking-[1.1px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Link to Demo
                </p>

                {/* Search + Filter */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input
                      type="text"
                      value={demoSearch}
                      onChange={e => setDemoSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full h-9 rounded-full pl-8 pr-3 text-sm text-[#F2F2F2] outline-none placeholder:text-[#5A5A5A]"
                      style={{ background: '#262626', border: '1px solid #444', fontFamily: 'Poppins, sans-serif' }}
                    />
                  </div>
                  <button
                    className="shrink-0 flex items-center justify-center rounded-full transition-colors"
                    style={{ width: 32, height: 32, background: '#9B50CA' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#7D2CAF')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#9B50CA')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <mask id="mask_filter_hs" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
                        <rect width="24" height="24" fill="#D9D9D9"/>
                      </mask>
                      <g mask="url(#mask_filter_hs)">
                        <path d="M14.0009 13V19C14.0009 19.2833 13.9052 19.5207 13.7139 19.712C13.5219 19.904 13.2842 20 13.0009 20H11.0009C10.7176 20 10.4802 19.904 10.2889 19.712C10.0969 19.5207 10.0009 19.2833 10.0009 19V13L4.20088 5.6C3.95088 5.26667 3.91355 4.91667 4.08888 4.55C4.26355 4.18333 4.56755 4 5.00088 4H19.0009C19.4342 4 19.7386 4.18333 19.9139 4.55C20.0886 4.91667 20.0509 5.26667 19.8009 5.6L14.0009 13ZM12.0009 12.3L16.9509 6H7.05088L12.0009 12.3Z" fill="white"/>
                      </g>
                    </svg>
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 border-b" style={{ borderColor: '#5A5A5A' }}>
                  {(['All', 'Favorites', 'Dynamic Tours', 'Recommended'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setDemoTab(tab)}
                      className="pb-2 text-xs font-semibold whitespace-nowrap transition-colors"
                      style={{
                        color: demoTab === tab ? '#F2F2F2' : '#A0A0A0',
                        borderBottom: demoTab === tab ? '2px solid #FF9356' : '2px solid transparent',
                        marginBottom: -1,
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Demo list */}
                <div className="flex flex-col rounded-[8px] overflow-hidden" style={{ border: '1px solid #3A3A3A' }}>
                  {filteredDemos.length === 0 ? (
                    <p className="text-xs text-[#A0A0A0] text-center py-6" style={{ fontFamily: 'Poppins, sans-serif' }}>No demos found</p>
                  ) : filteredDemos.slice(0, 10).map((demo, idx) => {
                    const isLinked = selectedHotspot.linkedDemoId === demo.id
                    const date = new Date(demo.created).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
                    return (
                      <div
                        key={demo.id}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                        style={{
                          background: isLinked ? 'rgba(255,147,86,0.12)' : idx % 2 === 0 ? '#2C2C2C' : '#262626',
                          borderTop: idx > 0 ? '1px solid #3A3A3A' : 'none',
                        }}
                        onClick={() => updateHotspot(selectedHotspot.id, 'linkedDemoId', isLinked ? '' : demo.id)}
                      >
                        {/* Thumbnail */}
                        <div className="shrink-0 rounded-[4px] overflow-hidden" style={{ width: 31, height: 31, background: '#3A3A3A' }}>
                          <img src={demo.thumb} alt="" className="w-full h-full object-cover" />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: isLinked ? '#FF9356' : '#F2F2F2', fontFamily: 'Poppins, sans-serif' }}>{demo.title}</p>
                          <p className="text-[10px] truncate" style={{ color: '#A0A0A0', fontFamily: 'Poppins, sans-serif' }}>{demo.creator}  {date}</p>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button className="hover:opacity-70 transition-opacity" onClick={e => e.stopPropagation()}>
                            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                              <ellipse cx="9" cy="9" rx="6.75" ry="3.75" stroke="#A0A0A0" strokeWidth="1.5"/>
                              <circle cx="9" cy="9" r="2.25" stroke="#A0A0A0" strokeWidth="1.5"/>
                            </svg>
                          </button>
                          <button className="transition-all hover:opacity-80 shrink-0" onClick={e => { e.stopPropagation(); updateHotspot(selectedHotspot.id, 'linkedDemoId', isLinked ? '' : demo.id) }}>
                            {isLinked ? (
                              <svg width="24" height="24" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="1" y="1" width="28" height="28" rx="14" fill="#61B08B" stroke="#61B08B" strokeWidth="2"/>
                                <path d="M13.0831 19.6459C12.9719 19.6459 12.8678 19.6284 12.7706 19.5934C12.6733 19.559 12.5831 19.5001 12.4998 19.4167L9.41642 16.3334C9.26364 16.1806 9.19031 15.9826 9.19697 15.7392C9.2042 15.4965 9.28419 15.2987 9.43697 15.1459C9.58975 14.9931 9.7842 14.9167 10.0203 14.9167C10.2564 14.9167 10.4509 14.9931 10.6037 15.1459L13.0831 17.6251L20.1453 10.5626C20.2981 10.4098 20.4962 10.3334 20.7395 10.3334C20.9823 10.3334 21.1801 10.4098 21.3328 10.5626C21.4856 10.7153 21.562 10.9131 21.562 11.1559C21.562 11.3993 21.4856 11.5973 21.3328 11.7501L13.6664 19.4167C13.5831 19.5001 13.4928 19.559 13.3956 19.5934C13.2984 19.6284 13.1942 19.6459 13.0831 19.6459Z" fill="white"/>
                              </svg>
                            ) : (
                              <svg width="24" height="24" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="1" y="1" width="28" height="28" rx="14" stroke="#FC6839" strokeWidth="2" fill="none"/>
                                <path d="M15 20.25C14.7875 20.25 14.6095 20.178 14.466 20.034C14.322 19.8905 14.25 19.7125 14.25 19.5V15.75H10.5C10.2875 15.75 10.1093 15.678 9.96525 15.534C9.82175 15.3905 9.75 15.2125 9.75 15C9.75 14.7875 9.82175 14.6093 9.96525 14.4653C10.1093 14.3218 10.2875 14.25 10.5 14.25H14.25V10.5C14.25 10.2875 14.322 10.1093 14.466 9.96525C14.6095 9.82175 14.7875 9.75 15 9.75C15.2125 9.75 15.3908 9.82175 15.5348 9.96525C15.6783 10.1093 15.75 10.2875 15.75 10.5V14.25H19.5C19.7125 14.25 19.8905 14.3218 20.034 14.4653C20.178 14.6093 20.25 14.7875 20.25 15C20.25 15.2125 20.178 15.3905 20.034 15.534C19.8905 15.678 19.7125 15.75 19.5 15.75H15.75V19.5C15.75 19.7125 15.6783 19.8905 15.5348 20.034C15.3908 20.178 15.2125 20.25 15 20.25Z" fill="#F44C10"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : activePage.hotspots.length > 0 ? (
            /* Hotspot list — click any to open its editor */
            <div className="flex flex-col h-full overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center h-[68px] px-5 border-b shrink-0" style={{ borderColor: '#5A5A5A' }}>
                <button
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors mr-1"
                  onClick={() => setSelectedHotspotId(prevSelectedHotspotId ?? activePage.hotspots[0]?.id ?? null)}
                >
                  <ChevronLeft size={18} className="text-[#A0A0A0]" />
                </button>
                <span className="text-lg font-semibold text-[#F2F2F2] flex-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  On This Page
                </span>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col">
                {activePage.hotspots.map((hs) => (
                  <div
                    key={hs.id}
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/5 group cursor-pointer border-b"
                    style={{ borderColor: '#3A3A3A' }}
                    onClick={() => setSelectedHotspotId(hs.id)}
                  >
                    {/* Hotspot icon */}
                    <div className="shrink-0 w-9 h-9 flex items-center justify-center">
                      <HotspotIcon size={22} color="#FF9356" />
                    </div>

                    {/* Title */}
                    <span className="flex-1 min-w-0 text-sm font-medium text-[#F2F2F2] truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {hs.title || <span className="text-[#5A5A5A] italic">Untitled hotspot</span>}
                    </span>

                    {/* Link icon (orange if linked, white if not) */}
                    <svg className="shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 17C5.61667 17 4.43767 16.5123 3.463 15.537C2.48767 14.5623 2 13.3833 2 12C2 10.6167 2.48767 9.43733 3.463 8.462C4.43767 7.48733 5.61667 7 7 7H10C10.2833 7 10.521 7.09567 10.713 7.287C10.9043 7.479 11 7.71667 11 8C11 8.28333 10.9043 8.52067 10.713 8.712C10.521 8.904 10.2833 9 10 9H7C6.16667 9 5.45833 9.29167 4.875 9.875C4.29167 10.4583 4 11.1667 4 12C4 12.8333 4.29167 13.5417 4.875 14.125C5.45833 14.7083 6.16667 15 7 15H10C10.2833 15 10.521 15.0957 10.713 15.287C10.9043 15.479 11 15.7167 11 16C11 16.2833 10.9043 16.5207 10.713 16.712C10.521 16.904 10.2833 17 10 17H7ZM9 13C8.71667 13 8.47933 12.904 8.288 12.712C8.096 12.5207 8 12.2833 8 12C8 11.7167 8.096 11.479 8.288 11.287C8.47933 11.0957 8.71667 11 9 11H15C15.2833 11 15.521 11.0957 15.713 11.287C15.9043 11.479 16 11.7167 16 12C16 12.2833 15.9043 12.5207 15.713 12.712C15.521 12.904 15.2833 13 15 13H9ZM14 17C13.7167 17 13.4793 16.904 13.288 16.712C13.096 16.5207 13 16.2833 13 16C13 15.7167 13.096 15.479 13.288 15.287C13.4793 15.0957 13.7167 15 14 15H17C17.8333 15 18.5417 14.7083 19.125 14.125C19.7083 13.5417 20 12.8333 20 12C20 11.1667 19.7083 10.4583 19.125 9.875C18.5417 9.29167 17.8333 9 17 9H14C13.7167 9 13.4793 8.904 13.288 8.712C13.096 8.52067 13 8.28333 13 8C13 7.71667 13.096 7.479 13.288 7.287C13.4793 7.09567 13.7167 7 14 7H17C18.3833 7 19.5627 7.48733 20.538 8.462C21.5127 9.43733 22 10.6167 22 12C22 13.3833 21.5127 14.5623 20.538 15.537C19.5627 16.5123 18.3833 17 17 17H14Z" fill={hs.linkedDemoId ? '#FF9356' : '#F2F2F2'}/>
                    </svg>

                    {/* Delete */}
                    <button
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                      onClick={e => { e.stopPropagation(); deleteHotspot(hs.id) }}
                      title="Delete hotspot"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="#A0A0A0" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,147,86,0.15)' }}>
                <HotspotIcon />
              </div>
              {!activePage.imageSrc ? (
                <>
                  <p className="text-sm font-semibold text-[#F2F2F2]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Get started
                  </p>
                  <div className="flex flex-col gap-2 text-left w-full">
                    {[
                      'Upload a screenshot in the main area',
                      'Click anywhere on the screenshot to place a hotspot',
                      'Fill in the title, description, and settings here',
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span
                          className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
                          style={{ background: 'rgba(255,147,86,0.4)', fontFamily: 'Poppins, sans-serif' }}
                        >
                          {i + 1}
                        </span>
                        <p className="text-xs text-[#A0A0A0]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#F2F2F2]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Place your first hotspot
                  </p>
                  <p className="text-xs text-[#5A5A5A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Click anywhere on the screenshot to add a numbered hotspot marker. Its settings will appear here.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
