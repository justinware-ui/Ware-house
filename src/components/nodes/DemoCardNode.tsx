import { X } from 'lucide-react'
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import thumbTableHero from '../../assets/thumb-table-hero.svg'
import thumbContent from '../../assets/thumb-content.svg'
import { useMemo, useState, useEffect, useRef } from 'react'
import PreviewModal from '../PreviewModal'

const thumbnails = [thumbTableHero, thumbContent]

const MIN_WIDTH = 340

export default function DemoCardNode({ id, data }: NodeProps) {
  const { title = 'Demo title', creator = 'Demo creator', thumb, preview, demoId } = data as {
    demoId?: string
    title?: string
    creator?: string
    thumb?: string
    preview?: string
  }
  const { setNodes, setEdges } = useReactFlow()
  const [width, setWidth] = useState(MIN_WIDTH)
  const [showPreview, setShowPreview] = useState(false)
  const resizing = useRef<{ startX: number; startW: number } | null>(null)

  const fallbackThumb = useMemo(
    () => thumbnails[Math.floor(Math.random() * thumbnails.length)],
    [],
  )

  const removeNode = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
  }

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

  return (
    <>
    {showPreview && preview && (
      <PreviewModal url={preview} title={title} onClose={() => setShowPreview(false)} />
    )}
    <div
      className="group/card relative flex items-center gap-3 px-3 py-7 rounded-xl border border-gray-200 bg-white shadow-sm transition-[box-shadow,border-color] duration-200"
      style={{ width }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-brand-500 !border-brand-500"
        style={{ width: 12, height: 12 }}
      />

      {/* Drag handle */}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <path d="M7.5 16.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.163-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.326.326.49.718.49 1.177s-.164.851-.49 1.177c-.326.327-.718.49-1.177.49Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.459.164-.851.49-1.178.326-.326.718-.489 1.177-.489s.851.163 1.177.49c.327.326.49.718.49 1.177s-.163.851-.49 1.177c-.326.327-.718.49-1.177.49ZM7.5 11.666c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.163-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.326.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.604 1.604 0 0 1-.49-1.177c0-.458.164-.851.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.326.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489ZM7.5 6.666c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.163-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.326.327.49.718.49 1.177 0 .459-.164.851-.49 1.178-.326.326-.718.489-1.177.489Zm5 0c-.459 0-.851-.163-1.177-.49a1.607 1.607 0 0 1-.49-1.177c0-.458.164-.85.49-1.177.326-.327.718-.49 1.177-.49s.851.163 1.177.49c.327.327.49.718.49 1.177 0 .459-.163.851-.49 1.178-.326.326-.718.489-1.177.489Z" fill="#8D8A87"/>
      </svg>

      {/* Thumbnail */}
      <img src={thumb || fallbackThumb} alt="" className="w-12 h-12 rounded-lg shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">{creator}</span>
          <span className="text-xs text-brand-500 font-semibold">Show more</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0" style={{ marginRight: 8 }}>
        <button className="hover:opacity-70 transition-opacity nodrag nopan" onClick={() => preview && setShowPreview(true)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <mask id={`mask_eye_node_${id}`} style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
              <rect width="20" height="20" fill="#D9D9D9"/>
            </mask>
            <g mask={`url(#mask_eye_node_${id})`}>
              <path d="M9.99935 13.3334C11.041 13.3334 11.9266 12.9689 12.656 12.24C13.3849 11.5106 13.7493 10.625 13.7493 9.58337C13.7493 8.54171 13.3849 7.65615 12.656 6.92671C11.9266 6.19782 11.041 5.83337 9.99935 5.83337C8.95768 5.83337 8.07213 6.19782 7.34268 6.92671C6.61379 7.65615 6.24935 8.54171 6.24935 9.58337C6.24935 10.625 6.61379 11.5106 7.34268 12.24C8.07213 12.9689 8.95768 13.3334 9.99935 13.3334ZM9.99935 11.8334C9.37435 11.8334 8.84324 11.6145 8.40602 11.1767C7.96824 10.7395 7.74935 10.2084 7.74935 9.58337C7.74935 8.95837 7.96824 8.42698 8.40602 7.98921C8.84324 7.55198 9.37435 7.33337 9.99935 7.33337C10.6243 7.33337 11.1557 7.55198 11.5935 7.98921C12.0307 8.42698 12.2493 8.95837 12.2493 9.58337C12.2493 10.2084 12.0307 10.7395 11.5935 11.1767C11.1557 11.6145 10.6243 11.8334 9.99935 11.8334ZM9.99935 15.8334C8.06879 15.8334 6.3049 15.3231 4.70768 14.3025C3.11046 13.2814 1.90213 11.9028 1.08268 10.1667C1.04102 10.0973 1.01324 10.0103 0.999349 9.90587C0.98546 9.80199 0.978516 9.69448 0.978516 9.58337C0.978516 9.47226 0.98546 9.36449 0.999349 9.26004C1.01324 9.15615 1.04102 9.06949 1.08268 9.00004C1.90213 7.26393 3.11046 5.8856 4.70768 4.86504C6.3049 3.84393 8.06879 3.33337 9.99935 3.33337C11.9299 3.33337 13.6938 3.84393 15.291 4.86504C16.8882 5.8856 18.0966 7.26393 18.916 9.00004C18.9577 9.06949 18.9855 9.15615 18.9993 9.26004C19.0132 9.36449 19.0202 9.47226 19.0202 9.58337C19.0202 9.69448 19.0132 9.80199 18.9993 9.90587C18.9855 10.0103 18.9577 10.0973 18.916 10.1667C18.0966 11.9028 16.8882 13.2814 15.291 14.3025C13.6938 15.3231 11.9299 15.8334 9.99935 15.8334ZM9.99935 14.1667C11.5688 14.1667 13.0099 13.7534 14.3227 12.9267C15.6349 12.1006 16.6382 10.9862 17.3327 9.58337C16.6382 8.1806 15.6349 7.06587 14.3227 6.23921C13.0099 5.4131 11.5688 5.00004 9.99935 5.00004C8.4299 5.00004 6.98879 5.4131 5.67602 6.23921C4.36379 7.06587 3.36046 8.1806 2.66602 9.58337C3.36046 10.9862 4.36379 12.1006 5.67602 12.9267C6.98879 13.7534 8.4299 14.1667 9.99935 14.1667Z" fill="#293748"/>
            </g>
          </svg>
        </button>
      </div>

      {/* Close button */}
      <button
        onClick={removeNode}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 border-2 border-white flex items-center justify-center transition-colors"
      >
        <X size={12} className="text-gray-600" />
      </button>

      {/* Change content sparkle — visible on card hover */}
      <div className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 nodrag nopan"
        style={{ right: -44 }}
      >
        <div className="relative group/sparkle">
          <button
            onClick={(e) => {
              e.stopPropagation()
              document.dispatchEvent(new CustomEvent('open-replace-popover', { detail: { nodeId: id, demoId: demoId || '', title } }))
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          >
            <svg width="50" height="50" viewBox="14 8 62 62" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="19.0464" y="12.4535" width="50.4" height="50.4" rx="25.2" fill="url(#paint_card_hover_sparkle)"/>
              <path d="M43.0806 28.0993C43.1186 27.8951 43.4112 27.8951 43.4492 28.0993L43.8704 30.3629C44.4091 33.2584 46.6746 35.5236 49.5704 36.0623L51.8342 36.4835C52.0384 36.5215 52.0384 36.814 51.8342 36.852L49.5704 37.2731C46.6746 37.8118 44.4091 40.0771 43.8704 42.9726L43.4492 45.2362C43.4112 45.4404 43.1186 45.4404 43.0806 45.2362L42.6595 42.9726C42.1207 40.0771 39.8552 37.8118 36.9595 37.2731L34.6956 36.852C34.4914 36.814 34.4914 36.5215 34.6956 36.4835L36.9595 36.0623C39.8552 35.5236 42.1207 33.2584 42.6595 30.3629L43.0806 28.0993Z" fill="white"/>
              <path d="M50.898 40.663C50.9127 40.584 51.0259 40.584 51.0406 40.663L51.2035 41.5386C51.4119 42.6586 52.2883 43.5349 53.4084 43.7433L54.2841 43.9062C54.3631 43.9209 54.3631 44.034 54.2841 44.0487L53.4084 44.2116C52.2883 44.42 51.4119 45.2963 51.2035 46.4163L51.0406 47.2919C51.0259 47.3709 50.9127 47.3709 50.898 47.2919L50.7351 46.4163C50.5267 45.2963 49.6504 44.42 48.5302 44.2116L47.6545 44.0487C47.5755 44.034 47.5755 43.9209 47.6545 43.9062L48.5302 43.7433C49.6504 43.5349 50.5267 42.6586 50.7351 41.5386L50.898 40.663Z" fill="white"/>
              <defs>
                <linearGradient id="paint_card_hover_sparkle" x1="19.0464" y1="40.0309" x2="69.4464" y2="40.0309" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFB352"/><stop offset="0.5" stopColor="#FC6839"/><stop offset="1" stopColor="#EB2E24"/>
                </linearGradient>
              </defs>
            </svg>
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-gray-800 text-white text-[11px] whitespace-nowrap opacity-0 group-hover/sparkle:opacity-100 transition-opacity pointer-events-none">
            Change content
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-brand-500 !border-brand-500"
        style={{ width: 12, height: 12 }}
      />

      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 w-2 h-full cursor-ew-resize nodrag nopan group/resize"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          resizing.current = { startX: e.clientX, startW: width }
        }}
      />
    </div>
    </>
  )
}
