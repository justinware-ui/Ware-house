import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CircleHelp } from 'lucide-react'

interface PreviewImage {
  src: string
  float?: 'left' | 'right' | 'none'
}

interface DiscoveryQuestionData {
  type: 'discovery'
  question: string
  answers: string[]
  tooltips?: Record<number, string>
  answerImages?: Record<number, PreviewImage>
}

interface FullScreenDialogData {
  type: 'fullscreen' | 'cta'
  header: string
  message: string
  buttons: string[]
  buttonUrls?: string[]
  messageImage?: PreviewImage
}

type InteractionData = DiscoveryQuestionData | FullScreenDialogData

interface InteractionPreviewModalProps {
  data: InteractionData
  onClose: () => void
}

export default function InteractionPreviewModal({ data, onClose }: InteractionPreviewModalProps) {
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
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative z-10 w-[90vw] max-w-[720px] rounded-2xl overflow-hidden bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="group/close absolute top-4 right-4 flex items-center justify-center transition-all z-10"
          style={{ width: 32, height: 32, borderRadius: 16 }}
        >
          <div className="absolute inset-0 rounded-full opacity-0 group-hover/close:opacity-100 transition-opacity" style={{ backgroundColor: 'rgba(115,113,111,0.15)' }} />
          <svg width="20" height="20" viewBox="10 10 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative">
            <mask id="mask_close_interact_preview" style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="10" y="10" width="20" height="20">
              <rect x="10" y="10" width="20" height="20" fill="#D9D9D9"/>
            </mask>
            <g mask="url(#mask_close_interact_preview)">
              <path d="M20.0002 21.1668L15.9168 25.2502C15.7641 25.4029 15.5696 25.4793 15.3335 25.4793C15.0974 25.4793 14.9029 25.4029 14.7502 25.2502C14.5974 25.0974 14.521 24.9029 14.521 24.6668C14.521 24.4307 14.5974 24.2363 14.7502 24.0835L18.8335 20.0002L14.7502 15.9168C14.5974 15.7641 14.521 15.5696 14.521 15.3335C14.521 15.0974 14.5974 14.9029 14.7502 14.7502C14.9029 14.5974 15.0974 14.521 15.3335 14.521C15.5696 14.521 15.7641 14.5974 15.9168 14.7502L20.0002 18.8335L24.0835 14.7502C24.2363 14.5974 24.4307 14.521 24.6668 14.521C24.9029 14.521 25.0974 14.5974 25.2502 14.7502C25.4029 14.9029 25.4793 15.0974 25.4793 15.3335C25.4793 15.5696 25.4029 15.7641 25.2502 15.9168L21.1668 20.0002L25.2502 24.0835C25.4029 24.2363 25.4793 24.4307 25.4793 24.6668C25.4793 24.9029 25.4029 25.0974 25.2502 25.2502C25.0974 25.4029 24.9029 25.4793 24.6668 25.4793C24.4307 25.4793 24.2363 25.4029 24.0835 25.2502L20.0002 21.1668Z" fill="#293748"/>
            </g>
          </svg>
        </button>

        {data.type === 'discovery' ? (
          <DiscoveryPreview question={data.question} answers={data.answers} tooltips={data.tooltips} answerImages={data.answerImages} />
        ) : (
          <FullScreenPreview header={data.header} message={data.message} buttons={data.buttons} buttonUrls={data.buttonUrls} messageImage={data.messageImage} />
        )}
      </div>
    </div>,
    document.body,
  )
}

function DiscoveryPreview({ question, answers, tooltips, answerImages }: { question: string; answers: string[]; tooltips?: Record<number, string>; answerImages?: Record<number, PreviewImage> }) {
  return (
    <div className="px-10 py-10">
      <p className="text-lg font-semibold text-gray-900 mb-8">
        {question || 'What do you like better?'}
      </p>
      <div className="flex flex-col gap-3">
        {answers.filter((a) => a.trim()).map((answer, i) => {
          const tip = tooltips?.[i]?.trim()
          const img = answerImages?.[i]
          return (
            <button
              key={i}
              className="w-full text-left px-5 py-4 rounded-xl border border-gray-200 text-sm text-gray-800 hover:border-[#FC6839] hover:bg-orange-50 transition-colors cursor-pointer"
            >
              {img && (
                <img src={img.src} alt="" className="rounded mb-3 max-h-40 object-contain" />
              )}
              <span className="inline-flex items-center">
                <span>{answer}</span>
                {tip && (
                  <span className="relative group/tip inline-flex items-center" style={{ marginLeft: 8 }}>
                    <CircleHelp size={14} className="text-gray-800 cursor-help" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 text-white text-xs opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity shadow-lg whitespace-nowrap" style={{ maxWidth: 320 }}>
                      {tip}
                      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                    </span>
                  </span>
                )}
              </span>
            </button>
          )
        })}
        {answers.filter((a) => a.trim()).length === 0 && (
          <>
            <div className="w-full px-5 py-4 rounded-xl border border-gray-200 text-sm text-gray-400">1</div>
            <div className="w-full px-5 py-4 rounded-xl border border-gray-200 text-sm text-gray-400">2</div>
          </>
        )}
      </div>
    </div>
  )
}

function FullScreenPreview({ header, message, buttons, buttonUrls, messageImage }: { header: string; message: string; buttons: string[]; buttonUrls?: string[]; messageImage?: PreviewImage }) {
  return (
    <div className="px-10 py-10">
      <p className="text-xl font-bold text-gray-900 mb-4">
        {header || 'Welcome'}
      </p>
      <div className="text-sm text-gray-700 leading-relaxed mb-8">
        {messageImage && (
          <img
            src={messageImage.src}
            alt=""
            className="rounded max-h-48 object-contain mb-3"
            style={{ float: messageImage.float === 'right' ? 'right' : 'left', marginRight: messageImage.float === 'right' ? 0 : 16, marginLeft: messageImage.float === 'right' ? 16 : 0 }}
          />
        )}
        <span className="whitespace-pre-wrap">
          {message || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'}
        </span>
        {messageImage && <div style={{ clear: 'both' }} />}
      </div>
      <div className="flex justify-end gap-3">
        {buttons.filter((b) => b.trim()).map((btn, i) => (
          <button
            key={i}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-colors hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: '#FC6839' }}
          >
            {btn}
          </button>
        ))}
        {buttons.filter((b) => b.trim()).length === 0 && (
          <button
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-white cursor-pointer"
            style={{ backgroundColor: '#FC6839' }}
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}
