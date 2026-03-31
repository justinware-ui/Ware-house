import { X } from 'lucide-react'
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import thumbTableHero from '../../assets/thumb-table-hero.svg'
import thumbContent from '../../assets/thumb-content.svg'
import { useMemo, useState, useEffect, useRef } from 'react'

const thumbnails = [thumbTableHero, thumbContent]

const MIN_WIDTH = 340

export default function DemoCardNode({ id, data }: NodeProps) {
  const { title = 'Demo title', creator = 'Demo creator', thumb } = data as {
    title?: string
    creator?: string
    thumb?: string
  }
  const { setNodes, setEdges } = useReactFlow()
  const [width, setWidth] = useState(MIN_WIDTH)
  const [favorited, setFavorited] = useState(false)
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
    <div
      className="relative flex items-center gap-3 px-3 py-7 rounded-xl border border-[#3D3834] bg-[#302C28] shadow-sm"
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
        <p className="text-sm font-semibold text-[#F5F0EB] truncate">{title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[#A8A29E]">{creator}</span>
          <span className="text-xs text-brand-500 font-semibold">Show more</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button className="hover:opacity-70 transition-opacity">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <mask id={`mask_eye_node_${id}`} style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
              <rect width="20" height="20" fill="#D9D9D9"/>
            </mask>
            <g mask={`url(#mask_eye_node_${id})`}>
              <path d="M9.99935 13.3334C11.041 13.3334 11.9266 12.9689 12.656 12.24C13.3849 11.5106 13.7493 10.625 13.7493 9.58337C13.7493 8.54171 13.3849 7.65615 12.656 6.92671C11.9266 6.19782 11.041 5.83337 9.99935 5.83337C8.95768 5.83337 8.07213 6.19782 7.34268 6.92671C6.61379 7.65615 6.24935 8.54171 6.24935 9.58337C6.24935 10.625 6.61379 11.5106 7.34268 12.24C8.07213 12.9689 8.95768 13.3334 9.99935 13.3334ZM9.99935 11.8334C9.37435 11.8334 8.84324 11.6145 8.40602 11.1767C7.96824 10.7395 7.74935 10.2084 7.74935 9.58337C7.74935 8.95837 7.96824 8.42698 8.40602 7.98921C8.84324 7.55198 9.37435 7.33337 9.99935 7.33337C10.6243 7.33337 11.1557 7.55198 11.5935 7.98921C12.0307 8.42698 12.2493 8.95837 12.2493 9.58337C12.2493 10.2084 12.0307 10.7395 11.5935 11.1767C11.1557 11.6145 10.6243 11.8334 9.99935 11.8334ZM9.99935 15.8334C8.06879 15.8334 6.3049 15.3231 4.70768 14.3025C3.11046 13.2814 1.90213 11.9028 1.08268 10.1667C1.04102 10.0973 1.01324 10.0103 0.999349 9.90587C0.98546 9.80199 0.978516 9.69448 0.978516 9.58337C0.978516 9.47226 0.98546 9.36449 0.999349 9.26004C1.01324 9.15615 1.04102 9.06949 1.08268 9.00004C1.90213 7.26393 3.11046 5.8856 4.70768 4.86504C6.3049 3.84393 8.06879 3.33337 9.99935 3.33337C11.9299 3.33337 13.6938 3.84393 15.291 4.86504C16.8882 5.8856 18.0966 7.26393 18.916 9.00004C18.9577 9.06949 18.9855 9.15615 18.9993 9.26004C19.0132 9.36449 19.0202 9.47226 19.0202 9.58337C19.0202 9.69448 19.0132 9.80199 18.9993 9.90587C18.9855 10.0103 18.9577 10.0973 18.916 10.1667C18.0966 11.9028 16.8882 13.2814 15.291 14.3025C13.6938 15.3231 11.9299 15.8334 9.99935 15.8334ZM9.99935 14.1667C11.5688 14.1667 13.0099 13.7534 14.3227 12.9267C15.6349 12.1006 16.6382 10.9862 17.3327 9.58337C16.6382 8.1806 15.6349 7.06587 14.3227 6.23921C13.0099 5.4131 11.5688 5.00004 9.99935 5.00004C8.4299 5.00004 6.98879 5.4131 5.67602 6.23921C4.36379 7.06587 3.36046 8.1806 2.66602 9.58337C3.36046 10.9862 4.36379 12.1006 5.67602 12.9267C6.98879 13.7534 8.4299 14.1667 9.99935 14.1667Z" fill="#F5F0EB"/>
            </g>
          </svg>
        </button>
        <button
          className="relative group/fav flex items-center justify-center w-8 h-8 transition-all nodrag nopan"
          onClick={() => setFavorited((f) => !f)}
        >
          <div className="absolute inset-0 rounded-full bg-[#FB56B9]/15 opacity-0 group-hover/fav:opacity-100 transition-opacity" />
          <svg width="20" height="20" viewBox="10 10 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-[1]">
            {favorited ? (
              <path d="M20 14.664C20.872 13.648 22.208 13 23.6 13C26.064 13 28 14.928 28 17.4C28 20.416 25.28 22.888 21.16 26.624L20 27.68L18.84 26.624C14.72 22.888 12 20.416 12 17.4C12 14.928 13.936 13 16.4 13C17.792 13 19.128 13.648 20 14.664Z" fill="#FB56B9"/>
            ) : (
              <path fillRule="evenodd" clipRule="evenodd" d="M20.0818 25.4418L20.0852 25.4387C22.1767 23.5422 23.7835 22.0785 24.8862 20.7294C25.9713 19.4019 26.4 18.382 26.4 17.4C26.4 15.8136 25.1823 14.6 23.6 14.6C22.6917 14.6 21.7934 15.0311 21.2141 15.7061L20 17.1207L18.7859 15.7061C18.2066 15.0311 17.3083 14.6 16.4 14.6C14.8177 14.6 13.6 15.8136 13.6 17.4C13.6 18.382 14.0287 19.4019 15.1138 20.7294C16.2165 22.0785 17.8233 23.5422 19.9148 25.4387L19.9171 25.4408L20 25.52L20.0818 25.4418ZM20 27.68L18.84 26.624C14.72 22.888 12 20.416 12 17.4C12 14.928 13.936 13 16.4 13C17.3006 13 18.1777 13.2712 18.9209 13.7379C19.3265 13.9925 19.6922 14.3053 20 14.664C20.3078 14.3053 20.6735 13.9925 21.0791 13.7379C21.8223 13.2712 22.6994 13 23.6 13C26.064 13 28 14.928 28 17.4C28 20.416 25.28 22.888 21.16 26.624L20 27.68Z" className="fill-[#6F6F6F] group-hover/fav:fill-[#FB56B9]" />
            )}
          </svg>
        </button>
      </div>

      {/* Close button */}
      <button
        onClick={removeNode}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#3D3834] hover:bg-[#4A4540] flex items-center justify-center transition-colors"
      >
        <X size={12} className="text-[#A8A29E]" />
      </button>

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
  )
}
