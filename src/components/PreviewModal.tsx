import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ExternalLink } from 'lucide-react'

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
        className="relative z-10 w-[90vw] max-w-5xl h-[80vh] rounded-2xl overflow-hidden bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
          <span className="text-sm font-semibold text-gray-800 truncate">{title || 'Preview'}</span>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={16} className="text-gray-600" />
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X size={18} className="text-gray-600" />
            </button>
          </div>
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
