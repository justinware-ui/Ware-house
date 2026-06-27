'use client'

import { useState, useEffect } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { ExternalLink, ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { HotspotPage } from './HotspotBuilderModal'
import { DescriptionTooltipPopup } from './nodes/AnswerInlineImage'
import { normalizeAnswerImage, type AnswerImage } from './nodes/answerImage'

// Walk graph from startNode following edges to produce an ordered step list
function getOrderedSteps(nodes: Node[], edges: Edge[]): Node[] {
  const startNode = nodes.find((n) => n.type === 'startNode')
  if (!startNode) return nodes.filter((n) => n.type !== 'startNode')

  const steps: Node[] = []
  let current: Node | undefined = startNode
  const visited = new Set<string>()

  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    if (current.type !== 'startNode') steps.push(current)
    const nextEdge = edges.find((e) => e.source === current!.id)
    current = nextEdge ? nodes.find((n) => n.id === nextEdge.target) : undefined
  }

  return steps
}

interface Props {
  nodes: Node[]
  edges: Edge[]
  onClose: () => void
}

export default function PrototypePreviewModal({ nodes, edges, onClose }: Props) {
  const steps = getOrderedSteps(nodes, edges)
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setStepIdx((i) => Math.min(steps.length - 1, i + 1))
      if (e.key === 'ArrowLeft') setStepIdx((i) => Math.max(0, i - 1))
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose, steps.length])

  if (steps.length === 0) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80" onClick={onClose}>
        <div className="bg-white rounded-2xl px-10 py-10 text-center shadow-2xl max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-gray-700 font-medium mb-2">Nothing to preview yet</p>
          <p className="text-gray-400 text-sm mb-6">Add nodes to the canvas and connect them to build a flow.</p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: '#FC6839' }}>
            Close
          </button>
        </div>
      </div>
    )
  }

  const step = steps[stepIdx]

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col" style={{ backgroundColor: '#0e0e0e' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-white text-sm font-semibold">Prototype Preview</span>
          <span className="text-white/40 text-sm">{stepIdx + 1} / {steps.length}</span>
        </div>

        {/* Step indicator dots */}
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStepIdx(i)}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === stepIdx ? 20 : 8,
                height: 8,
                backgroundColor: i === stepIdx ? '#FC6839' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>

        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/15 transition-colors"
        >
          <X size={18} className="text-white" />
        </button>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center min-h-0 relative px-16">
        <StepContent node={step} />

        {/* Prev arrow */}
        {stepIdx > 0 && (
          <button
            onClick={() => setStepIdx((i) => i - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
        )}

        {/* Next arrow */}
        {stepIdx < steps.length - 1 && (
          <button
            onClick={() => setStepIdx((i) => i + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        )}
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-center gap-3 px-6 py-4 shrink-0 border-t border-white/10">
        <button
          disabled={stepIdx === 0}
          onClick={() => setStepIdx((i) => i - 1)}
          className="px-6 py-2.5 rounded-full text-sm font-semibold text-white border border-white/25 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          Back
        </button>
        {stepIdx < steps.length - 1 ? (
          <button
            onClick={() => setStepIdx((i) => i + 1)}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#FC6839' }}
          >
            Next
          </button>
        ) : (
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#FC6839' }}
          >
            Finish
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Step renderers ───────────────────────────────────────────────────────────

function StepContent({ node }: { node: Node }) {
  if (node.type === 'demoCardNode') return <DemoStep node={node} />
  if (node.type === 'fullScreenDialogNode') return <FullScreenStep node={node} />
  if (node.type === 'ctaNode') return <QuestionStep node={nodeToQuestionPreview(node)} />
  if (node.type === 'hotspotNode') return <HotspotStep node={node} />
  if (node.type === 'questionNode') return <QuestionStep node={node} />
  return <p className="text-white/40 text-sm">Unknown step type: {node.type}</p>
}

function nodeToQuestionPreview(node: Node): Node {
  if (node.type !== 'ctaNode') return node
  const { question, answers } = node.data as { question?: string; answers?: string[] }
  const base = Date.now()
  const options = (answers ?? []).map((value, i) => ({ id: base + i, value }))
  return { ...node, data: { question, options } }
}

function DemoStep({ node }: { node: Node }) {
  const { title, preview } = node.data as { title?: string; preview?: string }
  const [loadFailed, setLoadFailed] = useState(false)

  // Reset failed state when preview URL changes
  useEffect(() => { setLoadFailed(false) }, [preview])

  if (!preview) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-white text-lg font-semibold">{title || 'Demo'}</p>
        <p className="text-white/40 text-sm">No preview URL attached to this demo card.</p>
      </div>
    )
  }

  if (loadFailed) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-white text-lg font-semibold">{title || 'Demo'}</p>
        <p className="text-white/40 text-sm mb-1">This demo can't be embedded due to browser restrictions.</p>
        <a
          href={preview}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#FC6839' }}
        >
          <ExternalLink size={16} />
          Open in new tab
        </a>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <p className="text-white/50 text-xs text-center py-2 shrink-0">{title}</p>
      <iframe
        key={preview}
        src={preview}
        title={title}
        className="flex-1 w-full border-0 rounded-xl overflow-hidden"
        allow="autoplay; fullscreen"
        onError={() => setLoadFailed(true)}
        onLoad={(e) => {
          try {
            if (e.currentTarget.contentDocument?.title === '') setLoadFailed(true)
          } catch {
            // cross-origin loaded fine
          }
        }}
      />
    </div>
  )
}

function FullScreenStep({ node }: { node: Node }) {
  const { header, message, buttons, buttonUrls } = node.data as {
    header?: string
    message?: string
    buttons?: string[]
    buttonUrls?: string[]
  }
  const validButtons = (buttons ?? []).filter((b) => b.trim())

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl px-10 py-10">
      <p className="text-xl font-bold text-gray-900 mb-4">{header || 'Welcome'}</p>
      <p className="text-sm text-gray-700 leading-relaxed mb-8 whitespace-pre-wrap">
        {message || 'No message content.'}
      </p>
      <div className="flex justify-end gap-3">
        {validButtons.length > 0
          ? validButtons.map((btn, i) => (
              <a
                key={i}
                href={buttonUrls?.[i] || '#'}
                target={buttonUrls?.[i] ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#FC6839' }}
              >
                {btn}
              </a>
            ))
          : (
            <button
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: '#FC6839' }}
            >
              Next
            </button>
          )}
      </div>
    </div>
  )
}

function HotspotStep({ node }: { node: Node }) {
  const { screenshotName, pages } = node.data as {
    screenshotName?: string
    pages?: HotspotPage[]
  }
  const firstImage = pages?.[0]?.imageSrc

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
      <p className="text-white font-semibold text-lg shrink-0">
        {screenshotName || 'Screengrab & Hotspots'}
      </p>
      {firstImage ? (
        <img
          src={firstImage}
          alt={screenshotName}
          className="rounded-xl shadow-2xl object-contain w-full"
          style={{ maxHeight: 'calc(100vh - 240px)' }}
        />
      ) : (
        <div
          className="flex items-center justify-center w-full rounded-xl border-2 border-dashed border-white/20"
          style={{ height: 300 }}
        >
          <p className="text-white/40 text-sm">No screenshot uploaded</p>
        </div>
      )}
    </div>
  )
}

function QuestionStep({ node }: { node: Node }) {
  const { question, options } = node.data as {
    question?: string
    options?: { id: number; value: string; description?: string; descriptionImage?: AnswerImage }[]
  }
  const previewOptions = (options ?? []).filter(
    (o) => o.value.trim() || o.description?.trim() || o.descriptionImage,
  )

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl px-10 py-10">
      <p className="text-lg font-semibold text-gray-900 mb-8">
        {question || 'Enter your question here'}
      </p>
      <div className="flex flex-col gap-3">
        {previewOptions.length > 0 ? previewOptions.map((option) => {
          const tip = option.description?.trim()
          const img = normalizeAnswerImage(option.descriptionImage)
          const hasTooltip = !!(tip || img)
          return (
            <button
              key={option.id}
              className={`w-full text-left px-5 py-4 rounded-xl border border-gray-200 text-sm text-gray-800 hover:border-[#FC6839] hover:bg-orange-50 transition-colors relative ${hasTooltip ? 'group/answer' : ''}`}
            >
              {option.value.trim() ? option.value : null}
              {hasTooltip && (
                <DescriptionTooltipPopup description={tip} image={img} />
              )}
            </button>
          )
        }) : (
          <>
            <div className="w-full px-5 py-4 rounded-xl border border-gray-200 text-sm text-gray-300">Answer 1</div>
            <div className="w-full px-5 py-4 rounded-xl border border-gray-200 text-sm text-gray-300">Answer 2</div>
          </>
        )}
      </div>
    </div>
  )
}

