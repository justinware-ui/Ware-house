import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface DiscoveryQuestionData {
  type: 'discovery'
  question: string
  answers: string[]
}

interface FullScreenDialogData {
  type: 'fullscreen'
  header: string
  message: string
  buttons: string[]
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
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {data.type === 'discovery' ? (
          <DiscoveryPreview question={data.question} answers={data.answers} />
        ) : (
          <FullScreenPreview header={data.header} message={data.message} buttons={data.buttons} />
        )}
      </div>
    </div>,
    document.body,
  )
}

function DiscoveryPreview({ question, answers }: { question: string; answers: string[] }) {
  return (
    <div className="px-10 py-10">
      <p className="text-lg font-semibold text-gray-900 mb-8">
        {question || 'What do you like better?'}
      </p>
      <div className="flex flex-col gap-3">
        {answers.filter((a) => a.trim()).map((answer, i) => (
          <button
            key={i}
            className="w-full text-left px-5 py-4 rounded-xl border border-gray-200 text-sm text-gray-800 hover:border-[#FC6839] hover:bg-orange-50 transition-colors cursor-pointer"
          >
            {answer}
          </button>
        ))}
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

function FullScreenPreview({ header, message, buttons }: { header: string; message: string; buttons: string[] }) {
  return (
    <div className="px-10 py-10">
      <p className="text-xl font-bold text-gray-900 mb-4">
        {header || 'Welcome'}
      </p>
      <p className="text-sm text-gray-700 leading-relaxed mb-8 whitespace-pre-wrap">
        {message || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'}
      </p>
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
