'use client'

import { AlignJustify, Bold, ChevronDown, Italic, Pilcrow, Underline } from 'lucide-react'

export type FormatOption = 'bold' | 'italic' | 'underline' | 'align' | 'image' | 'paragraph'

const AddPhotoIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3.538 13.666c-.337 0-.622-.117-.855-.35a1.163 1.163 0 0 1-.35-.855V3.538c0-.337.117-.622.35-.855.234-.234.518-.35.855-.35H8.538v1H3.538a.2.2 0 0 0-.147.058.2.2 0 0 0-.058.147v8.923a.2.2 0 0 0 .058.148.2.2 0 0 0 .147.057h8.923a.2.2 0 0 0 .148-.057.2.2 0 0 0 .057-.148V7.461h1v4.999c0 .337-.117.622-.35.856-.234.233-.518.35-.856.35H3.538ZM4.256 11.128h7.487l-2.327-3.103-2 2.597-1.417-1.802-1.743 2.308ZM11.333 6V4.666H10V3.666h1.333V2.333h1v1.333h1.334v1h-1.334V6h-1Z" fill="currentColor"/>
  </svg>
)

export default function FormattingToolbar({
  activeFormats,
  onToggle,
  disabledKeys,
  sparkleId = 'toolbar',
}: {
  activeFormats: Set<FormatOption>
  onToggle: (fmt: FormatOption) => void
  disabledKeys?: Set<FormatOption>
  sparkleId?: string
}) {
  const tools: {
    key: FormatOption
    icon?: typeof Bold
    custom?: 'addPhoto'
    label: string
    hasDropdown?: boolean
  }[] = [
    { key: 'bold', icon: Bold, label: 'Bold' },
    { key: 'italic', icon: Italic, label: 'Italic' },
    { key: 'underline', icon: Underline, label: 'Underline' },
    { key: 'align', icon: AlignJustify, label: 'Alignment' },
    { key: 'image', custom: 'addPhoto', label: 'Add Image' },
    { key: 'paragraph', icon: Pilcrow, label: 'Paragraph Format', hasDropdown: true },
  ]

  return (
    <div
      data-toolbar
      className="absolute -top-14 left-1/2 -translate-x-1/2 z-10 flex items-center rounded-full shadow-lg border border-gray-200 px-2 py-1.5 gap-0.5"
      style={{ backgroundColor: '#F7F4F2' }}
    >
      {tools.map(({ key, icon: Icon, custom, label, hasDropdown }) => {
        const isDisabled = disabledKeys?.has(key)
        return (
          <div key={key} className="relative group/tool nodrag nopan">
            <button
              type="button"
              onClick={() => !isDisabled && onToggle(key)}
              onMouseDown={(e) => e.preventDefault()}
              disabled={isDisabled}
              className={`p-1.5 rounded transition-colors flex items-center gap-0.5 ${
                isDisabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : activeFormats.has(key)
                    ? 'text-brand-500'
                    : 'text-gray-600 hover:text-brand-500'
              }`}
            >
              {custom === 'addPhoto' ? (
                <AddPhotoIcon />
              ) : Icon ? (
                <Icon size={16} strokeWidth={2} />
              ) : null}
              {hasDropdown && <ChevronDown size={10} />}
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-gray-800 text-white text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover/tool:opacity-100 transition-opacity">
              {label}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
            </div>
          </div>
        )
      })}

      <div className="w-px h-6 bg-gray-200 mx-1 nodrag nopan" />
      <button
        type="button"
        className="p-1.5 rounded text-brand-500 hover:bg-brand-50 transition-colors nodrag nopan"
        onMouseDown={(e) => e.preventDefault()}
      >
        <svg width="18" height="18" viewBox="2 10 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.4273 11.1084C11.465 10.9066 11.7551 10.9066 11.7928 11.1084L12.2104 13.3465C12.7446 16.2092 14.9911 18.4488 17.8625 18.9814L20.1073 19.3978C20.3098 19.4354 20.3098 19.7246 20.1073 19.7622L17.8625 20.1785C14.9911 20.7111 12.7446 22.9508 12.2104 25.8135L11.7928 28.0515C11.7551 28.2534 11.465 28.2534 11.4273 28.0515L11.0097 25.8135C10.4754 22.9508 8.22901 20.7111 5.35761 20.1785L3.11281 19.7622C2.91031 19.7246 2.91031 19.4354 3.11281 19.3978L5.35761 18.9814C8.22901 18.4488 10.4754 16.2092 11.0097 13.3465L11.4273 11.1084Z" fill={`url(#paint0_${sparkleId})`}/>
          <path d="M19.1688 23.5301C19.1834 23.452 19.2956 23.452 19.3102 23.5301L19.4717 24.3958C19.6784 25.5032 20.5473 26.3695 21.6581 26.5755L22.5264 26.7366C22.6047 26.7511 22.6047 26.863 22.5264 26.8775L21.6581 27.0386C20.5473 27.2446 19.6784 28.111 19.4717 29.2184L19.3102 30.0841C19.2956 30.1622 19.1834 30.1622 19.1688 30.0841L19.0072 29.2184C18.8006 28.111 17.9316 27.2446 16.8209 27.0386L15.9525 26.8775C15.8742 26.863 15.8742 26.7511 15.9525 26.7366L16.8209 26.5755C17.9316 26.3695 18.8006 25.5032 19.0072 24.3958L19.1688 23.5301Z" fill={`url(#paint1_${sparkleId})`}/>
          <defs>
            <linearGradient id={`paint0_${sparkleId}`} x1="2.96094" y1="21.4548" x2="22.5851" y2="21.4548" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFB352"/><stop offset="0.5" stopColor="#FC6839"/><stop offset="1" stopColor="#EB2E24"/>
            </linearGradient>
            <linearGradient id={`paint1_${sparkleId}`} x1="2.96094" y1="21.4548" x2="22.5851" y2="21.4548" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFB352"/><stop offset="0.5" stopColor="#FC6839"/><stop offset="1" stopColor="#EB2E24"/>
            </linearGradient>
          </defs>
        </svg>
      </button>
    </div>
  )
}
