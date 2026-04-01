import { useCallback, useRef, useState, useEffect } from 'react'
import AgenticChat, { type SelectedContent } from './AgenticChat'
import type { DemoProposal, ContentMatch } from '../lib/aiEngine'
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type OnConnect,
  BackgroundVariant,
  useReactFlow,
  useUpdateNodeInternals,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import StartNode from './nodes/StartNode'
import InteractionNode from './nodes/InteractionNode'
import CtaNode from './nodes/CtaNode'
import DemoCardNode from './nodes/DemoCardNode'
import FullScreenDialogNode from './nodes/FullScreenDialogNode'
import DeletableEdge from './edges/DeletableEdge'

const edgeTypes = {
  deletable: DeletableEdge,
}

const nodeTypes = {
  startNode: StartNode,
  interactionNode: InteractionNode,
  ctaNode: CtaNode,
  demoCardNode: DemoCardNode,
  fullScreenDialogNode: FullScreenDialogNode,
}

const initialNodes: Node[] = []

const initialEdges: Edge[] = []

let nodeId = Date.now()
const getNodeId = () => `dnd-${++nodeId}`

const nodeTypeMap: Record<string, string> = {
  fullscreen: 'fullScreenDialogNode',
  cta: 'ctaNode',
  discovery: 'ctaNode',
  'card-demos': 'demoCardNode',
  'card-dynamic-tours': 'demoCardNode',
  'card-recommended': 'demoCardNode',
}

function CornerGlow() {
  return (
    <svg className="absolute pointer-events-none" style={{ top: -20, left: -20 }} width="120" height="110" viewBox="0 0 203 186" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.3" filter="url(#filter0_f_corner)">
        <path d="M103.383 141.5C85.3834 141.5 74.8834 136.5 71.8834 134C71.2168 127.167 70.2834 112.6 71.8834 109C73.8834 104.5 165.383 107.5 158.383 117.5C151.383 127.5 125.883 141.5 103.383 141.5Z" fill="#9B50CA"/>
      </g>
      <g opacity="0.3" filter="url(#filter1_f_corner)">
        <path d="M65 90C61.8 97.6 49.6667 97.5 44 96.5V44H122.5C121 49.8333 113.5 61.5 95.5 61.5C73 61.5 69 80.5 65 90Z" fill="#FD6331"/>
      </g>
      <defs>
        <filter id="filter0_f_corner" x="27" y="62.9613" width="175.766" height="122.539" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feGaussianBlur stdDeviation="22" result="effect1_foregroundBlur_corner"/>
        </filter>
        <filter id="filter1_f_corner" x="0" y="0" width="166.5" height="140.979" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feGaussianBlur stdDeviation="22" result="effect1_foregroundBlur_corner2"/>
        </filter>
      </defs>
    </svg>
  )
}

const TOOLBAR_W = 45
const TOOLBAR_H = 178
const TOOLBAR_PAD = 16

function clampPos(x: number, y: number, parentW: number, parentH: number) {
  return {
    x: Math.max(TOOLBAR_PAD, Math.min(x, parentW - TOOLBAR_W - TOOLBAR_PAD)),
    y: Math.max(TOOLBAR_PAD, Math.min(y, parentH - TOOLBAR_H - TOOLBAR_PAD)),
  }
}

function ControlsToolbar() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parent = toolbarRef.current?.parentElement
    if (!parent) return
    const observer = new ResizeObserver(() => {
      setPos((prev) => {
        if (!prev) return null
        const rect = parent.getBoundingClientRect()
        return clampPos(prev.x, prev.y, rect.width, rect.height)
      })
    })
    observer.observe(parent)
    return () => observer.disconnect()
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    dragging.current = true
    const rect = toolbarRef.current!.getBoundingClientRect()
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    e.preventDefault()

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !toolbarRef.current) return
      const parent = toolbarRef.current.parentElement!
      const parentRect = parent.getBoundingClientRect()
      const newX = ev.clientX - parentRect.left - offset.current.x
      const newY = ev.clientY - parentRect.top - offset.current.y
      setPos(clampPos(newX, newY, parentRect.width, parentRect.height))
    }
    const onUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  const style: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y }
    : { right: TOOLBAR_PAD, bottom: TOOLBAR_PAD }

  const iconBtn = 'w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(115,113,111,0.15)] cursor-pointer [&>svg]:translate-x-px'

  return (
    <div
      ref={toolbarRef}
      className="absolute z-10"
      style={style}
      onMouseDown={onMouseDown}
    >
      <div
        className="flex flex-col items-center rounded-full border border-[#D0CBC6] bg-white cursor-grab active:cursor-grabbing"
        style={{ width: 45, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      >
        {/* Lock */}
        <button className={`${iconBtn} mt-2`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2.5 15.5C2.0875 15.5 1.7345 15.3533 1.441 15.0598C1.147 14.7658 1 14.4125 1 14V6.5C1 6.0875 1.147 5.7343 1.441 5.4403C1.7345 5.1468 2.0875 5 2.5 5H3.25V3.5C3.25 2.4625 3.6157 1.578 4.3472 0.8465C5.0782 0.1155 5.9625 -0.25 7 -0.25C8.0375 -0.25 8.922 0.1155 9.6535 0.8465C10.3845 1.578 10.75 2.4625 10.75 3.5V5H11.5C11.9125 5 12.2657 5.1468 12.5597 5.4403C12.8532 5.7343 13 6.0875 13 6.5V14C13 14.4125 12.8532 14.7658 12.5597 15.0598C12.2657 15.3533 11.9125 15.5 11.5 15.5H2.5ZM2.5 14H11.5V6.5H2.5V14ZM7 11.75C7.4125 11.75 7.7657 11.6033 8.0597 11.3098C8.3532 11.0158 8.5 10.6625 8.5 10.25C8.5 9.8375 8.3532 9.4843 8.0597 9.1903C7.7657 8.8968 7.4125 8.75 7 8.75C6.5875 8.75 6.2345 8.8968 5.941 9.1903C5.647 9.4843 5.5 9.8375 5.5 10.25C5.5 10.6625 5.647 11.0158 5.941 11.3098C6.2345 11.6033 6.5875 11.75 7 11.75ZM4.75 5H9.25V3.5C9.25 2.875 9.0312 2.3438 8.5937 1.9063C8.1562 1.4688 7.625 1.25 7 1.25C6.375 1.25 5.8437 1.4688 5.4062 1.9063C4.9687 2.3438 4.75 2.875 4.75 3.5V5Z" fill="#172537"/>
          </svg>
        </button>

        {/* Move */}
        <button className={`${iconBtn} mb-1`}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M13.4 2.25H2.6C1.8508 2.25 1.25 2.8508 1.25 3.6V14.4C1.25 15.1493 1.8508 15.75 2.6 15.75H13.4C14.1493 15.75 14.75 15.1493 14.75 14.4V3.6C14.75 2.8508 14.1493 2.25 13.4 2.25ZM13.25 14.25H2.75V3.75H13.25M8.675 6.3V7.65H7.325V6.3H5.975L8 4.275L10.025 6.3M10.7 11.025V9.675H9.35V8.325H10.7V6.975L12.725 9M6.65 9.675H5.3V11.025L3.275 9L5.3 6.975V8.325H6.65M10.025 11.7L8 13.725L5.975 11.7H7.325V10.35H8.675V11.7" fill="#293748"/>
          </svg>
        </button>

        {/* Divider */}
        <div className="w-[36px] h-px bg-[#D0CBC6]" />

        {/* Minus */}
        <button className={`${iconBtn} mt-1`}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3.5 9.75C3.2875 9.75 3.1092 9.678 2.9652 9.534C2.8217 9.391 2.75 9.213 2.75 9C2.75 8.788 2.8217 8.609 2.9652 8.465C3.1092 8.322 3.2875 8.25 3.5 8.25H12.5C12.7125 8.25 12.8905 8.322 13.034 8.465C13.178 8.609 13.25 8.788 13.25 9C13.25 9.213 13.178 9.391 13.034 9.534C12.8905 9.678 12.7125 9.75 12.5 9.75H3.5Z" fill="#293748"/>
          </svg>
        </button>

        {/* Plus */}
        <button className={`${iconBtn} mb-2`}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2.75 9C2.75 8.788 2.822 8.61 2.966 8.466C3.1095 8.322 3.2875 8.25 3.5 8.25L7.25 8.25L7.25 4.5C7.25 4.288 7.322 4.109 7.466 3.965C7.6095 3.822 7.7875 3.75 8 3.75C8.2125 3.75 8.3907 3.822 8.5347 3.965C8.6782 4.109 8.75 4.288 8.75 4.5L8.75 8.25L12.5 8.25C12.7125 8.25 12.8907 8.322 13.0347 8.466C13.1782 8.61 13.25 8.788 13.25 9C13.25 9.213 13.1782 9.391 13.0347 9.535C12.8907 9.678 12.7125 9.75 12.5 9.75L8.75 9.75L8.75 13.5C8.75 13.713 8.6782 13.891 8.5347 14.034C8.3907 14.178 8.2125 14.25 8 14.25C7.7875 14.25 7.6095 14.178 7.466 14.034C7.322 13.891 7.25 13.713 7.25 13.5L7.25 9.75L3.5 9.75C3.2875 9.75 3.1095 9.678 2.966 9.535C2.822 9.391 2.75 9.213 2.75 9Z" fill="#293748"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

function GhostText({ text, onDone }: { text: string; onDone: () => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(false))
    })
    const timer = setTimeout(onDone, 500)
    return () => { cancelAnimationFrame(raf1); clearTimeout(timer) }
  }, [onDone])

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
      style={{
        opacity: visible ? 0.35 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-24px)',
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
      }}
    >
      <div className="text-sm text-gray-900 max-w-lg text-center px-4 whitespace-pre-wrap">
        {text}
      </div>
    </div>
  )
}

function SparkleIcon({ size = 92 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 89 89" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d_welcome)">
        <rect x="19.0464" y="12.4535" width="50.4" height="50.4" rx="25.2" fill="url(#paint0_linear_welcome)" shapeRendering="crispEdges"/>
        <path d="M43.0806 28.0993C43.1186 27.8951 43.4112 27.8951 43.4492 28.0993L43.8704 30.3629C44.4091 33.2584 46.6746 35.5236 49.5704 36.0623L51.8342 36.4835C52.0384 36.5215 52.0384 36.814 51.8342 36.852L49.5704 37.2731C46.6746 37.8118 44.4091 40.0771 43.8704 42.9726L43.4492 45.2362C43.4112 45.4404 43.1186 45.4404 43.0806 45.2362L42.6595 42.9726C42.1207 40.0771 39.8552 37.8118 36.9595 37.2731L34.6956 36.852C34.4914 36.814 34.4914 36.5215 34.6956 36.4835L36.9595 36.0623C39.8552 35.5236 42.1207 33.2584 42.6595 30.3629L43.0806 28.0993Z" fill="white"/>
        <path d="M50.898 40.663C50.9127 40.584 51.0259 40.584 51.0406 40.663L51.2035 41.5386C51.4119 42.6586 52.2883 43.5349 53.4084 43.7433L54.2841 43.9062C54.3631 43.9209 54.3631 44.034 54.2841 44.0487L53.4084 44.2116C52.2883 44.42 51.4119 45.2963 51.2035 46.4163L51.0406 47.2919C51.0259 47.3709 50.9127 47.3709 50.898 47.2919L50.7351 46.4163C50.5267 45.2963 49.6504 44.42 48.5302 44.2116L47.6545 44.0487C47.5755 44.034 47.5755 43.9209 47.6545 43.9062L48.5302 43.7433C49.6504 43.5349 50.5267 42.6586 50.7351 41.5386L50.898 40.663Z" fill="white"/>
      </g>
      <defs>
        <filter id="filter0_d_welcome" x="-0.000131607" y="-1.43051e-06" width="88.4929" height="88.4931" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="6.59303"/>
          <feGaussianBlur stdDeviation="9.52326"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.992157 0 0 0 0 0.45098 0 0 0 0 0.239216 0 0 0 0.36 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_welcome"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_welcome" result="shape"/>
        </filter>
        <linearGradient id="paint0_linear_welcome" x1="19.0464" y1="40.0309" x2="69.4464" y2="40.0309" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB352"/>
          <stop offset="0.5" stopColor="#FC6839"/>
          <stop offset="1" stopColor="#EB2E24"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function FlowCanvas({ onContentChange }: { onContentChange?: (hasContent: boolean) => void }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const { screenToFlowPosition } = useReactFlow()
  const updateNodeInternals = useUpdateNodeInternals()
  const [chatOpen, setChatOpen] = useState(false)
  const [panelHeight, setPanelHeight] = useState(600)

  const COLLAPSED_W = 320
  const COLLAPSED_H = 48
  const PANEL_W = 440

  type PanelAnim = 'idle' | 'expand-width' | 'expand-height' | 'content-in' | 'content-out' | 'collapse-height' | 'collapse-width'
  const [panelAnim, setPanelAnim] = useState<PanelAnim>('idle')
  const [panelW, setPanelW] = useState(COLLAPSED_W)
  const [panelH, setPanelH] = useState(COLLAPSED_H)
  const [contentVisible, setContentVisible] = useState(false)
  const [helperVisible, setHelperVisible] = useState(true)
  const [hasChatStarted, setHasChatStarted] = useState(false)
  const [removedDemoIds, setRemovedDemoIds] = useState<string[]>([])
  const chatNodeIdsRef = useRef<Set<string>>(new Set())
  const panelResizing = useRef(false)
  const [isResizing, setIsResizing] = useState(false)
  const panelResizeStart = useRef({ y: 0, h: 0 })
  const prevNodeCount = useRef(0)
  const [ghostText, setGhostText] = useState<string | null>(null)
  const [inputBottom, setInputBottom] = useState(false)
  const headingRef = useRef<HTMLDivElement>(null)
  const chatWrapRef = useRef<HTMLDivElement>(null)

  type TransitionPhase = 'none' | 'stage-fading' | 'bar-reveal' | 'panel-opening' | 'done'
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>('none')
  const hasTransitioned = useRef(false)
  const pendingNodesRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null)

  const showWelcome = nodes.length === 0 && transitionPhase === 'none'
  const isWelcomeMode = showWelcome || transitionPhase === 'stage-fading'

  const startPanelTransition = useCallback(() => {
    if (hasTransitioned.current) return
    hasTransitioned.current = true
    setTransitionPhase('stage-fading')

    const headingEl = headingRef.current
    const chatWrapEl = chatWrapRef.current
    const wrapperEl = headingEl?.parentElement

    // Step 1: Chat content disappears quickly (100ms)
    const scrollAreaEl = chatWrapEl?.querySelector('[data-scroll-area]') as HTMLElement | null
    if (scrollAreaEl) {
      scrollAreaEl.style.transition = 'opacity 0.1s ease'
      scrollAreaEl.style.opacity = '0'
    }

    // Step 2: After content gone, sparkle+heading animate down toward center (500ms)
    setTimeout(() => {
      if (headingEl && wrapperEl) {
        const wrapperRect = wrapperEl.getBoundingClientRect()
        const headingRect = headingEl.getBoundingClientRect()
        const centerY = wrapperRect.top + wrapperRect.height / 2
        const headingDelta = centerY - headingRect.top - headingRect.height / 2
        headingEl.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.12s ease'
        headingEl.style.transform = `translateY(${headingDelta * 0.85}px)`
      }

      // Step 3: Input animates up toward center (500ms)
      const inputEl = chatWrapEl?.querySelector('[data-chat-input]') as HTMLElement | null
      if (inputEl && wrapperEl) {
        const wrapperRect = wrapperEl.getBoundingClientRect()
        const inputRect = inputEl.getBoundingClientRect()
        const centerY = wrapperRect.top + wrapperRect.height / 2
        const inputDelta = centerY - inputRect.top - inputRect.height / 2
        inputEl.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.12s ease'
        inputEl.style.transform = `translateY(${inputDelta * 0.85}px)`
      }

      // Step 4: Fade out while still approaching each other
      setTimeout(() => {
        if (headingEl) headingEl.style.opacity = '0'
        const inputEl2 = chatWrapEl?.querySelector('[data-chat-input]') as HTMLElement | null
        if (inputEl2) inputEl2.style.opacity = '0'
      }, 100)
    }, 120)

    // Step 5: Clean up inline styles and start panel animation
    setTimeout(() => {
      // Reset all direct DOM style overrides so React can take over
      if (headingEl) {
        headingEl.style.transition = ''
        headingEl.style.transform = ''
        headingEl.style.opacity = ''
      }
      const scrollArea2 = chatWrapEl?.querySelector('[data-scroll-area]') as HTMLElement | null
      if (scrollArea2) {
        scrollArea2.style.transition = ''
        scrollArea2.style.opacity = ''
      }
      const inputEl3 = chatWrapEl?.querySelector('[data-chat-input]') as HTMLElement | null
      if (inputEl3) {
        inputEl3.style.transition = ''
        inputEl3.style.transform = ''
        inputEl3.style.opacity = ''
      }
      setTransitionPhase('bar-reveal')
    }, 750)

    setTimeout(() => {
      setTransitionPhase('panel-opening')
      setChatOpen(true)

      const fullH = reactFlowWrapper.current?.getBoundingClientRect().height
        ? reactFlowWrapper.current.getBoundingClientRect().height - 32
        : 600
      setPanelHeight(fullH)

      setPanelAnim('expand-width')
      setPanelW(PANEL_W)

      setTimeout(() => {
        setPanelAnim('expand-height')
        setPanelH(fullH)
      }, 350)

      setTimeout(() => {
        setPanelAnim('content-in')
        setContentVisible(true)
      }, 700)

      setTimeout(() => {
        setPanelAnim('idle')
        if (pendingNodesRef.current) {
          const pending = pendingNodesRef.current
          pendingNodesRef.current = null
          setNodes(pending.nodes)
          setEdges(pending.edges)
        }
        setTransitionPhase('done')
        setTimeout(() => {
          const scrollArea = document.querySelector('[data-scroll-area]')
          if (scrollArea) scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' })
        }, 100)
      }, 1000)
    }, 1100)
  }, [setNodes, setEdges])

  useEffect(() => {
    onContentChange?.(nodes.length > 0)
    if (prevNodeCount.current === 0 && nodes.length > 0 && !hasTransitioned.current) {
      startPanelTransition()
    }
    prevNodeCount.current = nodes.length
  }, [nodes.length, onContentChange, startPanelTransition])

  useEffect(() => {
    const currentChatIds = new Set(
      nodes.filter((n) => n.id.startsWith('chat-')).map((n) => n.id.replace('chat-', ''))
    )
    const prevIds = chatNodeIdsRef.current
    const removed = [...prevIds].filter((id) => !currentChatIds.has(id))
    if (removed.length > 0) {
      setRemovedDemoIds((prev) => [...prev, ...removed])
    }
    chatNodeIdsRef.current = currentChatIds
  }, [nodes])

  const handleFirstSend = useCallback((text?: string) => {
    setHelperVisible(false)

    const headingEl = headingRef.current
    const chatWrapEl = chatWrapRef.current
    const parentEl = headingEl?.parentElement
    if (!headingEl || !parentEl) return

    const parentRect = parentEl.getBoundingClientRect()
    const headingRect = headingEl.getBoundingClientRect()
    const targetTop = parentRect.top + 24
    const deltaY = targetTop - headingRect.top

    const dur = '0.5s'
    const ease = 'cubic-bezier(0.4, 0, 0.2, 1)'

    headingEl.style.transition = `transform ${dur} ${ease}`
    headingEl.style.transform = `translateY(${deltaY}px)`

    const scrollAreaEl = chatWrapEl?.querySelector('[data-scroll-area]') as HTMLElement | null
    if (scrollAreaEl) {
      scrollAreaEl.style.transition = `transform ${dur} ${ease}`
      scrollAreaEl.style.transform = `translateY(${deltaY}px)`
    }

    const inputEl = chatWrapEl?.querySelector('[data-chat-input]') as HTMLElement | null
    if (inputEl) {
      const inputRect = inputEl.getBoundingClientRect()
      const inputTargetTop = parentRect.bottom - 56 - inputRect.height
      const inputDeltaY = inputTargetTop - inputRect.top
      inputEl.style.transition = `transform ${dur} ${ease}`
      inputEl.style.transform = `translateY(${inputDeltaY}px)`
    }

    if (text) {
      setGhostText(text)
      setTimeout(() => setGhostText(null), 700)
    }

    setTimeout(() => {
      headingEl.style.transition = ''
      headingEl.style.transform = ''
      if (scrollAreaEl) {
        scrollAreaEl.style.transition = ''
        scrollAreaEl.style.transform = ''
      }
      if (inputEl) {
        inputEl.style.transition = ''
        inputEl.style.transform = ''
      }
      setHasChatStarted(true)
      setInputBottom(true)
    }, 550)
  }, [])

  const handleExpand = useCallback(() => {
    setChatOpen(true)
    const fullH = reactFlowWrapper.current?.getBoundingClientRect().height
      ? reactFlowWrapper.current.getBoundingClientRect().height - 32
      : panelHeight

    setPanelAnim('expand-width')
    setPanelW(PANEL_W)

    setTimeout(() => {
      setPanelAnim('expand-height')
      setPanelH(fullH)
      setPanelHeight(fullH)
    }, 350)

    setTimeout(() => {
      setPanelAnim('content-in')
      setContentVisible(true)
    }, 700)

    setTimeout(() => {
      setPanelAnim('idle')
      const scrollArea = document.querySelector('[data-scroll-area]')
      if (scrollArea) scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' })
    }, 1000)
  }, [panelHeight])

  const handleCollapse = useCallback(() => {
    setPanelAnim('content-out')
    setContentVisible(false)

    setTimeout(() => {
      setPanelAnim('collapse-height')
      setPanelH(COLLAPSED_H)
    }, 300)

    setTimeout(() => {
      setPanelAnim('collapse-width')
      setPanelW(COLLAPSED_W)
    }, 650)

    setTimeout(() => {
      setChatOpen(false)
      setPanelAnim('idle')
    }, 1000)
  }, [])

  const onPanelResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    panelResizing.current = true
    setIsResizing(true)
    panelResizeStart.current = { y: e.clientY, h: panelH }
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev: MouseEvent) => {
      if (!panelResizing.current) return
      const delta = ev.clientY - panelResizeStart.current.y
      const parentH = reactFlowWrapper.current?.getBoundingClientRect().height ?? 800
      const maxH = parentH - 32
      const newH = Math.max(300, Math.min(maxH, panelResizeStart.current.h + delta))
      setPanelHeight(newH)
      setPanelH(newH)
    }
    const onUp = () => {
      panelResizing.current = false
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [panelHeight])

  const onConnect: OnConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const interactionType = event.dataTransfer.getData('application/reactflow')
      if (!interactionType) return

      const mappedType = nodeTypeMap[interactionType]
      if (!mappedType) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      let nodeData: Record<string, unknown> = {}
      const rawData = event.dataTransfer.getData('application/reactflow-data')
      if (rawData) {
        try { nodeData = JSON.parse(rawData) } catch { /* ignore */ }
      }

      const newNode: Node = {
        id: getNodeId(),
        type: mappedType,
        position,
        data: nodeData,
      }

      setNodes((nds) => [...nds, newNode])
    },
    [screenToFlowPosition, setNodes],
  )

  const handleCreateDemo = useCallback((proposal: DemoProposal, selectedContent: SelectedContent[]) => {
    console.log('[FlowCanvas] handleCreateDemo called', { template: proposal.template, selectedCount: selectedContent.length, items: selectedContent.map(s => ({ persona: s.persona, title: s.demo.demo.title })) })
    const newNodes: Node[] = []
    const newEdges: Edge[] = []
    const COL_GAP = 550
    const ROW_GAP = 300

    const wrapper = reactFlowWrapper.current
    const wrapperRect = wrapper?.getBoundingClientRect()
    const screenW = wrapperRect?.width ?? window.innerWidth
    const screenH = wrapperRect?.height ?? window.innerHeight
    const centerScreen = screenToFlowPosition({ x: screenW / 2, y: screenH / 2 })
    const startX = centerScreen.x - 200
    const startY = centerScreen.y - 200

    const uniquePersonas = [...new Set(selectedContent.map((s) => s.persona))]
    const personaSelections = uniquePersonas.map((name) => ({
      name,
      items: selectedContent.filter((s) => s.persona === name),
    }))

    // Decide best-fit template based on actual selections:
    // - 1 persona, 1 item → Single Asset
    // - multiple personas, 1 item each → 1 Discovery Branch
    // - multiple personas with 2+ items per any persona → 2 Discovery Branches
    // - 1 persona, 2+ items → 1 Discovery Branch (question asks about content)
    const hasMultiplePersonas = uniquePersonas.length > 1
    const anyPersonaHasMultiple = personaSelections.some((p) => p.items.length > 1)
    const totalItems = selectedContent.length

    let effectiveTemplate: 'single_asset' | '1_disco_branch' | '2_disco_branch'
    if (totalItems === 1 && !hasMultiplePersonas) {
      effectiveTemplate = 'single_asset'
    } else if (hasMultiplePersonas && anyPersonaHasMultiple) {
      effectiveTemplate = '2_disco_branch'
    } else {
      effectiveTemplate = '1_disco_branch'
    }

    // --- Template 1: Single Asset ---
    if (effectiveTemplate === 'single_asset') {
      const sel = selectedContent[0]
      newNodes.push({
        id: getNodeId(),
        type: 'demoCardNode',
        position: { x: startX, y: startY },
        data: { title: sel.demo.demo.title, creator: sel.demo.demo.creator, preview: sel.demo.demo.preview },
      })
    }

    // --- Template 2: 1 Discovery Branch ---
    // 1 question → branches lead directly to content (video, tour, or both)
    if (effectiveTemplate === '1_disco_branch') {
      const questionId = getNodeId()

      if (hasMultiplePersonas) {
        newNodes.push({
          id: questionId,
          type: 'ctaNode',
          position: { x: startX, y: startY },
          data: { question: proposal.discoveryQuestion, answers: uniquePersonas },
        })

        personaSelections.forEach((ps, pi) => {
          ps.items.forEach((sel, si) => {
            const cardId = getNodeId()
            newNodes.push({
              id: cardId,
              type: 'demoCardNode',
              position: { x: startX + COL_GAP, y: startY + pi * ROW_GAP + si * 260 },
              data: { title: sel.demo.demo.title, creator: sel.demo.demo.creator, preview: sel.demo.demo.preview },
            })
            newEdges.push({
              id: `e-${questionId}-${cardId}`,
              source: questionId,
              sourceHandle: `answer-${pi}`,
              target: cardId,
              type: 'deletable',
            })
          })
        })
      } else {
        const answers = selectedContent.map((s) =>
          s.demo.demo.title.length > 45 ? s.demo.demo.title.slice(0, 42) + '...' : s.demo.demo.title
        )
        newNodes.push({
          id: questionId,
          type: 'ctaNode',
          position: { x: startX, y: startY },
          data: { question: 'Which of these is most relevant to you?', answers },
        })

        selectedContent.forEach((sel, i) => {
          const cardId = getNodeId()
          newNodes.push({
            id: cardId,
            type: 'demoCardNode',
            position: { x: startX + COL_GAP, y: startY + i * 260 },
            data: { title: sel.demo.demo.title, creator: sel.demo.demo.creator, preview: sel.demo.demo.preview },
          })
          newEdges.push({
            id: `e-${questionId}-${cardId}`,
            source: questionId,
            sourceHandle: `answer-${i}`,
            target: cardId,
            type: 'deletable',
          })
        })
      }
    }

    // --- Template 3: 2 Discovery Branches ---
    // Question 1 (persona) → Question 2 (interest/content) → content cards
    if (effectiveTemplate === '2_disco_branch') {
      const q1Id = getNodeId()
      newNodes.push({
        id: q1Id,
        type: 'ctaNode',
        position: { x: startX, y: startY },
        data: { question: proposal.discoveryQuestion, answers: uniquePersonas },
      })

      let yAccum = startY
      personaSelections.forEach((ps, pi) => {
        const branchY = yAccum

        if (ps.items.length > 1) {
          const q2Id = getNodeId()
          const subAnswers = ps.items.map((s) =>
            s.demo.demo.title.length > 45 ? s.demo.demo.title.slice(0, 42) + '...' : s.demo.demo.title
          )
          newNodes.push({
            id: q2Id,
            type: 'ctaNode',
            position: { x: startX + COL_GAP, y: branchY },
            data: { question: `What's most important to you?`, answers: subAnswers },
          })
          newEdges.push({
            id: `e-${q1Id}-${q2Id}`,
            source: q1Id,
            sourceHandle: `answer-${pi}`,
            target: q2Id,
            type: 'deletable',
          })

          ps.items.forEach((sel, mi) => {
            const cardId = getNodeId()
            newNodes.push({
              id: cardId,
              type: 'demoCardNode',
              position: { x: startX + COL_GAP * 2, y: branchY + mi * 260 },
              data: { title: sel.demo.demo.title, creator: sel.demo.demo.creator, preview: sel.demo.demo.preview },
            })
            newEdges.push({
              id: `e-${q2Id}-${cardId}`,
              source: q2Id,
              sourceHandle: `answer-${mi}`,
              target: cardId,
              type: 'deletable',
            })
          })

          yAccum += Math.max(1, ps.items.length) * 260 + 60
        } else {
          const cardId = getNodeId()
          newNodes.push({
            id: cardId,
            type: 'demoCardNode',
            position: { x: startX + COL_GAP, y: branchY },
            data: { title: ps.items[0].demo.demo.title, creator: ps.items[0].demo.demo.creator, preview: ps.items[0].demo.demo.preview },
          })
          newEdges.push({
            id: `e-${q1Id}-${cardId}`,
            source: q1Id,
            sourceHandle: `answer-${pi}`,
            target: cardId,
            type: 'deletable',
          })

          yAccum += ROW_GAP
        }
      })
    }

    console.log('[FlowCanvas] placing on canvas', { effectiveTemplate, nodesCount: newNodes.length, edgesCount: newEdges.length, nodes: newNodes.map(n => ({ id: n.id, type: n.type, data: n.data })) })

    if (!hasTransitioned.current) {
      pendingNodesRef.current = { nodes: newNodes, edges: newEdges }
      startPanelTransition()
    } else {
      setNodes((nds) => [...nds, ...newNodes])
      setEdges((eds) => [...eds, ...newEdges])
    }
  }, [setNodes, setEdges, screenToFlowPosition, startPanelTransition])

  const handleCreateNode = useCallback((type: 'fullScreenDialogNode' | 'ctaNode', data?: Record<string, unknown>) => {
    const wrapper = reactFlowWrapper.current
    const wrapperRect = wrapper?.getBoundingClientRect()
    const screenW = wrapperRect?.width ?? window.innerWidth
    const screenH = wrapperRect?.height ?? window.innerHeight
    const center = screenToFlowPosition({ x: screenW / 2, y: screenH / 2 })

    const existingFSD = nodes.find((n) => n.type === type)
    if (existingFSD && data) {
      setNodes((nds) => nds.map((n) =>
        n.id === existingFSD.id ? { ...n, data: { ...n.data, ...data } } : n
      ))
      return
    }

    const newNode: Node = {
      id: getNodeId(),
      type,
      position: { x: center.x - 150, y: center.y - 100 },
      data: data || {},
    }

    if (!hasTransitioned.current) {
      pendingNodesRef.current = { nodes: [newNode], edges: [] }
      startPanelTransition()
    } else {
      setNodes((nds) => [...nds, newNode])
    }
  }, [setNodes, screenToFlowPosition, nodes, startPanelTransition])

  const handleToggleContent = useCallback((match: ContentMatch, selected: boolean) => {
    const demoId = match.demo.id
    const cardNodeId = `chat-${demoId}`

    if (selected) {
      const ctaNode = nodes.find((n) => n.type === 'ctaNode')
      const demoCards = nodes.filter((n) => n.type === 'demoCardNode')

      const newNode: Node = {
        id: cardNodeId,
        type: 'demoCardNode',
        position: ctaNode
          ? { x: ctaNode.position.x + 400, y: ctaNode.position.y + demoCards.length * 180 }
          : { x: (demoCards[demoCards.length - 1]?.position.x ?? 400), y: (demoCards[demoCards.length - 1]?.position.y ?? 0) + 180 },
        data: { title: match.demo.title, creator: match.demo.creator, preview: match.demo.preview },
      }

      if (ctaNode) {
        const currentAnswers: string[] = (ctaNode.data as { answers?: string[] }).answers ?? []
        const answerLabel = match.demo.title.length > 45
          ? match.demo.title.slice(0, 42) + '...'
          : match.demo.title
        const newAnswerIndex = currentAnswers.length

        setNodes((nds) => [
          ...nds.map((n) =>
            n.id === ctaNode.id
              ? { ...n, data: { ...n.data, answers: [...currentAnswers, answerLabel] } }
              : n
          ),
          newNode,
        ])

        setTimeout(() => {
          updateNodeInternals(ctaNode.id)
          setTimeout(() => {
            setEdges((eds) => [
              ...eds,
              {
                id: `e-${ctaNode.id}-${cardNodeId}`,
                source: ctaNode.id,
                sourceHandle: `answer-${newAnswerIndex}`,
                target: cardNodeId,
                type: 'deletable',
              },
            ])
          }, 300)
        }, 400)
      } else {
        setNodes((nds) => [...nds, newNode])
      }
    } else {
      setNodes((nds) => nds.filter((n) => n.id !== cardNodeId))
      setEdges((eds) => eds.filter((e) => e.source !== cardNodeId && e.target !== cardNodeId))
    }
  }, [setNodes, setEdges, nodes])

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: 'deletable',
          style: { stroke: '#FC6839', strokeWidth: 3, strokeDasharray: '8 4', strokeLinecap: 'round' },
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
        className="bg-gray-50"
      >
        <Background variant={BackgroundVariant.Dots} gap={14} size={1.5} color="#b0b0b0" />
        {/* Controls replaced by custom toolbar */}
      </ReactFlow>

      {/* Custom controls toolbar */}
      <ControlsToolbar />

      {/* Persistent chat wrapper — always mounted, single AgenticChat instance */}
      <div
        className={
          isWelcomeMode
            ? `absolute inset-0 flex flex-col items-center pointer-events-none z-10 ${!hasChatStarted ? 'justify-center' : ''}`
            : 'absolute top-4 left-4 z-20'
        }
        style={
          isWelcomeMode
            ? {
                ...(hasChatStarted ? { paddingTop: 24 } : {}),
              }
            : {
                opacity: transitionPhase === 'bar-reveal' ? 1 : undefined,
                transition: transitionPhase === 'bar-reveal' ? 'opacity 0.4s ease' : undefined,
              }
        }
      >
        {/* Welcome decorations — sparkle + heading above the chat */}
        {isWelcomeMode && (
          <div ref={headingRef} className="flex flex-col items-center pointer-events-auto w-full" style={{ maxWidth: 640, margin: '0 auto' }}>
            <div className="mb-4" style={{ transform: 'translateY(24px)' }}>
              <SparkleIcon size={92} />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              Let&apos;s build something together!
            </h1>
          </div>
        )}

        {/* Panel chrome wrapper — visible when not in welcome mode */}
        <div
          className={isWelcomeMode ? 'contents' : 'relative flex flex-col rounded-2xl border border-gray-200 shadow-lg overflow-hidden backdrop-blur-sm'}
          style={isWelcomeMode ? undefined : {
            width: panelW,
            height: panelH,
            background: panelH <= COLLAPSED_H + 10
              ? 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 60%, rgba(255,255,255,0.3) 100%)'
              : 'rgba(255,255,255,0.8)',
            transition: isResizing
              ? 'background 0.3s ease'
              : 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1), height 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease',
          }}
        >
          {/* Panel header */}
          {!isWelcomeMode && (
            <>
              <CornerGlow />
              <div
                className="relative flex items-center px-4 shrink-0 bg-white rounded-t-2xl"
                style={{
                  height: COLLAPSED_H,
                  minHeight: COLLAPSED_H,
                  borderBottom: contentVisible ? '1px solid #f3f4f6' : 'none',
                }}
              >
                {panelH <= COLLAPSED_H + 10
                  ? <div style={{ transform: 'translateY(2px)', marginRight: 12 }}><SparkleIcon size={36} /></div>
                  : <div className="mr-3"><SparkleIcon size={32} /></div>
                }
                <span className="text-base font-semibold whitespace-nowrap" style={{ color: '#FC6839' }}>Consensus AI</span>
                <div className="flex-1" />
                <button
                  onClick={panelAnim !== 'idle' ? undefined : (contentVisible ? handleCollapse : handleExpand)}
                  className="text-[#172537] hover:text-[#FC6839] transition-colors p-1 rounded-md"
                  style={{ cursor: panelAnim !== 'idle' ? 'default' : 'pointer' }}
                >
                  <svg width="22" height="17" viewBox="0 0 22 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.5" y="0.5" width="21" height="16" rx="3.5" stroke="currentColor"/>
                    <line x1="6.64844" y1="0.5" x2="6.64844" y2="17" stroke="currentColor"/>
                  </svg>
                </button>
                {hasChatStarted && !contentVisible && panelH <= COLLAPSED_H + 10 && (
                  <span className="absolute z-20 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" style={{ top: 11, right: 15 }} />
                )}
              </div>
            </>
          )}

          {/* Chat body wrapper — content fades in panel mode, always visible in welcome mode */}
          <div
            className={isWelcomeMode ? 'w-full pointer-events-auto' : 'flex-1 overflow-hidden'}
            style={isWelcomeMode
              ? { maxWidth: 640, margin: '0 auto' }
              : {
                  opacity: contentVisible ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: contentVisible ? 'auto' : 'none',
                }
            }
          >
            <div ref={chatWrapRef} className={isWelcomeMode ? '' : 'h-full overflow-hidden'}>
              <AgenticChat mode={isWelcomeMode ? 'full' : 'panel'} onFirstSend={handleFirstSend} onCreateDemo={handleCreateDemo} onToggleContent={handleToggleContent} onCreateNode={handleCreateNode} removedDemoIds={removedDemoIds} inputBottom={inputBottom} />
            </div>
          </div>

          {/* Resize handle — only when panel is open */}
          {!isWelcomeMode && contentVisible && panelAnim === 'idle' && (
            <div
              onMouseDown={onPanelResizeStart}
              className="h-2 cursor-row-resize flex items-center justify-center shrink-0 hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
          )}
        </div>

        {/* Welcome helper text & ghost */}
        {isWelcomeMode && (
          <>
            <p
              className="text-xs text-gray-900 mt-4 text-center pointer-events-auto"
              style={{
                opacity: (helperVisible && transitionPhase === 'none') ? 1 : 0,
                transition: 'opacity 0.1s ease-out',
              }}
            >
              Tell Consensus AI what you want to build or drag content and interactions on to the stage.
            </p>
            {ghostText && <GhostText text={ghostText} onDone={() => setGhostText(null)} />}
          </>
        )}
      </div>
    </div>
  )
}
