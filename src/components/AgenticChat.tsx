import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Send, ChevronDown, ChevronRight } from 'lucide-react'
import {
  buildProposal,
  generateToolCalls,
  type DemoProposal,
  type ToolGroup,
  type ConfidenceLevel,
} from '../lib/aiEngine'
import thumbTableHero from '../assets/thumb-table-hero.svg'
import thumbContent from '../assets/thumb-content.svg'

const demoThumbnails = [thumbTableHero, thumbContent]
function getDemoThumb(title: string) {
  let hash = 0
  for (let i = 0; i < title.length; i++) hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0
  return demoThumbnails[Math.abs(hash) % demoThumbnails.length]
}

type ConvoStep =
  | 'ask_purpose'
  | 'awaiting_purpose'
  | 'ask_pain_points'
  | 'awaiting_pain_points'
  | 'thinking'
  | 'proposal'
  | 'survey'
  | 'post_proposal'
  | 'awaiting_fsd_help'
  | 'awaiting_fsd_content'

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  thinking?: boolean
  toolGroups?: ToolGroup[]
  proposal?: DemoProposal
  showVote?: boolean
  voted?: 'up' | 'down'
  actions?: boolean
}

const confidenceLabel: Record<ConfidenceLevel, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
}

let msgId = 0
const nextId = () => `msg-${++msgId}`

export interface SelectedContent {
  persona: string
  demo: import('../lib/aiEngine').ContentMatch
}

interface Props {
  mode: 'full' | 'panel'
  onFirstSend?: (text?: string) => void
  onCreateDemo?: (proposal: DemoProposal, selectedContent: SelectedContent[]) => void
  onToggleContent?: (demo: import('../lib/aiEngine').ContentMatch, selected: boolean) => void
  onCreateNode?: (type: 'fullScreenDialogNode' | 'ctaNode', data?: Record<string, unknown>) => void
  removedDemoIds?: string[]
  inputBottom?: boolean
}

export default function AgenticChat({ mode, onFirstSend, onCreateDemo, onToggleContent, onCreateNode, removedDemoIds, inputBottom }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const hasSent = messages.some((m) => m.role === 'user')
  const effectiveHasSent = hasSent || !!inputBottom
  const [step, setStep] = useState<ConvoStep>('ask_purpose')
  const [personas, setPersonas] = useState<{ name: string; painPoints: string[] }[]>([])
  const [contentOffset, setContentOffset] = useState(0)
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({})
  const [expandedInfo, setExpandedInfo] = useState<Record<string, boolean>>({})
  const [feedbackText, setFeedbackText] = useState('')
  const [showFeedbackInput, setShowFeedbackInput] = useState(false)
  const [latestProposal, setLatestProposal] = useState<DemoProposal | null>(null)
  const [globalSelected, setGlobalSelected] = useState<Record<string, boolean>>({})
  const prevRemovedRef = useRef<string[]>([])

  useEffect(() => {
    if (!removedDemoIds || removedDemoIds.length === 0 || !latestProposal) return
    if (JSON.stringify(removedDemoIds) === JSON.stringify(prevRemovedRef.current)) return
    prevRemovedRef.current = removedDemoIds

    const removedSet = new Set(removedDemoIds)
    setGlobalSelected((prev) => {
      const next = { ...prev }
      latestProposal.personas.forEach((persona, pi) => {
        const hasPP = persona.painPointMatches && persona.painPointMatches.length >= 2
        if (hasPP && persona.painPointMatches) {
          persona.painPointMatches.forEach((ppGroup, gi) => {
            ppGroup.matches.forEach((m, mi) => {
              if (removedSet.has(m.demo.id)) {
                next[`${pi}-pp${gi}-${mi}`] = false
              }
            })
          })
        } else {
          persona.matches.forEach((m, mi) => {
            if (removedSet.has(m.demo.id)) {
              next[`${pi}-${mi}`] = false
            }
          })
        }
      })
      return next
    })
  }, [removedDemoIds, latestProposal])

  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollWrapRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputWrapRef = useRef<HTMLDivElement>(null)
  const [inputHeight, setInputHeight] = useState(0)
  const [scrollMaxH, setScrollMaxH] = useState<number | undefined>(undefined)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const hasInit = useRef(false)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, 50)
  }, [])

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    const newMsg = { ...msg, id: nextId() }
    setMessages((prev) => [...prev, newMsg])
    return newMsg.id
  }, [])

  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)))
  }, [])

  useEffect(() => {
    if (hasInit.current) return
    hasInit.current = true
    setTimeout(() => {
      addMessage({
        role: 'ai',
        content: "Hey! What kind of demo are you building today and who is it for?",
      })
      setStep('awaiting_purpose')
    }, 600)
  }, [addMessage])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  const updateScrollShadows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollUp(el.scrollTop > 4)
    setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollShadows, { passive: true })
    const ro = new ResizeObserver(updateScrollShadows)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', updateScrollShadows); ro.disconnect() }
  }, [updateScrollShadows])

  useEffect(() => { updateScrollShadows() }, [messages, updateScrollShadows])

  useEffect(() => {
    if (!inputWrapRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setInputHeight(entry.contentRect.height)
    })
    ro.observe(inputWrapRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (mode !== 'full' || !effectiveHasSent || !scrollWrapRef.current) {
      setScrollMaxH(undefined)
      return
    }
    const update = () => {
      const rect = scrollWrapRef.current?.getBoundingClientRect()
      if (!rect) return
      const availableBottom = window.innerHeight - 56 - inputHeight - 16
      setScrollMaxH(Math.max(100, availableBottom - rect.top))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [mode, effectiveHasSent, inputHeight])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const isFirst = !messages.some((m) => m.role === 'user')

    const processMessage = () => {
      addMessage({ role: 'user', content: text, actions: true })

      const lower = text.toLowerCase()
      const wantsFSD = /full\s*screen|introduction|intro\b|welcome\s*(screen|page|message)|landing/i.test(lower)

      if (wantsFSD && step !== 'awaiting_pain_points' && step !== 'thinking') {
        handleFSDRequest(text)
        return
      }

      if (step === 'awaiting_fsd_help') {
        handleFSDHelpResponse(text)
        return
      }

      if (step === 'awaiting_fsd_content') {
        handleFSDContentResponse(text)
        return
      }

      if (step === 'awaiting_purpose') {
        handlePurposeResponse(text)
      } else if (step === 'awaiting_pain_points') {
        handlePainPointsResponse(text)
      } else if (step === 'post_proposal') {
        handleMoreContentRequest(text)
      } else if (step === 'survey') {
        addMessage({ role: 'ai', content: "Thanks for the feedback! I'll keep improving. Your demo is ready on the canvas — feel free to edit anything directly." })
      }
    }

    if (isFirst) {
      onFirstSend?.(text)
      setTimeout(processMessage, 700)
    } else {
      processMessage()
    }
  }

  const handlePurposeResponse = (text: string) => {
    const extractedPersonas = extractPersonas(text)
    setPersonas(extractedPersonas.map((n) => ({ name: n, painPoints: [] })))

    setTimeout(() => {
      const personaList = extractedPersonas.map((p, i) => `${i + 1}. ${p}`).join('\n')
      addMessage({
        role: 'ai',
        content: `Can you tell me what they care about most? Or what problem you solve for them:\n\n${personaList}`,
        showVote: true,
      })
      setStep('awaiting_pain_points')
    }, 1200)
  }

  const handlePainPointsResponse = (text: string) => {
    const painPointsByPersona = extractPainPoints(text, personas)
    const updatedPersonas = personas.map((p, i) => ({
      ...p,
      painPoints: painPointsByPersona[i] || ['general solutions'],
    }))
    setPersonas(updatedPersonas)
    setStep('thinking')

    const thinkingId = addMessage({
      role: 'ai',
      content: '',
      thinking: true,
      toolGroups: generateToolCalls(updatedPersonas),
    })

    simulateToolProgress(thinkingId, updatedPersonas)
  }

  const simulateToolProgress = (msgId: string, finalPersonas: typeof personas) => {
    const toolGroups = generateToolCalls(finalPersonas)
    const allTools = toolGroups.flatMap((g) => g.tools)
    let completed = 0

    const runningGroups = toolGroups.map((g) => ({
      ...g,
      tools: g.tools.map((t) => ({ ...t, status: 'running' as const })),
    }))
    updateMessage(msgId, { toolGroups: runningGroups })

    const interval = setInterval(() => {
      completed++
      const updated = toolGroups.map((g) => ({
        ...g,
        tools: g.tools.map((t, ti) => {
          const globalIdx = toolGroups.slice(0, toolGroups.indexOf(g)).flatMap((gg) => gg.tools).length + ti
          return { ...t, status: globalIdx < completed ? 'complete' as const : 'running' as const }
        }),
      }))
      updateMessage(msgId, { toolGroups: updated })
      scrollToBottom()

      if (completed >= allTools.length) {
        clearInterval(interval)
        setTimeout(() => {
          const proposal = buildProposal(finalPersonas, contentOffset)
          setLatestProposal(proposal)
          updateMessage(msgId, { thinking: false, toolGroups: updated })

          const autoSelected: Record<string, boolean> = {}
          const autoItems: SelectedContent[] = []

          proposal.personas.forEach((persona, pi) => {
            const hasPPMatches = persona.painPointMatches && persona.painPointMatches.length >= 2
            if (hasPPMatches && persona.painPointMatches) {
              persona.painPointMatches.forEach((ppGroup, gi) => {
                const top = ppGroup.matches.slice(0, 2)
                top.forEach((m, mi) => {
                  const key = `${pi}-pp${gi}-${mi}`
                  autoSelected[key] = true
                  autoItems.push({ persona: persona.name, demo: m })
                })
              })
            } else {
              const top = persona.matches.slice(0, 2)
              top.forEach((m, mi) => {
                const key = `${pi}-${mi}`
                autoSelected[key] = true
                autoItems.push({ persona: persona.name, demo: m })
              })
            }
          })

          setGlobalSelected(autoSelected)

          addMessage({
            role: 'ai',
            content: `Here's what I put together — I selected the best content for each persona and placed it on the canvas as a connected flow. You can swap or adjust anything:`,
            proposal,
          })

          onCreateDemo?.(proposal, autoItems)

          setTimeout(() => {
            addMessage({
              role: 'ai',
              content: "Should I look for different content or create a different flow?",
              showVote: true,
            })
            setStep('post_proposal')
            scrollToBottom()
          }, 500)

          scrollToBottom()
        }, 800)
      }
    }, 700)
  }

  const handleMoreContentRequest = (text: string) => {
    const lower = text.toLowerCase()
    const wantsMore = /more|other|additional|alternative|different|better|higher|another|else|options/i.test(lower)
    const isHappy = /looks good|perfect|great|love it|awesome|let's go|done|satisfied|that works|i'm good|ship it|create|build/i.test(lower)

    if (isHappy) {
      addMessage({
        role: 'ai',
        content: "Glad you like it! The demo is already on the canvas — feel free to edit, swap content, or rearrange elements anytime.",
      })
      return
    }

    if (!wantsMore) {
      addMessage({
        role: 'ai',
        content: "I can help with that! Would you like to see more content options, or are you happy with what's on the canvas? Just let me know.",
      })
      return
    }

    const newOffset = contentOffset + 3
    setContentOffset(newOffset)

    addMessage({ role: 'ai', content: '', thinking: true, toolGroups: [{ label: 'Searching for more content', tools: [{ name: 'search_library', description: 'Searching demo library for additional matches...', status: 'running' }] }] })

    setTimeout(() => {
      const proposal = buildProposal(personas, newOffset)
      const hasResults = proposal.personas.some((p) => p.matches.length > 0)

      if (hasResults) {
        const allLow = proposal.personas.every((p) =>
          p.matches.every((m) => m.confidence === 'low'),
        )

        setMessages((prev) => prev.filter((m) => !m.thinking))
        setLatestProposal(proposal)

        const autoSelected: Record<string, boolean> = {}
        const autoItems: SelectedContent[] = []

        proposal.personas.forEach((persona, pi) => {
          const hasPPMatches = persona.painPointMatches && persona.painPointMatches.length >= 2
          if (hasPPMatches && persona.painPointMatches) {
            persona.painPointMatches.forEach((ppGroup, gi) => {
              const top = ppGroup.matches.slice(0, 2)
              top.forEach((m, mi) => {
                const key = `${pi}-pp${gi}-${mi}`
                autoSelected[key] = true
                autoItems.push({ persona: persona.name, demo: m })
              })
            })
          } else {
            const top = persona.matches.slice(0, 2)
            top.forEach((m, mi) => {
              const key = `${pi}-${mi}`
              autoSelected[key] = true
              autoItems.push({ persona: persona.name, demo: m })
            })
          }
        })

        setGlobalSelected(autoSelected)
        onCreateDemo?.(proposal, autoItems)

        if (allLow) {
          addMessage({
            role: 'ai',
            content: "I found a few more options but the relevance is lower. I've updated the canvas with the best of what's available:",
            proposal,
            showVote: true,
          })
          addMessage({
            role: 'ai',
            content: "These are the best remaining matches. If none of these work, I'd recommend creating new content tailored to your personas. Here are some tips:\n\n• **Keep it focused** — one demo per pain point performs best\n• **Use their language** — mirror the terms your buyers use\n• **Start with a tour** — they're quick to create and highly engaging\n\n📚 [Visit the Knowledge Base](https://knowledge.goconsensus.com) for step-by-step guides on creating effective demos.",
          })
        } else {
          addMessage({
            role: 'ai',
            content: "Here are some additional options — I've updated the canvas with the top picks:",
            proposal,
            showVote: true,
          })
          addMessage({
            role: 'ai',
            content: "Would you like to see even more options, or are these working for you?",
          })
        }
      } else {
        setMessages((prev) => prev.filter((m) => !m.thinking))

        addMessage({
          role: 'ai',
          content: "I've gone through all the available content in your library and there aren't any more relevant matches for your personas. Here's what I'd suggest:\n\n**Create new content:**\n" +
            personas.map((p) => `• **${p.name}** — Focus on ${p.painPoints.join(', ')}. A ${/president|vp|vice president|chief|c suite/i.test(p.name) ? 'video' : 'tour'} would work best for this audience.`).join('\n') +
            "\n\n**Tips for creating high-performing demos:**\n• Keep demos under 3 minutes for maximum engagement\n• Lead with the pain point, then show the solution\n• Include a clear CTA at the end\n\n📚 [Visit the Knowledge Base](https://knowledge.goconsensus.com) for templates and best practices.",
        })
        setStep('survey')
      }
      scrollToBottom()
    }, 2000)
  }

  const handleFSDRequest = (text: string) => {
    setTimeout(() => {
      onCreateNode?.('fullScreenDialogNode')
      addMessage({
        role: 'ai',
        content: "Done! I've placed a Full Screen Dialog on the canvas. Would you like help writing the header and description?",
      })
      setStep('awaiting_fsd_help')
      scrollToBottom()
    }, 600)
  }

  const handleFSDHelpResponse = (text: string) => {
    const lower = text.toLowerCase()
    const wantsHelp = /yes|sure|please|help|yeah|yep|ok|go ahead|absolutely|definitely/i.test(lower)
    const noHelp = /no|nah|i'm good|i got it|skip|not now|later/i.test(lower)

    if (wantsHelp) {
      addMessage({
        role: 'ai',
        content: "Great! Tell me a bit about what this introduction should say — who is it for and what should they know upfront? I'll draft a header and description for you.",
      })
      setStep('awaiting_fsd_content')
    } else if (noHelp) {
      addMessage({
        role: 'ai',
        content: "No problem! The Full Screen Dialog is on the canvas — just click into it to start editing. Let me know if you need anything else.",
      })
      setStep('post_proposal')
    } else {
      addMessage({
        role: 'ai',
        content: "I can help write the header and description for your introduction. Just say **yes** and tell me what it should be about, or **no** if you'd rather write it yourself.",
      })
    }
  }

  const handleFSDContentResponse = (text: string) => {
    setTimeout(() => {
      const words = text.split(/\s+/).filter((w) => w.length > 3)
      const topic = words.slice(0, 5).join(' ') || 'your product'
      const header = `Welcome to your personalized ${topic} experience`
      const description = `We've put together a tailored walkthrough based on what matters most to you. Explore the sections below to see how ${topic} can help you achieve your goals.`

      onCreateNode?.('fullScreenDialogNode', { header, message: description })

      addMessage({
        role: 'ai',
        content: `Here's what I came up with:\n\n**Header:** ${header}\n\n**Description:** ${description}\n\nI've updated the Full Screen Dialog on the canvas. Feel free to edit it directly or let me know if you'd like me to adjust anything.`,
      })
      setStep('post_proposal')
      scrollToBottom()
    }, 1000)
  }

  const handleVote = (msgId: string, vote: 'up' | 'down') => {
    updateMessage(msgId, { voted: vote })
    if (vote === 'down') {
      setShowFeedbackInput(true)
    }
  }

  const toggleToolGroup = (key: string) => {
    setExpandedTools((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleInfo = (key: string) => {
    setExpandedInfo((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const containerClass = mode === 'full'
    ? 'flex flex-col w-full max-w-2xl mx-auto'
    : 'flex flex-col h-full'

  return (
    <div className={containerClass}>
      <div ref={scrollWrapRef} data-scroll-area className={mode === 'full' ? 'relative overflow-hidden' : 'relative flex-1 overflow-hidden'} style={mode === 'full' ? { height: effectiveHasSent && scrollMaxH ? scrollMaxH : undefined, maxHeight: 'calc(100vh - 340px)' } : undefined}>
        <div className="absolute top-0 left-0 right-0 h-3 z-10 pointer-events-none transition-opacity duration-200" style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(0,0,0,0.06) 0%, transparent 100%)', opacity: canScrollUp ? 1 : 0 }} />
        <div className="absolute bottom-0 left-0 right-0 h-3 z-10 pointer-events-none transition-opacity duration-200" style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 100%, rgba(0,0,0,0.06) 0%, transparent 100%)', opacity: canScrollDown ? 1 : 0 }} />
      <div ref={scrollRef} className="h-full overflow-y-auto pl-4 pr-8 py-4 flex flex-col" style={{ scrollbarGutter: 'stable' }}>
        {messages.map((msg, idx) => {
          const prev = messages[idx - 1]
          const isNewSection = prev && prev.role !== msg.role
          const sameRoleAi = prev && prev.role === 'ai' && msg.role === 'ai'
          return (
            <div key={msg.id} style={{ marginTop: idx === 0 ? 0 : isNewSection ? 32 : sameRoleAi ? 24 : 8 }}>
              {msg.role === 'user' ? (
                <UserMessage msg={msg} />
              ) : (
                <AiMessage
                  msg={msg}
                  expandedTools={expandedTools}
                  expandedInfo={expandedInfo}
                  onToggleTool={toggleToolGroup}
                  onToggleInfo={toggleInfo}
                  onVote={handleVote}
                  selected={globalSelected}
                  onToggleSelect={(key) => {
                    const nowSelected = !globalSelected[key]
                    setGlobalSelected((prev) => ({ ...prev, [key]: nowSelected }))

                    if (latestProposal && onToggleContent) {
                      const ppMatch = key.match(/^(\d+)-pp(\d+)-(\d+)$/)
                      const flatMatch = key.match(/^(\d+)-(\d+)$/)
                      let match: import('../lib/aiEngine').ContentMatch | undefined
                      if (ppMatch) {
                        const [, pi, gi, mi] = ppMatch.map(Number)
                        match = latestProposal.personas[pi]?.painPointMatches?.[gi]?.matches[mi]
                      } else if (flatMatch) {
                        const [, pi, mi] = flatMatch.map(Number)
                        match = latestProposal.personas[pi]?.matches[mi]
                      }
                      if (match) onToggleContent(match, nowSelected)
                    }
                  }}
                />
              )}
            </div>
          )
        })}

        {showFeedbackInput && (
          <div className="ml-10 flex gap-2">
            <input
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us how we can improve..."
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-brand-400"
            />
            <button
              onClick={() => {
                if (feedbackText.trim()) {
                  addMessage({ role: 'user', content: feedbackText.trim() })
                  addMessage({ role: 'ai', content: "Thanks for the detailed feedback — we'll use this to improve. Feel free to edit the demo directly on the canvas." })
                  setFeedbackText('')
                  setShowFeedbackInput(false)
                }
              }}
              className="text-sm bg-brand-500 text-white px-3 py-2 rounded-lg hover:bg-brand-600 transition-colors"
            >
              Send
            </button>
          </div>
        )}
      </div>
      </div>

      {/* Input area */}
      <div
        ref={inputWrapRef}
        data-chat-input
        className={
          mode === 'full'
            ? 'pointer-events-auto mt-9'
            : 'border-t border-gray-100 px-4 py-3 bg-white'
        }
        style={
          mode === 'full' && effectiveHasSent
            ? {
                position: 'absolute',
                bottom: 56,
                left: 0,
                right: 0,
                zIndex: 20,
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }
            : mode === 'full'
              ? { transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }
              : undefined
        }
      >
        <div
          className="bg-white rounded-2xl flex flex-col transition-shadow duration-200"
          style={{
            minHeight: mode === 'full' ? (effectiveHasSent ? 60 : 100) : 60,
            ...(mode === 'full' ? { maxWidth: 640, margin: '0 auto', transition: 'min-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, border-color 0.2s ease' } : {}),
            border: inputFocused ? '2px solid #F44C10' : '1px solid #e5e7eb',
            boxShadow: inputFocused ? '0 0 0 5px rgba(255, 150, 89, 0.5)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            padding: inputFocused ? 0 : 1,
          }}
        >
          <div className="flex-1 px-4 pt-3 pb-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                const el = e.target
                el.style.height = 'auto'
                el.style.height = el.scrollHeight + 'px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Type or record your message"
              className="w-full resize-none outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-transparent overflow-hidden"
              rows={mode === 'full' && !effectiveHasSent ? 3 : 1}
              style={{ maxHeight: 200 }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </div>
          <div className="flex items-center justify-between px-4 pb-3">
            <button onMouseDown={(e) => e.preventDefault()} className="text-gray-400 hover:text-gray-600 transition-colors">
              <Mic size={18} />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSend}
              className="transition-colors"
              style={{ color: input.trim() ? '#FC6839' : '#d1d5db' }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function renderInlineMarkdown(text: string) {
  const parts: (string | JSX.Element)[] = []
  const regex = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)|📚/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[0] === '📚') {
      parts.push('📚')
    } else if (match[1]) {
      parts.push(<strong key={match.index} className="font-semibold">{match[1]}</strong>)
    } else if (match[2] && match[3]) {
      parts.push(
        <a key={match.index} href={match[3]} target="_blank" rel="noopener noreferrer" className="text-[#FC6839] underline hover:opacity-80 transition-opacity">
          {match[2]}
        </a>,
      )
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts
}

function UserMessage({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="rounded-2xl px-4 py-3 text-sm max-w-[85%] whitespace-pre-wrap" style={{ backgroundColor: '#FFF0E5', color: '#1a1a1a', border: '1px solid #FFD4B0' }}>
        {msg.content}
      </div>
      {msg.actions && (
        <div className="flex items-center gap-1 mr-1 mt-1">
          <button className="hover:opacity-70 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="mask0_copy" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><rect width="20" height="20" fill="#D9D9D9"/></mask>
              <g mask="url(#mask0_copy)"><path d="M7.5 15C7.04167 15 6.64944 14.8369 6.32333 14.5108C5.99667 14.1842 5.83333 13.7917 5.83333 13.3333V3.33332C5.83333 2.87499 5.99667 2.48249 6.32333 2.15582C6.64944 1.82971 7.04167 1.66666 7.5 1.66666H15C15.4583 1.66666 15.8508 1.82971 16.1775 2.15582C16.5036 2.48249 16.6667 2.87499 16.6667 3.33332V13.3333C16.6667 13.7917 16.5036 14.1842 16.1775 14.5108C15.8508 14.8369 15.4583 15 15 15H7.5ZM7.5 13.3333H15V3.33332H7.5V13.3333ZM4.16667 18.3333C3.70833 18.3333 3.31583 18.1703 2.98917 17.8442C2.66306 17.5175 2.5 17.125 2.5 16.6667V5.83332C2.5 5.59721 2.58 5.39916 2.74 5.23916C2.89944 5.07971 3.09722 4.99999 3.33333 4.99999C3.56944 4.99999 3.7675 5.07971 3.9275 5.23916C4.08694 5.39916 4.16667 5.59721 4.16667 5.83332V16.6667H12.5C12.7361 16.6667 12.9342 16.7467 13.0942 16.9067C13.2536 17.0661 13.3333 17.2639 13.3333 17.5C13.3333 17.7361 13.2536 17.9339 13.0942 18.0933C12.9342 18.2533 12.7361 18.3333 12.5 18.3333H4.16667Z" fill="#6F6F6F"/></g>
            </svg>
          </button>
          <button className="hover:opacity-70 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="mask0_edit" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><rect width="20" height="20" fill="#D9D9D9"/></mask>
              <g mask="url(#mask0_edit)"><path d="M4.16667 15.8334H5.33333L12.5208 8.64585L11.3542 7.47919L4.16667 14.6667V15.8334ZM16.0833 7.43752L12.5417 3.93752L13.7083 2.77085C14.0278 2.45141 14.4203 2.29169 14.8858 2.29169C15.3508 2.29169 15.7431 2.45141 16.0625 2.77085L17.2292 3.93752C17.5486 4.25696 17.7153 4.64252 17.7292 5.09419C17.7431 5.5453 17.5903 5.93058 17.2708 6.25002L16.0833 7.43752ZM3.33333 17.5C3.09722 17.5 2.89944 17.42 2.74 17.26C2.58 17.1006 2.5 16.9028 2.5 16.6667V14.3125C2.5 14.2014 2.52083 14.0939 2.5625 13.99C2.60417 13.8856 2.66667 13.7917 2.75 13.7084L11.3333 5.12502L14.875 8.66669L6.29167 17.25C6.20833 17.3334 6.11472 17.3959 6.01083 17.4375C5.90639 17.4792 5.79861 17.5 5.6875 17.5H3.33333Z" fill="#6F6F6F"/></g>
            </svg>
          </button>
          <button className="hover:opacity-70 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="mask0_delete" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><rect width="20" height="20" fill="#D9D9D9"/></mask>
              <g mask="url(#mask0_delete)"><path d="M5.83301 17.5C5.37467 17.5 4.98245 17.3369 4.65634 17.0108C4.32967 16.6842 4.16634 16.2917 4.16634 15.8333V5C3.93023 5 3.73217 4.92028 3.57217 4.76083C3.41273 4.60083 3.33301 4.40278 3.33301 4.16667C3.33301 3.93056 3.41273 3.7325 3.57217 3.5725C3.73217 3.41306 3.93023 3.33333 4.16634 3.33333H7.49967C7.49967 3.09722 7.57967 2.89917 7.73967 2.73917C7.89912 2.57972 8.0969 2.5 8.33301 2.5H11.6663C11.9025 2.5 12.1005 2.57972 12.2605 2.73917C12.42 2.89917 12.4997 3.09722 12.4997 3.33333H15.833C16.0691 3.33333 16.2669 3.41306 16.4263 3.5725C16.5863 3.7325 16.6663 3.93056 16.6663 4.16667C16.6663 4.40278 16.5863 4.60083 16.4263 4.76083C16.2669 4.92028 16.0691 5 15.833 5V15.8333C15.833 16.2917 15.67 16.6842 15.3438 17.0108C15.0172 17.3369 14.6247 17.5 14.1663 17.5H5.83301ZM5.83301 5V15.8333H14.1663V5H5.83301ZM7.49967 13.3333C7.49967 13.5694 7.57967 13.7672 7.73967 13.9267C7.89912 14.0867 8.0969 14.1667 8.33301 14.1667C8.56912 14.1667 8.76717 14.0867 8.92717 13.9267C9.08662 13.7672 9.16634 13.5694 9.16634 13.3333V7.5C9.16634 7.26389 9.08662 7.06583 8.92717 6.90583C8.76717 6.74639 8.56912 6.66667 8.33301 6.66667C8.0969 6.66667 7.89912 6.74639 7.73967 6.90583C7.57967 7.06583 7.49967 7.26389 7.49967 7.5V13.3333ZM10.833 13.3333C10.833 13.5694 10.913 13.7672 11.073 13.9267C11.2325 14.0867 11.4302 14.1667 11.6663 14.1667C11.9025 14.1667 12.1005 14.0867 12.2605 13.9267C12.42 13.7672 12.4997 13.5694 12.4997 13.3333V7.5C12.4997 7.26389 12.42 7.06583 12.2605 6.90583C12.1005 6.74639 11.9025 6.66667 11.6663 6.66667C11.4302 6.66667 11.2325 6.74639 11.073 6.90583C10.913 7.06583 10.833 7.26389 10.833 7.5V13.3333Z" fill="#6F6F6F"/></g>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

function AiMessage({
  msg,
  expandedTools,
  expandedInfo,
  onToggleTool,
  onToggleInfo,
  onVote,
  selected,
  onToggleSelect,
}: {
  msg: ChatMessage
  expandedTools: Record<string, boolean>
  expandedInfo: Record<string, boolean>
  onToggleTool: (key: string) => void
  onToggleInfo: (key: string) => void
  onVote: (msgId: string, vote: 'up' | 'down') => void
  selected: Record<string, boolean>
  onToggleSelect: (key: string) => void
}) {
  return (
    <div className="flex gap-3 items-start">
      {/* AI avatar */}
      <div className="shrink-0" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}>
        <svg width="28" height="28" viewBox="14 8 62 62" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="19.0464" y="12.4535" width="50.4" height="50.4" rx="25.2" fill="url(#paint_ai_msg)" />
          <path d="M43.0806 28.0993C43.1186 27.8951 43.4112 27.8951 43.4492 28.0993L43.8704 30.3629C44.4091 33.2584 46.6746 35.5236 49.5704 36.0623L51.8342 36.4835C52.0384 36.5215 52.0384 36.814 51.8342 36.852L49.5704 37.2731C46.6746 37.8118 44.4091 40.0771 43.8704 42.9726L43.4492 45.2362C43.4112 45.4404 43.1186 45.4404 43.0806 45.2362L42.6595 42.9726C42.1207 40.0771 39.8552 37.8118 36.9595 37.2731L34.6956 36.852C34.4914 36.814 34.4914 36.5215 34.6956 36.4835L36.9595 36.0623C39.8552 35.5236 42.1207 33.2584 42.6595 30.3629L43.0806 28.0993Z" fill="white"/>
          <path d="M50.898 40.663C50.9127 40.584 51.0259 40.584 51.0406 40.663L51.2035 41.5386C51.4119 42.6586 52.2883 43.5349 53.4084 43.7433L54.2841 43.9062C54.3631 43.9209 54.3631 44.034 54.2841 44.0487L53.4084 44.2116C52.2883 44.42 51.4119 45.2963 51.2035 46.4163L51.0406 47.2919C51.0259 47.3709 50.9127 47.3709 50.898 47.2919L50.7351 46.4163C50.5267 45.2963 49.6504 44.42 48.5302 44.2116L47.6545 44.0487C47.5755 44.034 47.5755 43.9209 47.6545 43.9062L48.5302 43.7433C49.6504 43.5349 50.5267 42.6586 50.7351 41.5386L50.898 40.663Z" fill="white"/>
          <defs>
            <linearGradient id="paint_ai_msg" x1="19.0464" y1="40.0309" x2="69.4464" y2="40.0309" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFB352"/><stop offset="0.5" stopColor="#FC6839"/><stop offset="1" stopColor="#EB2E24"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* Thinking indicator */}
        {msg.thinking && (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#FC6839' }}>
            <div className="w-4 h-4 border-2 border-orange-200 rounded-full animate-spin" style={{ borderTopColor: '#FC6839' }} />
            Thinking...
          </div>
        )}

        {/* Tool call visibility */}
        {msg.toolGroups && msg.toolGroups.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs overflow-hidden">
            {msg.toolGroups.map((group, gi) => {
              const key = `${msg.id}-tg-${gi}`
              const isOpen = expandedTools[key] !== false
              const completedCount = group.tools.filter((t) => t.status === 'complete').length
              const allDone = completedCount === group.tools.length
              return (
                <div key={key} className="mb-2 last:mb-0">
                  <button
                    onClick={() => onToggleTool(key)}
                    className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 transition-colors w-full text-left"
                  >
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    {allDone ? (
                      <span style={{ color: '#FC6839' }}>●</span>
                    ) : (
                      <div className="w-3 h-3 border-2 border-orange-200 rounded-full animate-spin" style={{ borderTopColor: '#FC6839' }} />
                    )}
                    <span className="font-medium">{group.label} ({completedCount}/{group.tools.length})</span>
                    {!allDone && <span className="ml-auto text-gray-400 text-[10px]">Running...</span>}
                  </button>
                  {isOpen && (
                    <div className="ml-5 mt-1.5 flex flex-col gap-1">
                      {group.tools.map((tool, ti) => (
                        <div key={ti} className="flex items-start gap-1.5">
                          {tool.status === 'complete' ? (
                            <span className="mt-px" style={{ color: '#FC6839' }}>✓</span>
                          ) : (
                            <div className="w-3 h-3 border-2 border-orange-200 rounded-full animate-spin mt-px" style={{ borderTopColor: '#FC6839' }} />
                          )}
                          <div>
                            <span className="font-medium text-gray-800">{tool.name}</span>
                            <span className="text-gray-500 ml-1">{tool.description}</span>
                            {tool.result && tool.status === 'complete' && (
                              <div className="text-gray-500 ml-4">{tool.result}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Main content */}
        {msg.content && (
          <div className="text-sm text-gray-900 whitespace-pre-wrap">{renderInlineMarkdown(msg.content)}</div>
        )}

        {/* Proposal rendering */}
        {msg.proposal && <ProposalView proposal={msg.proposal} expandedInfo={expandedInfo} onToggleInfo={onToggleInfo} selected={selected} onToggleSelect={onToggleSelect} />}

        {/* Vote buttons */}
        {msg.showVote && (
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={() => onVote(msg.id, 'up')}
              className="hover:opacity-70 transition-opacity"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id="mask_vote_up" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask>
                <g mask="url(#mask_vote_up)"><path d="M15.0003 17.5H5.83366V6.66665L11.667 0.833313L12.7087 1.87498C12.8059 1.9722 12.8857 2.10415 12.9482 2.27081C13.0107 2.43748 13.042 2.5972 13.042 2.74998V3.04165L12.1253 6.66665H17.5003C17.9448 6.66665 18.3337 6.83331 18.667 7.16665C19.0003 7.49998 19.167 7.88887 19.167 8.33331V9.99998C19.167 10.0972 19.1531 10.2014 19.1253 10.3125C19.0975 10.4236 19.0698 10.5278 19.042 10.625L16.542 16.5C16.417 16.7778 16.2087 17.0139 15.917 17.2083C15.6253 17.4028 15.3198 17.5 15.0003 17.5ZM7.50033 15.8333H15.0003L17.5003 9.99998V8.33331H10.0003L11.1253 3.74998L7.50033 7.37498V15.8333ZM5.83366 6.66665V8.33331H3.33366V15.8333H5.83366V17.5H1.66699V6.66665H5.83366Z" fill={msg.voted === 'up' ? '#FC6839' : '#6F6F6F'}/></g>
              </svg>
            </button>
            <button
              onClick={() => onVote(msg.id, 'down')}
              className="hover:opacity-70 transition-opacity"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id="mask_vote_down" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask>
                <g mask="url(#mask_vote_down)"><path d="M4.99967 2.5H14.1663V13.3333L8.33301 19.1667L7.29134 18.125C7.19412 18.0278 7.11426 17.8958 7.05176 17.7292C6.98926 17.5625 6.95801 17.4028 6.95801 17.25V16.9583L7.87467 13.3333H2.49967C2.05523 13.3333 1.66634 13.1667 1.33301 12.8333C0.999674 12.5 0.833008 12.1111 0.833008 11.6667V10C0.833008 9.90278 0.846897 9.79861 0.874674 9.6875C0.902452 9.57639 0.93023 9.47222 0.958008 9.375L3.45801 3.5C3.58301 3.22222 3.79134 2.98611 4.08301 2.79167C4.37467 2.59722 4.68023 2.5 4.99967 2.5ZM12.4997 4.16667H4.99967L2.49967 10V11.6667H9.99967L8.87467 16.25L12.4997 12.625V4.16667ZM14.1663 13.3333V11.6667H16.6663V4.16667H14.1663V2.5H18.333V13.3333H14.1663Z" fill={msg.voted === 'down' ? '#FC6839' : '#6F6F6F'}/></g>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const confidenceColor: Record<ConfidenceLevel, { icon: string; border: string; bg: string; text: string }> = {
  high: { icon: '#1a7a4c', border: '#86efac', bg: '#f0fdf4', text: '#166534' },
  medium: { icon: '#FC6839', border: '#fdba74', bg: '#fff7ed', text: '#9a3412' },
  low: { icon: '#dc2626', border: '#fca5a5', bg: '#fef2f2', text: '#991b1b' },
}

function ContentCard({
  match,
  infoKey,
  isInfoOpen,
  isSelected,
  onToggleInfo,
  onToggleSelect,
}: {
  match: import('../lib/aiEngine').ContentMatch
  infoKey: string
  isInfoOpen: boolean
  isSelected: boolean
  onToggleInfo: (key: string) => void
  onToggleSelect: (key: string) => void
}) {
  const colors = confidenceColor[match.confidence]

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-visible">
      <div className="flex items-center gap-3 px-3 py-3">
        {/* Thumbnail */}
        <img src={getDemoThumb(match.demo.title)} alt="" className="w-10 h-10 rounded-lg shrink-0" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{match.demo.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{match.demo.creator}</span>
            <span className="text-xs text-[#FC6839] font-semibold">Show more</span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Info icon with confidence tooltip */}
          <div className="relative group/info flex items-center" style={{ '--info-hover': colors.icon } as React.CSSProperties}>
            <button
              onClick={() => onToggleInfo(infoKey)}
              className="flex items-center justify-center [&_path]:transition-colors"
              style={{ width: 20, height: 20 }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover/info:[&_path]:[fill:var(--info-hover)]">
                <mask id={`mask_info_${infoKey}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                  <rect width="20" height="20" fill="#D9D9D9"/>
                </mask>
                <g mask={`url(#mask_info_${infoKey})`}>
                  <path d="M9.99935 14.1666C10.2355 14.1666 10.4335 14.0866 10.5935 13.9266C10.753 13.7672 10.8327 13.5694 10.8327 13.3333V9.97913C10.8327 9.74301 10.753 9.54857 10.5935 9.39579C10.4335 9.24301 10.2355 9.16663 9.99935 9.16663C9.76324 9.16663 9.56546 9.24635 9.40602 9.40579C9.24602 9.56579 9.16602 9.76385 9.16602 9.99996V13.3541C9.16602 13.5902 9.24602 13.7847 9.40602 13.9375C9.56546 14.0902 9.76324 14.1666 9.99935 14.1666ZM9.99935 7.49996C10.2355 7.49996 10.4335 7.41996 10.5935 7.25996C10.753 7.10051 10.8327 6.90274 10.8327 6.66663C10.8327 6.43051 10.753 6.23246 10.5935 6.07246C10.4335 5.91301 10.2355 5.83329 9.99935 5.83329C9.76324 5.83329 9.56546 5.91301 9.40602 6.07246C9.24602 6.23246 9.16602 6.43051 9.16602 6.66663C9.16602 6.90274 9.24602 7.10051 9.40602 7.25996C9.56546 7.41996 9.76324 7.49996 9.99935 7.49996ZM9.99935 18.3333C8.84657 18.3333 7.76324 18.1144 6.74935 17.6766C5.73546 17.2394 4.85352 16.6458 4.10352 15.8958C3.35352 15.1458 2.7599 14.2638 2.32268 13.25C1.8849 12.2361 1.66602 11.1527 1.66602 9.99996C1.66602 8.84718 1.8849 7.76385 2.32268 6.74996C2.7599 5.73607 3.35352 4.85413 4.10352 4.10413C4.85352 3.35413 5.73546 2.76024 6.74935 2.32246C7.76324 1.88524 8.84657 1.66663 9.99935 1.66663C11.1521 1.66663 12.2355 1.88524 13.2493 2.32246C14.2632 2.76024 15.1452 3.35413 15.8952 4.10413C16.6452 4.85413 17.2388 5.73607 17.676 6.74996C18.1138 7.76385 18.3327 8.84718 18.3327 9.99996C18.3327 11.1527 18.1138 12.2361 17.676 13.25C17.2388 14.2638 16.6452 15.1458 15.8952 15.8958C15.1452 16.6458 14.2632 17.2394 13.2493 17.6766C12.2355 18.1144 11.1521 18.3333 9.99935 18.3333ZM9.99935 16.6666C11.8466 16.6666 13.4196 16.0175 14.7185 14.7191C16.0168 13.4202 16.666 11.8472 16.666 9.99996C16.666 8.15274 16.0168 6.57968 14.7185 5.28079C13.4196 3.98246 11.8466 3.33329 9.99935 3.33329C8.15213 3.33329 6.57935 3.98246 5.28102 5.28079C3.98213 6.57968 3.33268 8.15274 3.33268 9.99996C3.33268 11.8472 3.98213 13.4202 5.28102 14.7191C6.57935 16.0175 8.15213 16.6666 9.99935 16.6666Z" fill={isInfoOpen ? colors.icon : '#172537'}/>
                </g>
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/info:opacity-100 transition-opacity shadow-lg z-50"
              style={{ backgroundColor: '#293748' }}
            >
              {confidenceLabel[match.confidence]}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: '#293748' }} />
            </div>
          </div>

          {/* Preview icon */}
          <div className="relative group/preview flex items-center">
            <button className="hover:opacity-70 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id={`mask_eye_${infoKey}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                  <rect width="20" height="20" fill="#D9D9D9"/>
                </mask>
                <g mask={`url(#mask_eye_${infoKey})`}>
                  <path d="M9.99935 13.3334C11.041 13.3334 11.9266 12.9689 12.656 12.24C13.3849 11.5106 13.7493 10.625 13.7493 9.58337C13.7493 8.54171 13.3849 7.65615 12.656 6.92671C11.9266 6.19782 11.041 5.83337 9.99935 5.83337C8.95768 5.83337 8.07213 6.19782 7.34268 6.92671C6.61379 7.65615 6.24935 8.54171 6.24935 9.58337C6.24935 10.625 6.61379 11.5106 7.34268 12.24C8.07213 12.9689 8.95768 13.3334 9.99935 13.3334ZM9.99935 11.8334C9.37435 11.8334 8.84324 11.6145 8.40602 11.1767C7.96824 10.7395 7.74935 10.2084 7.74935 9.58337C7.74935 8.95837 7.96824 8.42698 8.40602 7.98921C8.84324 7.55198 9.37435 7.33337 9.99935 7.33337C10.6243 7.33337 11.1557 7.55198 11.5935 7.98921C12.0307 8.42698 12.2493 8.95837 12.2493 9.58337C12.2493 10.2084 12.0307 10.7395 11.5935 11.1767C11.1557 11.6145 10.6243 11.8334 9.99935 11.8334ZM9.99935 15.8334C8.06879 15.8334 6.3049 15.3231 4.70768 14.3025C3.11046 13.2814 1.90213 11.9028 1.08268 10.1667C1.04102 10.0973 1.01324 10.0103 0.999349 9.90587C0.98546 9.80199 0.978516 9.69448 0.978516 9.58337C0.978516 9.47226 0.98546 9.36449 0.999349 9.26004C1.01324 9.15615 1.04102 9.06949 1.08268 9.00004C1.90213 7.26393 3.11046 5.8856 4.70768 4.86504C6.3049 3.84393 8.06879 3.33337 9.99935 3.33337C11.9299 3.33337 13.6938 3.84393 15.291 4.86504C16.8882 5.8856 18.0966 7.26393 18.916 9.00004C18.9577 9.06949 18.9855 9.15615 18.9993 9.26004C19.0132 9.36449 19.0202 9.47226 19.0202 9.58337C19.0202 9.69448 19.0132 9.80199 18.9993 9.90587C18.9855 10.0103 18.9577 10.0973 18.916 10.1667C18.0966 11.9028 16.8882 13.2814 15.291 14.3025C13.6938 15.3231 11.9299 15.8334 9.99935 15.8334ZM9.99935 14.1667C11.5688 14.1667 13.0099 13.7534 14.3227 12.9267C15.6349 12.1006 16.6382 10.9862 17.3327 9.58337C16.6382 8.1806 15.6349 7.06587 14.3227 6.23921C13.0099 5.4131 11.5688 5.00004 9.99935 5.00004C8.4299 5.00004 6.98879 5.4131 5.67602 6.23921C4.36379 7.06587 3.36046 8.1806 2.66602 9.58337C3.36046 10.9862 4.36379 12.1006 5.67602 12.9267C6.98879 13.7534 8.4299 14.1667 9.99935 14.1667Z" fill="#293748"/>
                </g>
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/preview:opacity-100 transition-opacity shadow-lg z-50" style={{ backgroundColor: '#293748' }}>
              Preview
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: '#293748' }} />
            </div>
          </div>

          {/* Switch icon */}
          <div className="relative group/switch flex items-center">
            <button className="hover:opacity-70 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id={`mask_switch_${infoKey}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                  <rect width="20" height="20" fill="#D9D9D9"/>
                </mask>
                <g mask={`url(#mask_switch_${infoKey})`}>
                  <path d="M10.0417 16.6667C8.18056 16.6667 6.59722 16.0209 5.29167 14.7292C3.98611 13.4375 3.33333 11.8612 3.33333 10V9.85421L2.58333 10.6042C2.43056 10.757 2.23611 10.8334 2 10.8334C1.76389 10.8334 1.56944 10.757 1.41667 10.6042C1.26389 10.4514 1.1875 10.257 1.1875 10.0209C1.1875 9.78476 1.26389 9.59032 1.41667 9.43754L3.58333 7.27087C3.66667 7.18754 3.75694 7.12837 3.85417 7.09337C3.95139 7.05893 4.05556 7.04171 4.16667 7.04171C4.27778 7.04171 4.38194 7.05893 4.47917 7.09337C4.57639 7.12837 4.66667 7.18754 4.75 7.27087L6.91667 9.43754C7.06944 9.59032 7.14583 9.78476 7.14583 10.0209C7.14583 10.257 7.06944 10.4514 6.91667 10.6042C6.76389 10.757 6.56944 10.8334 6.33333 10.8334C6.09722 10.8334 5.90278 10.757 5.75 10.6042L5 9.85421V10C5 11.3889 5.48972 12.5695 6.46917 13.5417C7.44806 14.5139 8.63889 15 10.0417 15C10.3194 15 10.5903 14.9759 10.8542 14.9275C11.1181 14.8787 11.3819 14.8056 11.6458 14.7084C11.7847 14.6528 11.9342 14.6389 12.0942 14.6667C12.2536 14.6945 12.3889 14.7639 12.5 14.875C12.75 15.125 12.8508 15.3923 12.8025 15.6767C12.7536 15.9617 12.5694 16.1598 12.25 16.2709C11.8889 16.3959 11.5244 16.4931 11.1567 16.5625C10.7883 16.632 10.4167 16.6667 10.0417 16.6667ZM15.8333 12.9584C15.7222 12.9584 15.6181 12.9409 15.5208 12.9059C15.4236 12.8714 15.3333 12.8125 15.25 12.7292L13.0833 10.5625C12.9306 10.4098 12.8542 10.2153 12.8542 9.97921C12.8542 9.7431 12.9306 9.54865 13.0833 9.39587C13.2361 9.2431 13.4306 9.16671 13.6667 9.16671C13.9028 9.16671 14.0972 9.2431 14.25 9.39587L15 10.1459V10C15 8.61115 14.5106 7.4306 13.5317 6.45837C12.5522 5.48615 11.3611 5.00004 9.95833 5.00004C9.68056 5.00004 9.40972 5.02448 9.14583 5.07337C8.88194 5.12171 8.61806 5.19449 8.35417 5.29171C8.21528 5.34726 8.06611 5.36115 7.90667 5.33337C7.74667 5.3056 7.61111 5.23615 7.5 5.12504C7.25 4.87504 7.14917 4.60754 7.1975 4.32254C7.24639 4.0381 7.43056 3.84032 7.75 3.72921C8.11111 3.60421 8.47583 3.50699 8.84417 3.43754C9.21194 3.3681 9.58333 3.33337 9.95833 3.33337C11.8194 3.33337 13.4028 3.97921 14.7083 5.27087C16.0139 6.56254 16.6667 8.13893 16.6667 10V10.1459L17.4167 9.39587C17.5694 9.2431 17.7639 9.16671 18 9.16671C18.2361 9.16671 18.4306 9.2431 18.5833 9.39587C18.7361 9.54865 18.8125 9.7431 18.8125 9.97921C18.8125 10.2153 18.7361 10.4098 18.5833 10.5625L16.4167 12.7292C16.3333 12.8125 16.2431 12.8714 16.1458 12.9059C16.0486 12.9409 15.9444 12.9584 15.8333 12.9584Z" fill="#172537"/>
                </g>
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/switch:opacity-100 transition-opacity shadow-lg z-50" style={{ backgroundColor: '#293748' }}>
              Replace
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: '#293748' }} />
            </div>
          </div>

          {/* Add / Selected toggle */}
          <div className="relative group/add flex items-center">
            <button
              onClick={() => onToggleSelect(infoKey)}
              className="transition-all hover:opacity-80"
            >
            {isSelected ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="12" fill="#61B08B"/>
                <mask id={`mask_sel_${infoKey}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="4" y="4" width="16" height="16">
                  <rect x="4" y="4" width="16" height="16" fill="#D9D9D9"/>
                </mask>
                <g mask={`url(#mask_sel_${infoKey})`}>
                  <path d="M10.3664 15.7167C10.2775 15.7167 10.1942 15.7027 10.1164 15.6747C10.0386 15.6472 9.96642 15.6001 9.89976 15.5334L7.03309 12.6667C6.91087 12.5445 6.85242 12.3861 6.85776 12.1914C6.86353 11.9972 6.92753 11.8389 7.04976 11.7167C7.17198 11.5945 7.32753 11.5334 7.51642 11.5334C7.70531 11.5334 7.86087 11.5945 7.98309 11.7167L10.3664 14.1001L16.0164 8.45006C16.1386 8.32783 16.2971 8.26672 16.4918 8.26672C16.686 8.26672 16.8442 8.32783 16.9664 8.45006C17.0886 8.57228 17.1498 8.7305 17.1498 8.92472C17.1498 9.11939 17.0886 9.27783 16.9664 9.40006L10.8331 15.5334C10.7664 15.6001 10.6942 15.6472 10.6164 15.6747C10.5386 15.7027 10.4553 15.7167 10.3664 15.7167Z" fill="white"/>
                </g>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#FC6839" strokeWidth="1.5"/>
                <path d="M12 8v8M8 12h8" stroke="#FC6839" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/add:opacity-100 transition-opacity shadow-lg z-50" style={{ backgroundColor: '#293748' }}>
              {isSelected ? 'Remove' : 'Add'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: '#293748' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Expandable info explanation */}
      {isInfoOpen && (
        <div className="mx-3 mb-3 px-3 py-2.5 rounded-lg text-xs border" style={{ borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }}>
          <strong>Why this content:</strong> {match.relevanceReason}
        </div>
      )}
    </div>
  )
}

function ProposalView({
  proposal,
  expandedInfo,
  onToggleInfo,
  selected,
  onToggleSelect,
}: {
  proposal: DemoProposal
  expandedInfo: Record<string, boolean>
  onToggleInfo: (key: string) => void
  selected: Record<string, boolean>
  onToggleSelect: (key: string) => void
}) {

  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <div className="flex flex-col gap-3 mt-2">
      {/* Discovery question (not shown for single asset) */}
      {proposal.template !== 'single_asset' && (
        <div className="bg-white rounded-xl p-3 border border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Discovery Question</div>
          <div className="text-sm text-gray-900">&ldquo;{proposal.discoveryQuestion}&rdquo;</div>
          <div className="text-xs text-gray-500 mt-2">Each persona below will become an answer branch. Select the content you want under each.</div>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="px-1 text-xs font-medium text-brand-500">
          {selectedCount} content item{selectedCount !== 1 ? 's' : ''} selected
        </div>
      )}

      {/* Per-persona content */}
      {proposal.personas.map((persona, pi) => (
        <div key={pi}>
          <div className="px-1 mb-2">
            <div className="text-sm font-semibold text-gray-900">{persona.name}</div>
            {persona.painPoints.length > 0 && (
              <div className="text-xs text-gray-500 mt-0.5">
                Focus: {persona.painPoints.join(', ')}
              </div>
            )}
          </div>

          {/* Second discovery question for 2-branch template */}
          {proposal.template === '2_disco_branch' && proposal.secondDiscoveryQuestions && (
            <div className="bg-white rounded-xl p-3 border border-gray-200 mb-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Follow-up Question for {persona.name}
              </div>
              <div className="text-sm text-gray-900">
                &ldquo;{proposal.secondDiscoveryQuestions.find((q) => q.persona === persona.name)?.question}&rdquo;
              </div>
            </div>
          )}

          {persona.noMatchReason && (
            <div className="mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <span className="mt-px">⚠️</span>
              <div>
                {persona.noMatchReason}
                <button className="text-brand-500 underline ml-1">View tips for creating content</button>
              </div>
            </div>
          )}

          {persona.painPointMatches && persona.painPointMatches.length >= 2 ? (
            <div className="flex flex-col gap-3">
              {persona.painPointMatches.map((ppGroup, gi) => (
                <div key={gi}>
                  <div className="px-1 mb-1.5">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{ppGroup.painPoint}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {ppGroup.matches.map((match, mi) => {
                      const infoKey = `${pi}-pp${gi}-${mi}`
                      return (
                        <ContentCard
                          key={mi}
                          match={match}
                          infoKey={infoKey}
                          isInfoOpen={!!expandedInfo[infoKey]}
                          isSelected={!!selected[infoKey]}
                          onToggleInfo={onToggleInfo}
                          onToggleSelect={onToggleSelect}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {persona.matches.map((match, mi) => {
                const infoKey = `${pi}-${mi}`
                return (
                  <ContentCard
                    key={mi}
                    match={match}
                    infoKey={infoKey}
                    isInfoOpen={!!expandedInfo[infoKey]}
                    isSelected={!!selected[infoKey]}
                    onToggleInfo={onToggleInfo}
                    onToggleSelect={onToggleSelect}
                  />
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function extractPersonas(text: string): string[] {
  const patterns = [
    /for\s+(.+?)(?:,\s*and\s+|\s+and\s+|,\s*)(.+?)(?:,\s*and\s+|\s+and\s+|,\s*)(.+?)(?:\.|$)/i,
    /for\s+(.+?)(?:\s+and\s+|,\s*)(.+?)(?:\.|$)/i,
    /for\s+(.+?)(?:\.|$)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match.slice(1).map((s) => s.trim()).filter(Boolean)
    }
  }

  const sentences = text.split(/[.,;]/).map((s) => s.trim()).filter((s) => s.length > 3)
  if (sentences.length > 0) {
    return sentences.slice(0, 3)
  }
  return ['General audience']
}

function extractPainPoints(text: string, personas: { name: string }[]): string[][] {
  const numberedParts = text.split(/\d+[.)]\s*/).filter(Boolean)
  if (numberedParts.length >= personas.length) {
    return personas.map((_, i) => [numberedParts[i]?.trim() || 'general solutions'])
  }

  const parts = text.split(/(?:and|,)\s+/).filter(Boolean)
  return personas.map((_, i) => [parts[i]?.trim() || text.trim()])
}
