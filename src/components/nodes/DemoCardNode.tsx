import { X } from 'lucide-react'
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import thumbTableHero from '../../assets/thumb-table-hero.svg'
import thumbContent from '../../assets/thumb-content.svg'
import { useMemo, useState, useEffect, useRef } from 'react'
import PreviewModal from '../PreviewModal'

const thumbnails = [thumbTableHero, thumbContent]

function getDemoThumb(title: string) {
  let hash = 0
  for (let i = 0; i < title.length; i++) hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0
  return thumbnails[Math.abs(hash) % thumbnails.length]
}

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

  const resolvedThumb = useMemo(
    () => thumb || getDemoThumb(title),
    [thumb, title],
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
      className="group/card relative flex items-center bg-white shadow-sm transition-[box-shadow,border-color] duration-200"
      style={{ width, paddingLeft: 16, paddingRight: 16, paddingTop: 32, paddingBottom: 32, borderRadius: 8, border: '1px solid #D0CBC6', gap: 12 }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-brand-500 !border-brand-500"
        style={{ width: 12, height: 12 }}
      />

      {/* Drag handle */}
      <svg width="16" height="16" viewBox="16 27 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <path d="M21.9993 40.3334C21.6327 40.3334 21.3189 40.203 21.058 39.9421C20.7967 39.6807 20.666 39.3667 20.666 39.0001C20.666 38.6334 20.7967 38.3194 21.058 38.0581C21.3189 37.7972 21.6327 37.6667 21.9993 37.6667C22.366 37.6667 22.68 37.7972 22.9413 38.0581C23.2022 38.3194 23.3327 38.6334 23.3327 39.0001C23.3327 39.3667 23.2022 39.6807 22.9413 39.9421C22.68 40.203 22.366 40.3334 21.9993 40.3334ZM25.9993 40.3334C25.6327 40.3334 25.3189 40.203 25.058 39.9421C24.7967 39.6807 24.666 39.3667 24.666 39.0001C24.666 38.6334 24.7967 38.3194 25.058 38.0581C25.3189 37.7972 25.6327 37.6667 25.9993 37.6667C26.366 37.6667 26.68 37.7972 26.9413 38.0581C27.2022 38.3194 27.3327 38.6334 27.3327 39.0001C27.3327 39.3667 27.2022 39.6807 26.9413 39.9421C26.68 40.203 26.366 40.3334 25.9993 40.3334ZM21.9993 36.3334C21.6327 36.3334 21.3189 36.2027 21.058 35.9414C20.7967 35.6805 20.666 35.3667 20.666 35.0001C20.666 34.6334 20.7967 34.3194 21.058 34.0581C21.3189 33.7972 21.6327 33.6667 21.9993 33.6667C22.366 33.6667 22.68 33.7972 22.9413 34.0581C23.2022 34.3194 23.3327 34.6334 23.3327 35.0001C23.3327 35.3667 23.2022 35.6805 22.9413 35.9414C22.68 36.2027 22.366 36.3334 21.9993 36.3334ZM25.9993 36.3334C25.6327 36.3334 25.3189 36.2027 25.058 35.9414C24.7967 35.6805 24.666 35.3667 24.666 35.0001C24.666 34.6334 24.7967 34.3194 25.058 34.0581C25.3189 33.7972 25.6327 33.6667 25.9993 33.6667C26.366 33.6667 26.68 33.7972 26.9413 34.0581C27.2022 34.3194 27.3327 34.6334 27.3327 35.0001C27.3327 35.3667 27.2022 35.6805 26.9413 35.9414C26.68 36.2027 26.366 36.3334 25.9993 36.3334ZM21.9993 32.3334C21.6327 32.3334 21.3189 32.2027 21.058 31.9414C20.7967 31.6805 20.666 31.3667 20.666 31.0001C20.666 30.6334 20.7967 30.3196 21.058 30.0587C21.3189 29.7974 21.6327 29.6667 21.9993 29.6667C22.366 29.6667 22.68 29.7974 22.9413 30.0587C23.2022 30.3196 23.3327 30.6334 23.3327 31.0001C23.3327 31.3667 23.2022 31.6805 22.9413 31.9414C22.68 32.2027 22.366 32.3334 21.9993 32.3334ZM25.9993 32.3334C25.6327 32.3334 25.3189 32.2027 25.058 31.9414C24.7967 31.6805 24.666 31.3667 24.666 31.0001C24.666 30.6334 24.7967 30.3196 25.058 30.0587C25.3189 29.7974 25.6327 29.6667 25.9993 29.6667C26.366 29.6667 26.68 29.7974 26.9413 30.0587C27.2022 30.3196 27.3327 30.6334 27.3327 31.0001C27.3327 31.3667 27.2022 31.6805 26.9413 31.9414C26.68 32.2027 26.366 32.3334 25.9993 32.3334Z" fill="#8D8A87"/>
      </svg>

      {/* Thumbnail */}
      <img src={resolvedThumb} alt="" className="shrink-0 object-cover" style={{ width: 31, height: 31, borderRadius: 4 }} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: '#172537' }}>{title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs" style={{ color: '#6F6F6F' }}>{creator}</span>
          <span className="text-xs font-semibold" style={{ color: '#FC6839' }}>Show more</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center shrink-0" style={{ gap: 10, marginRight: 8 }}>
        <button className="hover:opacity-70 transition-opacity nodrag nopan" onClick={() => preview && setShowPreview(true)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <mask id={`mask_eye_node_${id}`} style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="18" height="18">
              <rect width="18" height="18" fill="#D9D9D9"/>
            </mask>
            <g mask={`url(#mask_eye_node_${id})`}>
              <path d="M8.99961 12C9.93711 12 10.7341 11.672 11.3906 11.016C12.0466 10.3595 12.3746 9.5625 12.3746 8.625C12.3746 7.6875 12.0466 6.8905 11.3906 6.234C10.7341 5.578 9.93711 5.25 8.99961 5.25C8.06211 5.25 7.26511 5.578 6.60861 6.234C5.95261 6.8905 5.62461 7.6875 5.62461 8.625C5.62461 9.5625 5.95261 10.3595 6.60861 11.016C7.26511 11.672 8.06211 12 8.99961 12ZM8.99961 10.65C8.43711 10.65 7.95911 10.453 7.56561 10.059C7.17161 9.6655 6.97461 9.1875 6.97461 8.625C6.97461 8.0625 7.17161 7.58425 7.56561 7.19025C7.95911 6.79675 8.43711 6.6 8.99961 6.6C9.56211 6.6 10.0404 6.79675 10.4344 7.19025C10.8279 7.58425 11.0246 8.0625 11.0246 8.625C11.0246 9.1875 10.8279 9.6655 10.4344 10.059C10.0404 10.453 9.56211 10.65 8.99961 10.65ZM8.99961 14.25C7.26211 14.25 5.67461 13.7908 4.23711 12.8723C2.79961 11.9533 1.71211 10.7125 0.974609 9.15C0.937109 9.0875 0.912109 9.00925 0.899609 8.91525C0.887109 8.82175 0.880859 8.725 0.880859 8.625C0.880859 8.525 0.887109 8.428 0.899609 8.334C0.912109 8.2405 0.937109 8.1625 0.974609 8.1C1.71211 6.5375 2.79961 5.297 4.23711 4.3785C5.67461 3.4595 7.26211 3 8.99961 3C10.7371 3 12.3246 3.4595 13.7621 4.3785C15.1996 5.297 16.2871 6.5375 17.0246 8.1C17.0621 8.1625 17.0871 8.2405 17.0996 8.334C17.1121 8.428 17.1184 8.525 17.1184 8.625C17.1184 8.725 17.1121 8.82175 17.0996 8.91525C17.0871 9.00925 17.0621 9.0875 17.0246 9.15C16.2871 10.7125 15.1996 11.9533 13.7621 12.8723C12.3246 13.7908 10.7371 14.25 8.99961 14.25ZM8.99961 12.75C10.4121 12.75 11.7091 12.378 12.8906 11.634C14.0716 10.8905 14.9746 9.8875 15.5996 8.625C14.9746 7.3625 14.0716 6.35925 12.8906 5.61525C11.7091 4.87175 10.4121 4.5 8.99961 4.5C7.58711 4.5 6.29011 4.87175 5.10861 5.61525C3.92761 6.35925 3.02461 7.3625 2.39961 8.625C3.02461 9.8875 3.92761 10.8905 5.10861 11.634C6.29011 12.378 7.58711 12.75 8.99961 12.75Z" fill="#293748"/>
            </g>
          </svg>
        </button>
      </div>

      {/* Close button */}
      <button
        onClick={removeNode}
        className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white hover:bg-gray-200 border-2 border-white flex items-center justify-center transition-colors shadow-sm z-20 nodrag nopan"
      >
        <X size={14} className="text-gray-600" />
      </button>

      {/* Change content sparkle — visible on card hover */}
      <div className="absolute left-1/2 -translate-x-1/2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 nodrag nopan"
        style={{ top: 'calc(100% + 16px)' }}
      >
        <div className="relative group/sparkle">
          <button
            onClick={(e) => {
              e.stopPropagation()
              document.dispatchEvent(new CustomEvent('open-replace-popover', { detail: { nodeId: id, demoId: demoId || '', title } }))
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
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
            Change Content
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
