'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Handle, Position, type NodeProps, useReactFlow, useUpdateNodeInternals } from '@xyflow/react'
import { X, Eye } from 'lucide-react'
import HotspotBuilderModal, { type HotspotPage } from '../HotspotBuilderModal'
import { demos as allDemosData } from '../../data/demos'

const HotspotSvgIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="mask0_hs_node_icon" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
      <rect width="16" height="16" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask0_hs_node_icon)">
      <circle cx="8.00016" cy="8.00004" r="2.66667" fill="currentColor"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M7.04288 0.728575C7.35637 0.687682 7.67581 0.666626 7.99984 0.666626C8.32386 0.666626 8.6433 0.687682 8.9568 0.728575C9.32189 0.776198 9.57926 1.11077 9.53163 1.47587C9.48401 1.84097 9.14943 2.09833 8.78433 2.05071C8.52787 2.01725 8.26604 1.99996 7.99984 1.99996C7.73363 1.99996 7.4718 2.01725 7.21534 2.05071C6.85024 2.09833 6.51567 1.84097 6.46804 1.47587C6.42042 1.11077 6.67778 0.776199 7.04288 0.728575ZM11.5298 2.30441C11.7541 2.01247 12.1727 1.95767 12.4646 2.18202C12.9724 2.57222 13.4276 3.0274 13.8178 3.53518C14.0421 3.82713 13.9873 4.24566 13.6954 4.47001C13.4034 4.69436 12.9849 4.63956 12.7606 4.34762C12.441 3.93172 12.0681 3.55884 11.6522 3.23924C11.3602 3.01489 11.3054 2.59636 11.5298 2.30441ZM4.46989 2.30441C4.69424 2.59636 4.63944 3.0149 4.34749 3.23924C3.9316 3.55884 3.55872 3.93172 3.23912 4.34762C3.01477 4.63956 2.59623 4.69436 2.30429 4.47001C2.01234 4.24566 1.95755 3.82713 2.18189 3.53518C2.5721 3.0274 3.02728 2.57223 3.53506 2.18202C3.827 1.95767 4.24554 2.01247 4.46989 2.30441ZM14.5239 6.46816C14.889 6.42054 15.2236 6.6779 15.2712 7.043C15.3121 7.3565 15.3332 7.67594 15.3332 7.99996C15.3332 8.32398 15.3121 8.64342 15.2712 8.95692C15.2236 9.32201 14.889 9.57938 14.5239 9.53175C14.1588 9.48413 13.9015 9.14955 13.9491 8.78446C13.9825 8.528 13.9998 8.26616 13.9998 7.99996C13.9998 7.73375 13.9825 7.47192 13.9491 7.21546C13.9015 6.85036 14.1588 6.51579 14.5239 6.46816ZM1.47575 6.46817C1.84085 6.51579 2.09821 6.85037 2.05059 7.21546C2.01713 7.47192 1.99984 7.73376 1.99984 7.99996C1.99984 8.26616 2.01713 8.528 2.05059 8.78446C2.09821 9.14955 1.84085 9.48413 1.47575 9.53175C1.11065 9.57938 0.776077 9.32202 0.728453 8.95692C0.68756 8.64342 0.666504 8.32398 0.666504 7.99996C0.666504 7.67594 0.68756 7.3565 0.728453 7.043C0.776076 6.6779 1.11065 6.42054 1.47575 6.46817ZM13.6954 11.5299C13.9873 11.7543 14.0421 12.1728 13.8178 12.4647C13.4276 12.9725 12.9724 13.4277 12.4646 13.8179C12.1727 14.0422 11.7541 13.9875 11.5298 13.6955C11.3054 13.4036 11.3602 12.985 11.6522 12.7607C12.0681 12.4411 12.441 12.0682 12.7606 11.6523C12.9849 11.3604 13.4034 11.3056 13.6954 11.5299ZM2.30429 11.5299C2.59624 11.3056 3.01477 11.3604 3.23912 11.6523C3.55872 12.0682 3.9316 12.4411 4.34749 12.7607C4.63944 12.985 4.69424 13.4036 4.46989 13.6955C4.24554 13.9875 3.827 14.0423 3.53506 13.8179C3.02728 13.4277 2.5721 12.9725 2.1819 12.4647C1.95755 12.1728 2.01235 11.7543 2.30429 11.5299ZM6.46804 14.524C6.51567 14.159 6.85024 13.9016 7.21534 13.9492C7.4718 13.9827 7.73363 14 7.99984 14C8.26604 14 8.52787 13.9827 8.78434 13.9492C9.14943 13.9016 9.48401 14.1589 9.53163 14.524C9.57926 14.8891 9.32189 15.2237 8.9568 15.2713C8.6433 15.3122 8.32386 15.3333 7.99984 15.3333C7.67581 15.3333 7.35638 15.3122 7.04288 15.2713C6.67778 15.2237 6.42042 14.8891 6.46804 14.524Z" fill="currentColor"/>
    </g>
  </svg>
)

const UploadCloudIcon = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="mask0_upload_hs" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="56" height="56">
      <rect width="56" height="56" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask0_upload_hs)">
      <path d="M15.1673 46.6673C11.6284 46.6673 8.60521 45.4423 6.09765 42.9923C3.58854 40.5423 2.33398 37.5479 2.33398 34.009C2.33398 30.9756 3.24787 28.2729 5.07565 25.9007C6.90343 23.5284 9.2951 22.0118 12.2507 21.3506C13.2229 17.7729 15.1673 14.8757 18.084 12.659C21.0007 10.4423 24.3062 9.33398 28.0007 9.33398C32.5507 9.33398 36.41 10.9183 39.5786 14.087C42.7489 17.2572 44.334 21.1173 44.334 25.6673C47.0173 25.9784 49.2441 27.135 51.0143 29.137C52.783 31.1405 53.6673 33.484 53.6673 36.1673C53.6673 39.084 52.6469 41.5635 50.606 43.606C48.5635 45.6469 46.084 46.6673 43.1673 46.6673H30.334C29.0507 46.6673 27.9524 46.2108 27.0393 45.2977C26.1247 44.383 25.6673 43.284 25.6673 42.0006V29.8673L23.5673 31.9673C23.1395 32.3951 22.5951 32.609 21.934 32.609C21.2729 32.609 20.7284 32.3951 20.3006 31.9673C19.8729 31.5395 19.659 30.9951 19.659 30.334C19.659 29.6729 19.8729 29.1284 20.3006 28.7007L26.3673 22.634C26.6007 22.4007 26.8534 22.235 27.1257 22.137C27.3979 22.0405 27.6895 21.9923 28.0007 21.9923C28.3118 21.9923 28.6034 22.0405 28.8757 22.137C29.1479 22.235 29.4006 22.4007 29.634 22.634L35.7007 28.7007C36.1284 29.1284 36.3423 29.6729 36.3423 30.334C36.3423 30.9951 36.1284 31.5395 35.7007 31.9673C35.2729 32.3951 34.7284 32.609 34.0673 32.609C33.4062 32.609 32.8618 32.3951 32.434 31.9673L30.334 29.8673V42.0006H43.1673C44.8006 42.0006 46.1812 41.4368 47.309 40.309C48.4368 39.1812 49.0006 37.8007 49.0006 36.1673C49.0006 34.534 48.4368 33.1534 47.309 32.0257C46.1812 30.8979 44.8006 30.334 43.1673 30.334H39.6673V25.6673C39.6673 22.4395 38.5302 19.6878 36.256 17.412C33.9802 15.1378 31.2284 14.0007 28.0007 14.0007C24.7729 14.0007 22.0219 15.1378 19.7477 17.412C17.4719 19.6878 16.334 22.4395 16.334 25.6673H15.1673C12.9118 25.6673 10.9868 26.4645 9.39232 28.059C7.79787 29.6534 7.00065 31.5784 7.00065 33.834C7.00065 36.0895 7.79787 38.0145 9.39232 39.609C10.9868 41.2034 12.9118 42.0006 15.1673 42.0006H18.6673C19.3284 42.0006 19.883 42.2247 20.331 42.6727C20.7774 43.1191 21.0007 43.6729 21.0007 44.334C21.0007 44.9951 20.7774 45.5489 20.331 45.9953C19.883 46.4433 19.3284 46.6673 18.6673 46.6673H15.1673Z" fill="#6F6F6F"/>
    </g>
  </svg>
)

export default function HotspotNode({ id, data }: NodeProps) {
  const { setNodes, setEdges, getNodes } = useReactFlow()
  const updateNodeInternals = useUpdateNodeInternals()
  const typedData = data as { screenshotName?: string; pages?: HotspotPage[] }

  const [screenshotName, setScreenshotName] = useState(typedData.screenshotName ?? '')
  const [pages, setPages] = useState<HotspotPage[]>(typedData.pages ?? [])
  const [builderOpen, setBuilderOpen] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [focusedHotspotId, setFocusedHotspotId] = useState<string | null>(null)
  const [saveVersion, setSaveVersion] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-open builder when first dropped (no pages yet)
  useEffect(() => {
    if (!typedData.pages || typedData.pages.length === 0) {
      setBuilderOpen(true)
    }
  }, [])

  const handleSave = useCallback((name: string, savedPages: HotspotPage[]) => {
    setScreenshotName(name)
    setPages(savedPages)
    setSaveVersion(v => v + 1)
    setBuilderOpen(false)

    // Update node data, then signal FlowCanvas to create edges via DOM event
    setNodes(nds => nds.map(n => n.id === id ? {
      ...n,
      data: { ...n.data, screenshotName: name, pages: savedPages },
    } : n))

    // Dispatch event for FlowCanvas to handle edge creation (matches CTA pattern)
    document.dispatchEvent(new CustomEvent('hotspot-saved', {
      detail: { nodeId: id, pages: savedPages },
    }))
  }, [id, setNodes])

  const handleDuplicate = useCallback(() => {
    const nodes = getNodes()
    const sourceNode = nodes.find(n => n.id === id)
    if (!sourceNode) return
    const el = document.querySelector(`[data-id="${id}"]`) as HTMLElement | null
    const nodeW = el?.offsetWidth ?? 540
    const nodeH = el?.offsetHeight ?? 300
    const newNode = {
      id: `hotspotNode_${Date.now()}`,
      type: 'hotspotNode',
      position: { x: sourceNode.position.x + nodeW / 2, y: sourceNode.position.y + nodeH / 2 },
      data: { screenshotName, pages },
      selected: true,
      zIndex: 1000,
    }
    setNodes(nds => nds.map(n => ({ ...n, selected: false })).concat(newNode))
  }, [id, getNodes, setNodes, screenshotName, pages])

  const MIN_WIDTH = 400
  const [width, setWidth] = useState(540)
  const resizing = useRef<{ startX: number; startW: number } | null>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizing.current) return
      const newW = Math.max(MIN_WIDTH, resizing.current.startW + (e.clientX - resizing.current.startX))
      setWidth(newW)
    }
    const onUp = () => { resizing.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      const updatedPages = pages.length > 0
        ? pages.map((p, i) => i === 0 ? { ...p, imageSrc: src } : p)
        : [{ id: 'page-1', name: 'Page 1', imageSrc: src, hotspots: [] }]
      setPages(updatedPages)
      setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, pages: updatedPages } } : n))
    }
    reader.readAsDataURL(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowOverlay(false)
    const file = e.target.files?.[0]
    if (file) loadFile(file)
    e.target.value = ''
  }

  const openFilePicker = () => {
    setShowOverlay(true)
    setTimeout(() => fileInputRef.current?.click(), 100)
  }

  const deleteHotspotFromNode = useCallback((hsId: string, pageId: string) => {
    const updatedPages = pages.map(p =>
      p.id === pageId ? { ...p, hotspots: p.hotspots.filter(h => h.id !== hsId) } : p
    )
    setPages(updatedPages)
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, pages: updatedPages } } : n))
    setEdges(eds => eds.filter(e => !(e.source === id && e.sourceHandle === `hotspot-${hsId}`)))
    setTimeout(() => updateNodeInternals(id), 0)
  }, [pages, id, setNodes, setEdges, updateNodeInternals])

  const firstPageImage = pages[0]?.imageSrc ?? null
  const hasImage = !!firstPageImage
  const totalHotspots = pages.reduce((sum, p) => sum + p.hotspots.length, 0)

  // Flat list of all hotspots across all pages, with their source pageId
  const allHotspots = pages.flatMap(page =>
    page.hotspots.map(hs => ({ ...hs, pageId: page.id }))
  )

  const updateHotspotTitle = useCallback((hsId: string, pageId: string, title: string) => {
    const updatedPages = pages.map(p =>
      p.id === pageId ? { ...p, hotspots: p.hotspots.map(h => h.id === hsId ? { ...h, title } : h) } : p
    )
    setPages(updatedPages)
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, pages: updatedPages } } : n))
  }, [pages, id, setNodes])

  return (
    <>
      <div
        className="bg-white border border-[#d0cbc6] rounded-2xl relative shadow-[0px_20px_20px_-20px_rgba(48,41,33,0.25)]"
        style={{ width, paddingTop: 32, paddingBottom: 32 }}
      >
        <Handle type="target" position={Position.Left} className="!bg-brand-500 !border-brand-500" style={{ width: 12, height: 12, left: 0 }} />

        {/* Close button */}
        <button
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white hover:bg-gray-200 border-2 border-white flex items-center justify-center transition-colors shadow-sm z-20 nodrag nopan"
          onClick={() => {
            setNodes(nds => nds.filter(n => n.id !== id))
            setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
          }}
        >
          <X size={14} className="text-gray-600" />
        </button>

        {/* Header row */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[#D4A017]"><HotspotSvgIcon /></span>
            <span className="text-xs font-medium text-gray-500">Hotspot</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Edit — opens builder */}
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors nodrag nopan"
              onClick={() => setBuilderOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <mask id={`mask_edit_hs_${id}`} style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="18" height="18"><rect width="18" height="18" fill="#D9D9D9"/></mask>
                <g mask={`url(#mask_edit_hs_${id})`}><path d="M3.75 14.25H4.8L11.3625 7.6875L10.3125 6.6375L3.75 13.2V14.25ZM14.475 6.6375L11.3625 3.5625L12.3375 2.5875C12.5875 2.3375 12.8969 2.2125 13.2656 2.2125C13.6344 2.2125 13.9438 2.3375 14.1938 2.5875L15.45 3.8438C15.7 4.0938 15.825 4.4 15.825 4.7625C15.825 5.125 15.7 5.4313 15.45 5.6813L14.475 6.6375ZM13.5 7.6125L5.25 15.75H2.25V12.75L10.5 4.5L13.5 7.6125Z" fill="#293748"/></g>
              </svg>
            </button>
            {/* View */}
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors nodrag nopan"
              style={{ opacity: hasImage ? 1 : 0.3, cursor: hasImage ? 'pointer' : 'default' }}
            >
              <Eye size={18} className="text-[#293748]" />
            </button>
            {/* Duplicate */}
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors nodrag nopan" onClick={handleDuplicate}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <mask id={`mask_dup_hs_${id}`} style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><rect width="20" height="20" fill="#D9D9D9"/></mask>
                <g mask={`url(#mask_dup_hs_${id})`}><path d="M7.5 15C7.04167 15 6.64944 14.8369 6.32333 14.5108C5.99667 14.1842 5.83333 13.7917 5.83333 13.3333V3.33332C5.83333 2.87499 5.99667 2.48249 6.32333 2.15582C6.64944 1.82971 7.04167 1.66666 7.5 1.66666H15C15.4583 1.66666 15.8508 1.82971 16.1775 2.15582C16.5036 2.48249 16.6667 2.87499 16.6667 3.33332V13.3333C16.6667 13.7917 16.5036 14.1842 16.1775 14.5108C15.8508 14.8369 15.4583 15 15 15H7.5ZM7.5 13.3333H15V3.33332H7.5V13.3333ZM4.16667 18.3333C3.70833 18.3333 3.31583 18.1703 2.98917 17.8442C2.66306 17.5175 2.5 17.125 2.5 16.6667V5.83332C2.5 5.59721 2.58 5.39916 2.74 5.23916C2.89944 5.07971 3.09722 4.99999 3.33333 4.99999C3.56944 4.99999 3.7675 5.07971 3.9275 5.23916C4.08694 5.39916 4.16667 5.59721 4.16667 5.83332V16.6667H12.5C12.7361 16.6667 12.9342 16.7467 13.0942 16.9067C13.2536 17.0661 13.3333 17.2639 13.3333 17.5C13.3333 17.7361 13.2536 17.9339 13.0942 18.0933C12.9342 18.2533 12.7361 18.3333 12.5 18.3333H4.16667Z" fill="#293748"/></g>
              </svg>
            </button>
          </div>
        </div>

        {/* Screenshot name */}
        <div className="px-5 pb-4">
          <input
            type="text"
            value={screenshotName}
            onChange={(e) => setScreenshotName(e.target.value)}
            placeholder="Enter your screenshot name here"
            className="nodrag w-full text-base font-semibold italic text-gray-800 placeholder:text-gray-800 placeholder:font-semibold placeholder:italic placeholder:opacity-100 focus:placeholder:opacity-60 outline-none bg-transparent resize-none"
            style={{ lineHeight: 1.5 }}
          />
        </div>

        {/* Drop zone / image */}
        <div className={`px-5 pt-2 ${allHotspots.length > 0 ? 'pb-2' : 'pb-2'}`}>
          {hasImage ? (
            <div className="relative group/img rounded-[4px] overflow-hidden border border-[#d0cbc6]" style={{ height: 124 }}>
              <img src={firstPageImage!} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-black/30 absolute inset-0 rounded-[4px] pointer-events-none" />
                <div className="relative z-10 flex items-center bg-white rounded-full border border-[#D6D1CB] px-2 py-2 gap-1 shadow-lg pointer-events-auto">
                  <button
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#73716F26] transition-colors cursor-pointer nodrag nopan"
                    onClick={openFilePicker}
                    title="Replace"
                  >
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path d="M10.0417 16.6667C8.18056 16.6667 6.59722 16.0209 5.29167 14.7292C3.98611 13.4375 3.33333 11.8612 3.33333 10V9.85421L2.58333 10.6042C2.43056 10.757 2.23611 10.8334 2 10.8334C1.76389 10.8334 1.56944 10.757 1.41667 10.6042C1.26389 10.4514 1.1875 10.257 1.1875 10.0209C1.1875 9.78476 1.26389 9.59032 1.41667 9.43754L3.58333 7.27087C3.66667 7.18754 3.75694 7.12837 3.85417 7.09337C3.95139 7.05893 4.05556 7.04171 4.16667 7.04171C4.27778 7.04171 4.38194 7.05893 4.47917 7.09337C4.57639 7.12837 4.66667 7.18754 4.75 7.27087L6.91667 9.43754C7.06944 9.59032 7.14583 9.78476 7.14583 10.0209C7.14583 10.257 7.06944 10.4514 6.91667 10.6042C6.76389 10.757 6.56944 10.8334 6.33333 10.8334C6.09722 10.8334 5.90278 10.757 5.75 10.6042L5 9.85421V10C5 11.3889 5.48972 12.5695 6.46917 13.5417C7.44806 14.5139 8.63889 15 10.0417 15C10.3194 15 10.5903 14.9759 10.8542 14.9275C11.1181 14.8787 11.3819 14.8056 11.6458 14.7084C11.7847 14.6528 11.9342 14.6389 12.0942 14.6667C12.2536 14.6945 12.3889 14.7639 12.5 14.875C12.75 15.125 12.8508 15.3923 12.8025 15.6767C12.7536 15.9617 12.5694 16.1598 12.25 16.2709C11.8889 16.3959 11.5244 16.4931 11.1567 16.5625C10.7883 16.632 10.4167 16.6667 10.0417 16.6667ZM15.8333 12.9584C15.7222 12.9584 15.6181 12.9409 15.5208 12.9059C15.4236 12.8714 15.3333 12.8125 15.25 12.7292L13.0833 10.5625C12.9306 10.4098 12.8542 10.2153 12.8542 9.97921C12.8542 9.7431 12.9306 9.54865 13.0833 9.39587C13.2361 9.2431 13.4306 9.16671 13.6667 9.16671C13.9028 9.16671 14.0972 9.2431 14.25 9.39587L15 10.1459V10C15 8.61115 14.5106 7.4306 13.5317 6.45837C12.5522 5.48615 11.3611 5.00004 9.95833 5.00004C9.68056 5.00004 9.40972 5.02448 9.14583 5.07337C8.88194 5.12171 8.61806 5.19449 8.35417 5.29171C8.21528 5.34726 8.06611 5.36115 7.90667 5.33337C7.74667 5.3056 7.61111 5.23615 7.5 5.12504C7.25 4.87504 7.14917 4.60754 7.1975 4.32254C7.24639 4.0381 7.43056 3.84032 7.75 3.72921C8.11111 3.60421 8.47583 3.50699 8.84417 3.43754C9.21194 3.3681 9.58333 3.33337 9.95833 3.33337C11.8194 3.33337 13.4028 3.97921 14.7083 5.27087C16.0139 6.56254 16.6667 8.13893 16.6667 10V10.1459L17.4167 9.39587C17.5694 9.2431 17.7639 9.16671 18 9.16671C18.2361 9.16671 18.4306 9.2431 18.5833 9.39587C18.7361 9.54865 18.8125 9.7431 18.8125 9.97921C18.8125 10.2153 18.7361 10.4098 18.5833 10.5625L16.4167 12.7292C16.3333 12.8125 16.2431 12.8714 16.1458 12.9059C16.0486 12.9409 15.9444 12.9584 15.8333 12.9584Z" fill="#172537"/>
                    </svg>
                  </button>
                  <button
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#73716F26] transition-colors cursor-pointer nodrag nopan"
                    onClick={() => {
                      const cleared = pages.map(p => ({ ...p, imageSrc: null }))
                      setPages(cleared)
                      setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, pages: cleared } } : n))
                    }}
                    title="Remove"
                  >
                    <X size={16} className="text-[#293748]" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="nodrag nopan flex flex-col items-center justify-center rounded-[4px] border border-dashed transition-colors cursor-pointer"
              style={{
                borderColor: isDragOver ? '#FC6839' : '#FC6839',
                backgroundColor: isDragOver ? 'rgba(252,104,57,0.05)' : 'white',
                minHeight: 100,
                gap: 8,
              }}
              onClick={openFilePicker}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsDragOver(false)
                const file = e.dataTransfer.files?.[0]
                if (file) loadFile(file)
              }}
            >
              <UploadCloudIcon />
              <p className="text-xs text-black">Drop files here</p>
              <button
                className="nodrag nopan text-xs font-semibold text-[#FC6839] hover:text-[#F44C10] transition-colors"
                onClick={(e) => { e.stopPropagation(); openFilePicker() }}
              >
                Upload
              </button>
            </div>
          )}
        </div>

        {/* Hotspot names list */}
        {allHotspots.length > 0 && (
          <div className="px-5" style={{ marginTop: 24 }}>
            <div className="flex flex-col gap-5">
              {allHotspots.map((hs) => (
                <div
                  key={`${hs.id}-${saveVersion}`}
                  className="nodrag group flex items-center gap-3 relative transition-opacity pb-2 border-b border-gray-200 focus-within:border-brand-400"
                >
                  {/* Editable hotspot name — matches CtaNode answer field */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      data-placeholder="Type your hotspot name here"
                      className={`text-sm text-gray-800 outline-none min-h-[1.5em] [&_*]:leading-[inherit] ${
                        !hs.title
                          ? `before:content-[attr(data-placeholder)] before:pointer-events-none before:text-[#FC6839] ${focusedHotspotId === hs.id ? 'before:opacity-60' : ''}`
                          : ''
                      }`}
                      style={{ wordBreak: 'break-word', lineHeight: 1.5 }}
                      ref={(el) => {
                        if (el && !el.dataset.initialized) {
                          el.textContent = hs.title
                          el.dataset.initialized = 'true'
                        }
                      }}
                      onInput={(e) => {
                        const el = e.target as HTMLDivElement
                        updateHotspotTitle(hs.id, hs.pageId, el.textContent || '')
                      }}
                      onFocus={() => setFocusedHotspotId(hs.id)}
                      onBlur={() => setFocusedHotspotId(null)}
                    />
                  </div>

                  {/* Delete hotspot */}
                  <button
                    className="nopan nodrag shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => deleteHotspotFromNode(hs.id, hs.pageId)}
                  >
                    <X size={14} />
                  </button>

                  {/* Per-hotspot source handle */}
                  <div className="absolute top-1/2 -translate-y-1/2" style={{ right: -21 }}>
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={`hotspot-${hs.id}`}
                      className="!bg-brand-500 !border-brand-500 !relative !top-0 !right-0"
                      style={{ width: 12, height: 12 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

        {showOverlay && createPortal(
          <div className="fixed inset-0 bg-black/50" style={{ zIndex: 9999 }} onClick={() => setShowOverlay(false)} />,
          document.body,
        )}

        {/* Resize handle */}
        <div
          className="absolute top-0 right-0 w-2 h-full cursor-ew-resize nodrag nopan"
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            resizing.current = { startX: e.clientX, startW: width }
          }}
        />
      </div>

      {builderOpen && (
        <HotspotBuilderModal
          initialName={screenshotName}
          initialPages={pages}
          onSave={handleSave}
          onClose={() => setBuilderOpen(false)}
        />
      )}
    </>
  )
}
