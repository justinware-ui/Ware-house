import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ExternalLink } from 'lucide-react'

interface PreviewModalProps {
  url: string
  title?: string
  onClose: () => void
}

export default function PreviewModal({ url, title, onClose }: PreviewModalProps) {
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-[95vw] max-w-[1440px] rounded-2xl overflow-hidden bg-white shadow-2xl flex flex-col"
        style={{ height: 'calc(90vh - 160px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-transparent shrink-0">
          <span className="text-sm font-semibold text-gray-800 truncate">{title || 'Preview'}</span>
          <button
            onClick={onClose}
            className="group/close relative flex items-center justify-center transition-all"
            style={{ width: 32, height: 32, borderRadius: 16 }}
          >
            <div className="absolute inset-0 rounded-full opacity-0 group-hover/close:opacity-100 transition-opacity" style={{ backgroundColor: 'rgba(115,113,111,0.15)' }} />
            <svg width="20" height="20" viewBox="10 10 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative">
              <mask id="mask_close_preview" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="10" y="10" width="20" height="20">
                <rect x="10" y="10" width="20" height="20" fill="#D9D9D9"/>
              </mask>
              <g mask="url(#mask_close_preview)">
                <path d="M20.0002 21.1668L15.9168 25.2502C15.7641 25.4029 15.5696 25.4793 15.3335 25.4793C15.0974 25.4793 14.9029 25.4029 14.7502 25.2502C14.5974 25.0974 14.521 24.9029 14.521 24.6668C14.521 24.4307 14.5974 24.2363 14.7502 24.0835L18.8335 20.0002L14.7502 15.9168C14.5974 15.7641 14.521 15.5696 14.521 15.3335C14.521 15.0974 14.5974 14.9029 14.7502 14.7502C14.9029 14.5974 15.0974 14.521 15.3335 14.521C15.5696 14.521 15.7641 14.5974 15.9168 14.7502L20.0002 18.8335L24.0835 14.7502C24.2363 14.5974 24.4307 14.521 24.6668 14.521C24.9029 14.521 25.0974 14.5974 25.2502 14.7502C25.4029 14.9029 25.4793 15.0974 25.4793 15.3335C25.4793 15.5696 25.4029 15.7641 25.2502 15.9168L21.1668 20.0002L25.2502 24.0835C25.4029 24.2363 25.4793 24.4307 25.4793 24.6668C25.4793 24.9029 25.4029 25.0974 25.2502 25.2502C25.0974 25.4029 24.9029 25.4793 24.6668 25.4793C24.4307 25.4793 24.2363 25.4029 24.0835 25.2502L20.0002 21.1668Z" fill="#293748"/>
              </g>
            </svg>
          </button>
        </div>

        {loadFailed ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-gray-600 text-sm">This demo can't be embedded directly.</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: '#FF9356' }}
            >
              <ExternalLink size={16} />
              Open demo in new tab
            </a>
          </div>
        ) : (
          <iframe
            src={url}
            title={title || 'Demo preview'}
            className="flex-1 w-full border-0"
            allow="autoplay; fullscreen"
            onError={() => setLoadFailed(true)}
            onLoad={(e) => {
              try {
                const frame = e.currentTarget
                // If we can't access contentDocument, the page likely loaded fine.
                // If it loaded but is blank due to X-Frame-Options, there's no
                // reliable cross-origin way to detect it, but the user will see
                // an empty frame and can use the "open in new tab" button.
                if (frame.contentDocument?.title === '') setLoadFailed(true)
              } catch {
                // Cross-origin — iframe loaded successfully
              }
            }}
          />
        )}
      </div>
    </div>,
    document.body,
  )
}
