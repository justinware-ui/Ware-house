'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { type NodeProps, useReactFlow, useUpdateNodeInternals } from '@xyflow/react'
import { X } from 'lucide-react'
import {
  HeaderIconButton,
  DuplicateIcon,
  PreviewEyeIcon,
  EditIcon,
  DeleteIcon,
  NodeHeaderBar,
} from './NodeHeaderActions'
import HotspotBuilderModal, { type HotspotPage } from '../HotspotBuilderModal'
import { demos as allDemosData } from '../../data/demos'
import FormattingToolbar, { type FormatOption } from './FormattingToolbar'
import NodeInputShell from './NodeInputShell'
import { clearOrRemoveField } from './NodeInputFieldRow'
import {
  HEADER_INPUT_CLASS,
  PLACEHOLDERS,
  ANSWER_FIELD_CLASS,
  ANSWER_RICH_TEXT_PLACEHOLDER_CLASS,
  NODE_ERROR_COLOR,
  NODE_DEFAULT_WIDTH,
  NODE_INPUT_INNER_CLASS,
  ANSWER_INLINE_HANDLE_TOP,
} from './nodeFieldStyles'
import { NodeSideTargetHandle } from './NodeConnectorHandles'
import RequiredFieldGroup from './RequiredFieldGroup'
import NodeInputSection from './NodeInputSection'
import NodeRequiredBanner from './NodeRequiredBanner'
import { useFormattingToolbar } from './useFormattingToolbar'
import { useNodeWidthResize } from './useNodeWidthResize'
import { useNodeValidation } from './useNodeValidation'
import { useRegisterNodeFields } from './useRegisterNodeFields'
import { isFieldEmpty } from './nodeValidation'
import { shouldShowFieldValidation } from './nodeValidationStore'
import NodeResizeHandle from './NodeResizeHandle'

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
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHotspotId, setPreviewHotspotId] = useState<string | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [focusedHotspotId, setFocusedHotspotId] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<'name' | 'hotspot' | null>(null)
  const [saveVersion, setSaveVersion] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    showToolbar,
    activeFormats,
    handleFieldFocus,
    handleFieldBlur,
    toggleRichFormat,
    toggleToggleFormat,
  } = useFormattingToolbar({
    nodeId: id,
    onBlurClear: () => setFocusedField(null),
  })

  const toggleFormat = useCallback((fmt: FormatOption) => {
    if (fmt === 'image') return
    if (fmt === 'bold' || fmt === 'italic' || fmt === 'underline') {
      toggleRichFormat(fmt)
      return
    }
    toggleToggleFormat(fmt)
  }, [toggleRichFormat, toggleToggleFormat])

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

  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
  }, [id, setNodes, setEdges])

  const { width, startResize } = useNodeWidthResize()

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

  const hotspotOrderKey = allHotspots.map((hs) => hs.id).join(',')
  const hotspotFieldIds = useMemo(
    () => allHotspots.map((hs) => `hotspot-${hs.id}`),
    [hotspotOrderKey],
  )
  useRegisterNodeFields(id, hotspotFieldIds)

  const getHasErrors = useCallback(() => {
    if (isFieldEmpty(screenshotName)) return true
    for (const page of pages) {
      for (const hs of page.hotspots) {
        if (isFieldEmpty(hs.title) && shouldShowFieldValidation(id, `hotspot-${hs.id}`)) {
          return true
        }
      }
    }
    return false
  }, [pages, screenshotName, id])

  const { showValidation } = useNodeValidation(id, getHasErrors)
  const nodeHasErrors = showValidation && getHasErrors()
  const screenshotNameInvalid = showValidation && isFieldEmpty(screenshotName)

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
        className={`bg-white border rounded-2xl relative shadow-[0px_20px_20px_-20px_rgba(48,41,33,0.25)] overflow-visible transition-[border-color] duration-150 ${nodeHasErrors ? '' : 'border-[#d0cbc6]'}`}
        style={{
          width,
          paddingBottom: 32,
          ...(nodeHasErrors ? { borderColor: NODE_ERROR_COLOR } : {}),
        }}
      >
        {nodeHasErrors && (
          <div className="-mt-0 mb-0 overflow-hidden rounded-t-2xl relative z-0">
            <NodeRequiredBanner className="rounded-t-2xl" />
          </div>
        )}
        <div className="relative flex flex-col flex-1 overflow-visible">
        <NodeSideTargetHandle />

        {showToolbar && (
          <FormattingToolbar
            activeFormats={activeFormats}
            onToggle={toggleFormat}
            disabledKeys={new Set<FormatOption>(['image'])}
            sparkleId={`hotspot_${id}`}
          />
        )}

        <NodeHeaderBar
          className="px-5 pt-5"
          icon={<span className="text-[#D4A017]"><HotspotSvgIcon /></span>}
          title="Screengrab & Hotspots"
          actions={
            <>
              <HeaderIconButton label="Edit" onClick={() => setBuilderOpen(true)}>
                <EditIcon />
              </HeaderIconButton>
              <HeaderIconButton
                label="Preview"
                onClick={() => {
                  if (hasImage) {
                    setPreviewHotspotId(null)
                    setPreviewOpen(true)
                  }
                }}
                disabled={!hasImage}
              >
                <PreviewEyeIcon />
              </HeaderIconButton>
              <HeaderIconButton label="Duplicate" onClick={handleDuplicate}>
                <DuplicateIcon />
              </HeaderIconButton>
              <HeaderIconButton label="Delete" onClick={handleDelete} circular>
                <DeleteIcon />
              </HeaderIconButton>
            </>
          }
        />

        {/* Screenshot name */}
        <NodeInputSection className="pt-3 pb-4">
          <RequiredFieldGroup showMessage={screenshotNameInvalid}>
            <NodeInputShell
              focused={focusedField === 'name'}
              onBlur={handleFieldBlur}
              padding={0}
              invalid={screenshotNameInvalid}
              hasContent={!!screenshotName.trim()}
              onClear={() => setScreenshotName('')}
            >
              <input
                type="text"
                value={screenshotName}
                onChange={(e) => setScreenshotName(e.target.value)}
                placeholder={PLACEHOLDERS.screenshotName}
                className={`${HEADER_INPUT_CLASS} ${NODE_INPUT_INNER_CLASS}`}
                style={{ lineHeight: 1.5 }}
                data-cta-field
                onFocus={() => {
                  handleFieldFocus()
                  setFocusedField('name')
                }}
                onBlur={handleFieldBlur}
              />
            </NodeInputShell>
          </RequiredFieldGroup>
        </NodeInputSection>

        {/* Drop zone / image */}
        <NodeInputSection className="pt-2 pb-2">
          {hasImage ? (
            <div className="relative group/img rounded-[4px] overflow-hidden border border-[#d0cbc6]" style={{ height: 124 }}>
              <img src={firstPageImage!} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-black/30 absolute inset-0 rounded-[4px] pointer-events-none" />
                <div className="relative z-10 flex items-center bg-white rounded-full border border-[#D6D1CB] px-2 py-2 gap-1 shadow-lg pointer-events-auto">
                  <div className="relative group/replace">
                    <button
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#73716F26] transition-colors cursor-pointer nodrag nopan"
                      onClick={openFilePicker}
                    >
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <path d="M10.0417 16.6667C8.18056 16.6667 6.59722 16.0209 5.29167 14.7292C3.98611 13.4375 3.33333 11.8612 3.33333 10V9.85421L2.58333 10.6042C2.43056 10.757 2.23611 10.8334 2 10.8334C1.76389 10.8334 1.56944 10.757 1.41667 10.6042C1.26389 10.4514 1.1875 10.257 1.1875 10.0209C1.1875 9.78476 1.26389 9.59032 1.41667 9.43754L3.58333 7.27087C3.66667 7.18754 3.75694 7.12837 3.85417 7.09337C3.95139 7.05893 4.05556 7.04171 4.16667 7.04171C4.27778 7.04171 4.38194 7.05893 4.47917 7.09337C4.57639 7.12837 4.66667 7.18754 4.75 7.27087L6.91667 9.43754C7.06944 9.59032 7.14583 9.78476 7.14583 10.0209C7.14583 10.257 7.06944 10.4514 6.91667 10.6042C6.76389 10.757 6.56944 10.8334 6.33333 10.8334C6.09722 10.8334 5.90278 10.757 5.75 10.6042L5 9.85421V10C5 11.3889 5.48972 12.5695 6.46917 13.5417C7.44806 14.5139 8.63889 15 10.0417 15C10.3194 15 10.5903 14.9759 10.8542 14.9275C11.1181 14.8787 11.3819 14.8056 11.6458 14.7084C11.7847 14.6528 11.9342 14.6389 12.0942 14.6667C12.2536 14.6945 12.3889 14.7639 12.5 14.875C12.75 15.125 12.8508 15.3923 12.8025 15.6767C12.7536 15.9617 12.5694 16.1598 12.25 16.2709C11.8889 16.3959 11.5244 16.4931 11.1567 16.5625C10.7883 16.632 10.4167 16.6667 10.0417 16.6667ZM15.8333 12.9584C15.7222 12.9584 15.6181 12.9409 15.5208 12.9059C15.4236 12.8714 15.3333 12.8125 15.25 12.7292L13.0833 10.5625C12.9306 10.4098 12.8542 10.2153 12.8542 9.97921C12.8542 9.7431 12.9306 9.54865 13.0833 9.39587C13.2361 9.2431 13.4306 9.16671 13.6667 9.16671C13.9028 9.16671 14.0972 9.2431 14.25 9.39587L15 10.1459V10C15 8.61115 14.5106 7.4306 13.5317 6.45837C12.5522 5.48615 11.3611 5.00004 9.95833 5.00004C9.68056 5.00004 9.40972 5.02448 9.14583 5.07337C8.88194 5.12171 8.61806 5.19449 8.35417 5.29171C8.21528 5.34726 8.06611 5.36115 7.90667 5.33337C7.74667 5.3056 7.61111 5.23615 7.5 5.12504C7.25 4.87504 7.14917 4.60754 7.1975 4.32254C7.24639 4.0381 7.43056 3.84032 7.75 3.72921C8.11111 3.60421 8.47583 3.50699 8.84417 3.43754C9.21194 3.3681 9.58333 3.33337 9.95833 3.33337C11.8194 3.33337 13.4028 3.97921 14.7083 5.27087C16.0139 6.56254 16.6667 8.13893 16.6667 10V10.1459L17.4167 9.39587C17.5694 9.2431 17.7639 9.16671 18 9.16671C18.2361 9.16671 18.4306 9.2431 18.5833 9.39587C18.7361 9.54865 18.8125 9.7431 18.8125 9.97921C18.8125 10.2153 18.7361 10.4098 18.5833 10.5625L16.4167 12.7292C16.3333 12.8125 16.2431 12.8714 16.1458 12.9059C16.0486 12.9409 15.9444 12.9584 15.8333 12.9584Z" fill="#172537"/>
                      </svg>
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-[#172537] text-white text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover/replace:opacity-100 transition-opacity shadow-md">
                      Replace
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#172537]" />
                    </div>
                  </div>
                  <div className="relative group/delete">
                    <button
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#73716F26] transition-colors cursor-pointer nodrag nopan"
                      onClick={() => {
                        const cleared = pages.map(p => ({ ...p, imageSrc: null }))
                        setPages(cleared)
                        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, pages: cleared } } : n))
                      }}
                    >
                      <X size={16} className="text-[#293748]" />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-[#172537] text-white text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover/delete:opacity-100 transition-opacity shadow-md">
                      Delete
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#172537]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="nodrag nopan flex flex-col items-center justify-center rounded-[4px] border border-dashed transition-colors cursor-pointer"
              style={{
                borderColor: isDragOver ? '#FC6839' : '#FC6839',
                backgroundColor: isDragOver ? 'rgba(252,104,57,0.05)' : 'white',
                minHeight: 124,
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
        </NodeInputSection>

        {/* Hotspot names list */}
        {allHotspots.length > 0 && (
          <NodeInputSection style={{ marginTop: 24 }}>
            <div className="flex flex-col gap-5 overflow-visible">
              {allHotspots.map((hs) => {
                const hotspotInvalid =
                  showValidation &&
                  isFieldEmpty(hs.title) &&
                  shouldShowFieldValidation(id, `hotspot-${hs.id}`)
                return (
                <div
                  key={`${hs.id}-${saveVersion}`}
                  className="nodrag group relative overflow-visible"
                  data-hotspot-row={hs.id}
                >
                  <RequiredFieldGroup
                    showMessage={hotspotInvalid}
                    handleId={`hotspot-${hs.id}`}
                    handleTop={ANSWER_INLINE_HANDLE_TOP}
                    className="w-full"
                  >
                  <NodeInputShell
                    focused={focusedField === 'hotspot' && focusedHotspotId === hs.id}
                    className="w-full"
                    padding={0}
                    onBlur={handleFieldBlur}
                    invalid={hotspotInvalid}
                    hasContent={!!hs.title.trim()}
                    showClearWhenEmpty={allHotspots.length >= 2}
                    onClear={() => {
                      clearOrRemoveField(
                        hs.title,
                        () => {
                          updateHotspotTitle(hs.id, hs.pageId, '')
                          document
                            .querySelector(`[data-hotspot-row="${hs.id}"] [contenteditable]`)
                            ?.replaceChildren()
                        },
                        allHotspots.length >= 2
                          ? () => deleteHotspotFromNode(hs.id, hs.pageId)
                          : undefined,
                      )
                    }}
                  >
                  <div className={NODE_INPUT_INNER_CLASS}>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      data-placeholder={PLACEHOLDERS.hotspotName}
                      data-cta-field
                      className={`${ANSWER_FIELD_CLASS} outline-none min-h-[1.5em] [&_*]:leading-[inherit] ${!hs.title ? ANSWER_RICH_TEXT_PLACEHOLDER_CLASS : ''}`}
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
                      onFocus={() => {
                        handleFieldFocus()
                        setFocusedField('hotspot')
                        setFocusedHotspotId(hs.id)
                      }}
                      onBlur={() => setFocusedHotspotId(null)}
                    />
                  </div>
                  </NodeInputShell>
                  </RequiredFieldGroup>

                  {allHotspots.length >= 2 && (
                    <div className="absolute flex items-center nodrag nopan" style={{ top: 10, right: 0 }}>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => deleteHotspotFromNode(hs.id, hs.pageId)}
                        aria-label="Remove hotspot"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          </NodeInputSection>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

        {showOverlay && createPortal(
          <div className="fixed inset-0 bg-black/50" style={{ zIndex: 9999 }} onClick={() => setShowOverlay(false)} />,
          document.body,
        )}

        <NodeResizeHandle onMouseDown={startResize} />
        </div>
      </div>

      {builderOpen && (
        <HotspotBuilderModal
          initialName={screenshotName}
          initialPages={pages}
          onSave={handleSave}
          onClose={() => setBuilderOpen(false)}
        />
      )}

      {previewOpen && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center nodrag nopan"
          style={{ zIndex: 99999, background: 'rgba(0,0,0,0.75)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setPreviewOpen(false); setPreviewHotspotId(null) } }}
        >
          {/* Close button */}
          <button
            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => { setPreviewOpen(false); setPreviewHotspotId(null) }}
          >
            <X size={20} className="text-white" />
          </button>

          {/* Screenshot + hotspots container */}
          <div className="relative max-w-[90vw] max-h-[85vh]">
            <img
              src={firstPageImage!}
              alt=""
              className="block rounded-lg shadow-2xl"
              style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain' }}
              onClick={() => setPreviewHotspotId(null)}
            />

            {/* Hotspot markers */}
            {allHotspots.map((hs) => (
              <div
                key={hs.id}
                className="absolute"
                style={{ left: `${hs.x}%`, top: `${hs.y}%`, transform: 'translate(-50%, -50%)', cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); setPreviewHotspotId(prev => prev === hs.id ? null : hs.id) }}
              >
                {/* Pulsing outer ring */}
                <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(180,60,0,0.4)', width: 28, height: 28, top: -4, left: -4 }} />
                {/* Inner dot */}
                <div className="relative w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-md" style={{ background: '#FC6839' }}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="2.667" fill="white"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M7.04 0.73C7.36 0.69 7.68 0.67 8 0.67C8.32 0.67 8.64 0.69 8.96 0.73C9.32 0.78 9.58 1.11 9.53 1.48C9.48 1.84 9.15 2.1 8.78 2.05C8.53 2.02 8.27 2 8 2C7.73 2 7.47 2.02 7.22 2.05C6.85 2.1 6.52 1.84 6.47 1.48C6.42 1.11 6.68 0.78 7.04 0.73ZM14.52 6.47C14.89 6.52 15.23 6.68 15.27 7.04C15.31 7.36 15.33 7.68 15.33 8C15.33 8.32 15.31 8.64 15.27 8.96C15.23 9.32 14.89 9.58 14.52 9.53C14.16 9.48 13.9 9.15 13.95 8.78C13.98 8.53 14 8.27 14 8C14 7.73 13.98 7.47 13.95 7.22C13.9 6.85 14.16 6.52 14.52 6.47ZM1.48 6.47C1.84 6.52 2.1 6.85 2.05 7.22C2.02 7.47 2 7.73 2 8C2 8.27 2.02 8.53 2.05 8.78C2.1 9.15 1.84 9.48 1.48 9.53C1.11 9.58 0.78 9.32 0.73 8.96C0.69 8.64 0.67 8.32 0.67 8C0.67 7.68 0.69 7.36 0.73 7.04C0.78 6.68 1.11 6.42 1.48 6.47Z" fill="white"/>
                  </svg>
                </div>

                {/* Popup */}
                {previewHotspotId === hs.id && (
                  <div
                    className="absolute"
                    style={{ bottom: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)', width: 280, pointerEvents: 'none' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Tail */}
                    <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid #0052CC' }} />
                    {/* Card */}
                    <div style={{ background: '#0052CC', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                      <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, color: '#fff', margin: 0, lineHeight: '18px' }}>
                        {hs.title || <span style={{ opacity: 0.5, fontStyle: 'italic', fontWeight: 400 }}>Hotspot title…</span>}
                      </p>
                      {hs.description && (
                        <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 400, color: '#fff', margin: 0, lineHeight: '17px' }}>
                          <span dangerouslySetInnerHTML={{ __html: hs.description }} />
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 100, border: '2px solid rgba(242,242,242,0.8)' }}>
                          <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 600, color: '#F2F2F2', whiteSpace: 'nowrap' }}>
                            {hs.buttonText || "Let's Go!"}
                          </span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12h14M13 6l6 6-6 6" stroke="#F2F2F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Hotspot count badge */}
          {allHotspots.length > 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-medium text-white/70" style={{ background: 'rgba(255,255,255,0.1)', fontFamily: 'Poppins, sans-serif' }}>
              {allHotspots.length} hotspot{allHotspots.length !== 1 ? 's' : ''} — click to preview
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
