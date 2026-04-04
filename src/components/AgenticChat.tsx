import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Send, ChevronDown, ChevronRight } from 'lucide-react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import AudioWaveform from './AudioWaveform'
import PreviewModal from './PreviewModal'
import {
  buildProposal,
  generateToolCalls,
  type DemoProposal,
  type ToolGroup,
  type ConfidenceLevel,
  detectIntent,
  extractPersonas,
  extractPainPoints,
  rejectDemo,
  getRejectedIds,
  type CanvasState,
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
  canvasState?: CanvasState
}

export default function AgenticChat({ mode, onFirstSend, onCreateDemo, onToggleContent, onCreateNode, removedDemoIds, inputBottom, canvasState }: Props) {
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
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const prevRemovedRef = useRef<string[]>([])
  const { isListening, toggle: toggleVoice, isSupported: voiceSupported, analyserRef, resetTranscript } = useSpeechRecognition(
    useCallback((text: string) => setInput(text), []),
  )

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

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    if (input) {
      el.style.height = el.scrollHeight + 'px'
    }
  }, [input])
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
    if (isListening) resetTranscript()

    const isFirst = !messages.some((m) => m.role === 'user')

    const processMessage = () => {
      addMessage({ role: 'user', content: text, actions: true })

      // Reject generic meta-descriptions that describe the demo-building task
      // rather than providing actual personas or topics
      const wordCount = text.split(/\s+/).length
      const isMetaDescription = wordCount > 15 && /\b(helping|identify|ask.*question|choose|relevant content|should include|find most important)\b/i.test(text)
      if (isMetaDescription && step !== 'post_proposal') {
        addMessage({
          role: 'ai',
          content: step === 'awaiting_pain_points'
            ? "Could you give me the specific topics as a short list? For example: \"analytics, demo creation, tours, demo management\" — I'll use those as the answer choices and find the best content for each."
            : "I need a bit more structure to work with. Who are the personas this demo is for? For example: \"VPs of Sales and Marketing Directors\".",
        })
        return
      }

      // FSD help sub-flows always take priority when active
      if (step === 'awaiting_fsd_help') { handleFSDHelpResponse(text); return }
      if (step === 'awaiting_fsd_content') { handleFSDContentResponse(text); return }

      // Use intent detection for flexible routing
      const intent = detectIntent(text, personas.length > 0, !!latestProposal)

      if (intent === 'request_fsd' && step !== 'thinking') {
        handleFSDRequest(text)
        return
      }

      // Handle "provide_both" — user gave personas + pain points in one message
      if (intent === 'provide_both') {
        const extracted = extractPersonas(text)
        const updatedPersonas = extracted.map((n) => ({ name: n, painPoints: [] as string[] }))
        const painPointsByPersona = extractPainPoints(text, updatedPersonas)
        const withPainPoints = updatedPersonas.map((p, i) => ({
          ...p,
          painPoints: painPointsByPersona[i]?.length > 0 ? painPointsByPersona[i] : ['general solutions'],
        }))
        setPersonas(withPainPoints)
        setStep('thinking')
        const thinkingId = addMessage({
          role: 'ai', content: '', thinking: true,
          toolGroups: generateToolCalls(withPainPoints),
        })
        simulateToolProgress(thinkingId, withPainPoints)
        return
      }

      // Route based on intent, with fallback to step-based logic
      switch (intent) {
        case 'provide_personas':
          handlePurposeResponse(text)
          break
        case 'provide_pain_points':
          if (personas.length > 0) {
            handlePainPointsResponse(text)
          } else {
            // They gave pain points but no personas yet — ask for personas
            addMessage({
              role: 'ai',
              content: "I'd love to work with those priorities! Who are the personas or audiences you're building this for?",
            })
            setStep('awaiting_purpose')
          }
          break
        case 'request_more_content':
          handleMoreContentRequest(text)
          break
        case 'satisfied':
          handleSatisfied()
          break
        case 'create_demo':
          handleSatisfied()
          break
        case 'request_changes':
          handleChangeRequest(text)
          break
        case 'ask_question':
          handleQuestion(text)
          break
        default:
          // Fall back to step-based routing
          if (step === 'awaiting_purpose') handlePurposeResponse(text)
          else if (step === 'awaiting_pain_points') {
            // Check if the text is specific topics or a generic description
            const parts = text.split(/[,;.\n]/).map(s => s.trim()).filter(s => s.length > 2)
            const avgWords = parts.reduce((s, p) => s + p.split(/\s+/).length, 0) / (parts.length || 1)
            if (avgWords > 8) {
              addMessage({
                role: 'ai',
                content: "Could you give me the specific topics as a short list? For example: \"event management, lead capture, product demos\" — I'll use those as the answer choices and find the best content for each.",
              })
            } else {
              handlePainPointsResponse(text)
            }
          }
          else if (step === 'post_proposal') handleMoreContentRequest(text)
          else if (step === 'survey') {
            addMessage({ role: 'ai', content: "Thanks for the feedback! I'll keep improving. Your demo is ready on the canvas — feel free to edit anything directly." })
          } else {
            addMessage({
              role: 'ai',
              content: "I'm not sure I understood that. Could you tell me more about the demo you're building and who it's for?",
            })
          }
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
    const isGeneric = extractedPersonas.length === 1 && extractedPersonas[0] === 'General audience'

    if (isGeneric) {
      setPersonas([{ name: 'General audience', painPoints: [] }])
      setTimeout(() => {
        addMessage({
          role: 'ai',
          content: "Got it! Who are the main personas or audiences this demo is for? For example: \"VPs of Sales and Marketing Directors\" or \"IT Admins and End Users\".",
        })
        setStep('awaiting_purpose')
      }, 1200)
      return
    }

    setPersonas(extractedPersonas.map((n) => ({ name: n, painPoints: [] })))

    setTimeout(() => {
      const label = extractedPersonas.length > 1 ? 'Personas' : 'Persona'
      const personaList = extractedPersonas.map((p, i) => `${i + 1}. ${label}: ${p}`).join('\n')
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

    // If every persona only got 'general solutions', the input wasn't usable topics
    const allGeneric = painPointsByPersona.every(pp =>
      pp.length === 1 && pp[0] === 'general solutions'
    )
    if (allGeneric) {
      addMessage({
        role: 'ai',
        content: "Could you give me the specific topics as a short list? For example: \"event management, lead capture, product demos\" — I'll use those as the answer choices and find the best content for each.",
      })
      return
    }

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
                // Only put the single best-performing content on stage per topic
                const best = ppGroup.matches[0]
                if (best) {
                  const key = `${pi}-pp${gi}-0`
                  autoSelected[key] = true
                  autoItems.push({ persona: persona.name, demo: best })
                }
              })
            } else {
              const best = persona.matches[0]
              if (best) {
                const key = `${pi}-0`
                autoSelected[key] = true
                autoItems.push({ persona: persona.name, demo: best })
              }
            }
          })

          setGlobalSelected(autoSelected)

          addMessage({
            role: 'ai',
            content: `Here's what I put together — I placed the highest-performing content on the canvas for each topic. You can swap or adjust anything you want:`,
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

    addMessage({ role: 'ai', content: '', thinking: true, toolGroups: [{ label: 'Searching for more content', tools: [{ name: 'search_library', description: 'Searching demo library for additional matches...', status: 'running' }, ...(getRejectedIds().size > 0 ? [{ name: 'filter_rejected', description: `Excluding ${getRejectedIds().size} previously rejected item${getRejectedIds().size !== 1 ? 's' : ''}`, status: 'running' as const }] : []) ] }] })

    setTimeout(() => {
      const proposal = buildProposal(personas, newOffset, getRejectedIds())
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
              const best = ppGroup.matches[0]
              if (best) {
                const key = `${pi}-pp${gi}-0`
                autoSelected[key] = true
                autoItems.push({ persona: persona.name, demo: best })
              }
            })
          } else {
            const best = persona.matches[0]
            if (best) {
              const key = `${pi}-0`
              autoSelected[key] = true
              autoItems.push({ persona: persona.name, demo: best })
            }
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

  const handleSatisfied = () => {
    addMessage({
      role: 'ai',
      content: "Glad you like it! The demo is already on the canvas — feel free to edit, swap content, or rearrange elements anytime.",
    })
  }

  const handleChangeRequest = (text: string) => {
    const lower = text.toLowerCase()
    if (/swap|switch|replace/i.test(lower)) {
      addMessage({
        role: 'ai',
        content: "You can swap content directly by clicking the replace icon on any content card in the chat, or deselect it and pick a different one. I can also search for more options — just tell me what you're looking for.",
      })
    } else if (/remove|delete/i.test(lower)) {
      addMessage({
        role: 'ai',
        content: "You can remove content from the canvas by clicking the X on any card, or deselect it in the chat. What would you like to change?",
      })
    } else {
      addMessage({
        role: 'ai',
        content: "I can help with changes! You can edit content directly on the canvas, or tell me what you'd like different and I'll search for alternatives.",
      })
    }
    setStep('post_proposal')
  }

  const handleQuestion = (text: string) => {
    const lower = text.toLowerCase()
    if (/how.*work|what.*do/i.test(lower) && /discovery|question/i.test(lower)) {
      addMessage({
        role: 'ai',
        content: "A discovery question lets your viewers self-select their path. They see a question with multiple answers, and each answer leads to content tailored to that choice. It's great for personalizing the demo experience based on role, interest, or use case.",
      })
    } else if (/template|structure|flow/i.test(lower)) {
      addMessage({
        role: 'ai',
        content: "I use three templates based on your personas:\n\n• **Single Asset** — one video or tour for one persona\n• **1 Discovery Branch** — a question that routes to different content per persona\n• **2 Discovery Branches** — two levels of questions for deeper personalization\n\nThe template is automatically chosen based on how many personas and pain points you give me.",
      })
    } else if (/confidence|rating|score|high|medium|low/i.test(lower)) {
      addMessage({
        role: 'ai',
        content: "Content confidence is based on two factors:\n\n• **✅ High** — strong keyword match + above-average engagement\n• **🟡 Medium** — strong keyword match but lower engagement\n• **❌ Low** — indirect match and lower engagement\n\nHigher confidence means the content is more likely to resonate with your audience.",
      })
    } else {
      addMessage({
        role: 'ai',
        content: "Great question! I can help with building demos, selecting content, and structuring discovery flows. What would you like to know more about?",
      })
    }
  }

  const handleVote = (msgId: string, vote: 'up' | 'down') => {
    updateMessage(msgId, { voted: vote })
    if (vote === 'down') {
      setShowFeedbackInput(true)
      // Reject all content from the current proposal so we don't resurface it
      if (latestProposal) {
        latestProposal.personas.forEach((p) => {
          p.matches.forEach((m) => rejectDemo(m.demo.id))
        })
      }
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
                  pulseGlow={msg.role === 'ai' && idx === messages.length - 1 && messages[messages.length - 1].role === 'ai'}
                  expandedTools={expandedTools}
                  expandedInfo={expandedInfo}
                  onToggleTool={toggleToolGroup}
                  onToggleInfo={toggleInfo}
                  onVote={handleVote}
                  selected={globalSelected}
                  dismissed={dismissed}
                  onToggleSelect={(key) => {
                    const nowSelected = !globalSelected[key]

                    if (latestProposal && onToggleContent) {
                      const ppMatch = key.match(/^(\d+)-pp(\d+)-(\d+)$/)
                      const flatMatch = key.match(/^(\d+)-(\d+)$/)
                      let match: import('../lib/aiEngine').ContentMatch | undefined

                      if (ppMatch) {
                        const [, pi, gi, mi] = ppMatch.map(Number)
                        match = latestProposal.personas[pi]?.painPointMatches?.[gi]?.matches[mi]

                        if (nowSelected) {
                          const group = latestProposal.personas[pi]?.painPointMatches?.[gi]
                          if (group) {
                            const updatedSelected = { ...globalSelected, [key]: true }
                            group.matches.forEach((_, otherMi) => {
                              if (otherMi === mi) return
                              const otherKey = `${pi}-pp${gi}-${otherMi}`
                              if (globalSelected[otherKey]) {
                                updatedSelected[otherKey] = false
                                const otherMatch = group.matches[otherMi]
                                if (otherMatch) {
                                  onToggleContent(otherMatch, false)
                                  rejectDemo(otherMatch.demo.id)
                                }
                              }
                            })
                            setGlobalSelected(updatedSelected)
                          } else {
                            setGlobalSelected((prev) => ({ ...prev, [key]: true }))
                          }
                        } else {
                          setGlobalSelected((prev) => ({ ...prev, [key]: false }))
                        }
                      } else if (flatMatch) {
                        const [, pi, mi] = flatMatch.map(Number)
                        match = latestProposal.personas[pi]?.matches[mi]
                        setGlobalSelected((prev) => ({ ...prev, [key]: nowSelected }))
                      } else {
                        setGlobalSelected((prev) => ({ ...prev, [key]: nowSelected }))
                      }

                      if (match) {
                        onToggleContent(match, nowSelected)
                        if (!nowSelected) rejectDemo(match.demo.id)
                      }
                    } else {
                      setGlobalSelected((prev) => ({ ...prev, [key]: nowSelected }))
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
            ? 'pointer-events-auto mt-[18px]'
            : 'border-t border-gray-100 p-4 bg-white'
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
          className="bg-white flex flex-col transition-shadow duration-200"
          style={{
            minHeight: 60,
            borderRadius: 6,
            ...(mode === 'full' ? { maxWidth: 640, margin: '0 auto', transition: 'min-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, border-color 0.2s ease' } : {}),
            border: inputFocused ? '2px solid #F44C10' : '1px solid #D0CBC6',
            boxShadow: inputFocused ? '0 0 0 5px rgba(255, 150, 89, 0.5)' : 'none',
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
              rows={1}
              style={{ maxHeight: 200 }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </div>
          <div className="flex items-center px-4 pb-3">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { toggleVoice(); textareaRef.current?.focus() }}
              disabled={!voiceSupported}
              className={`shrink-0 transition-colors ${
                isListening
                  ? 'text-red-500 animate-pulse'
                  : voiceSupported
                    ? 'text-gray-400 hover:text-gray-600'
                    : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <Mic size={18} />
            </button>
            <div className="flex-1" style={{ padding: '0 24px' }}>
              <AudioWaveform analyserRef={analyserRef} active={isListening} />
            </div>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSend}
              className="shrink-0 transition-colors"
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
    <div className="flex flex-col items-end">
      <div className="px-4 py-3 text-sm max-w-[85%] whitespace-pre-wrap" style={{ backgroundColor: '#FFF0E5', color: '#1a1a1a', border: '1px solid #FFD4B0', borderRadius: 8 }}>
        {msg.content}
      </div>
      {msg.actions && (
        <div className="flex items-center mr-1" style={{ gap: 16, marginTop: 16 }}>
          <button className="hover:opacity-70 transition-opacity">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="mask0_copy" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><rect width="20" height="20" fill="#D9D9D9"/></mask>
              <g mask="url(#mask0_copy)"><path d="M7.5 15C7.04167 15 6.64944 14.8369 6.32333 14.5108C5.99667 14.1842 5.83333 13.7917 5.83333 13.3333V3.33332C5.83333 2.87499 5.99667 2.48249 6.32333 2.15582C6.64944 1.82971 7.04167 1.66666 7.5 1.66666H15C15.4583 1.66666 15.8508 1.82971 16.1775 2.15582C16.5036 2.48249 16.6667 2.87499 16.6667 3.33332V13.3333C16.6667 13.7917 16.5036 14.1842 16.1775 14.5108C15.8508 14.8369 15.4583 15 15 15H7.5ZM7.5 13.3333H15V3.33332H7.5V13.3333ZM4.16667 18.3333C3.70833 18.3333 3.31583 18.1703 2.98917 17.8442C2.66306 17.5175 2.5 17.125 2.5 16.6667V5.83332C2.5 5.59721 2.58 5.39916 2.74 5.23916C2.89944 5.07971 3.09722 4.99999 3.33333 4.99999C3.56944 4.99999 3.7675 5.07971 3.9275 5.23916C4.08694 5.39916 4.16667 5.59721 4.16667 5.83332V16.6667H12.5C12.7361 16.6667 12.9342 16.7467 13.0942 16.9067C13.2536 17.0661 13.3333 17.2639 13.3333 17.5C13.3333 17.7361 13.2536 17.9339 13.0942 18.0933C12.9342 18.2533 12.7361 18.3333 12.5 18.3333H4.16667Z" fill="#8D8A87"/></g>
            </svg>
          </button>
          <button className="hover:opacity-70 transition-opacity">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="mask0_edit" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><rect width="20" height="20" fill="#D9D9D9"/></mask>
              <g mask="url(#mask0_edit)"><path d="M4.16667 15.8334H5.33333L12.5208 8.64585L11.3542 7.47919L4.16667 14.6667V15.8334ZM16.0833 7.43752L12.5417 3.93752L13.7083 2.77085C14.0278 2.45141 14.4203 2.29169 14.8858 2.29169C15.3508 2.29169 15.7431 2.45141 16.0625 2.77085L17.2292 3.93752C17.5486 4.25696 17.7153 4.64252 17.7292 5.09419C17.7431 5.5453 17.5903 5.93058 17.2708 6.25002L16.0833 7.43752ZM3.33333 17.5C3.09722 17.5 2.89944 17.42 2.74 17.26C2.58 17.1006 2.5 16.9028 2.5 16.6667V14.3125C2.5 14.2014 2.52083 14.0939 2.5625 13.99C2.60417 13.8856 2.66667 13.7917 2.75 13.7084L11.3333 5.12502L14.875 8.66669L6.29167 17.25C6.20833 17.3334 6.11472 17.3959 6.01083 17.4375C5.90639 17.4792 5.79861 17.5 5.6875 17.5H3.33333Z" fill="#8D8A87"/></g>
            </svg>
          </button>
          <button className="hover:opacity-70 transition-opacity">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="mask0_delete" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><rect width="20" height="20" fill="#D9D9D9"/></mask>
              <g mask="url(#mask0_delete)"><path d="M5.83301 17.5C5.37467 17.5 4.98245 17.3369 4.65634 17.0108C4.32967 16.6842 4.16634 16.2917 4.16634 15.8333V5C3.93023 5 3.73217 4.92028 3.57217 4.76083C3.41273 4.60083 3.33301 4.40278 3.33301 4.16667C3.33301 3.93056 3.41273 3.7325 3.57217 3.5725C3.73217 3.41306 3.93023 3.33333 4.16634 3.33333H7.49967C7.49967 3.09722 7.57967 2.89917 7.73967 2.73917C7.89912 2.57972 8.0969 2.5 8.33301 2.5H11.6663C11.9025 2.5 12.1005 2.57972 12.2605 2.73917C12.42 2.89917 12.4997 3.09722 12.4997 3.33333H15.833C16.0691 3.33333 16.2669 3.41306 16.4263 3.5725C16.5863 3.7325 16.6663 3.93056 16.6663 4.16667C16.6663 4.40278 16.5863 4.60083 16.4263 4.76083C16.2669 4.92028 16.0691 5 15.833 5V15.8333C15.833 16.2917 15.67 16.6842 15.3438 17.0108C15.0172 17.3369 14.6247 17.5 14.1663 17.5H5.83301ZM5.83301 5V15.8333H14.1663V5H5.83301ZM7.49967 13.3333C7.49967 13.5694 7.57967 13.7672 7.73967 13.9267C7.89912 14.0867 8.0969 14.1667 8.33301 14.1667C8.56912 14.1667 8.76717 14.0867 8.92717 13.9267C9.08662 13.7672 9.16634 13.5694 9.16634 13.3333V7.5C9.16634 7.26389 9.08662 7.06583 8.92717 6.90583C8.76717 6.74639 8.56912 6.66667 8.33301 6.66667C8.0969 6.66667 7.89912 6.74639 7.73967 6.90583C7.57967 7.06583 7.49967 7.26389 7.49967 7.5V13.3333ZM10.833 13.3333C10.833 13.5694 10.913 13.7672 11.073 13.9267C11.2325 14.0867 11.4302 14.1667 11.6663 14.1667C11.9025 14.1667 12.1005 14.0867 12.2605 13.9267C12.42 13.7672 12.4997 13.5694 12.4997 13.3333V7.5C12.4997 7.26389 12.42 7.06583 12.2605 6.90583C12.1005 6.74639 11.9025 6.66667 11.6663 6.66667C11.4302 6.66667 11.2325 6.74639 11.073 6.90583C10.913 7.06583 10.833 7.26389 10.833 7.5V13.3333Z" fill="#8D8A87"/></g>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

function AiMessage({
  msg,
  pulseGlow,
  expandedTools,
  expandedInfo,
  onToggleTool,
  onToggleInfo,
  onVote,
  selected,
  dismissed,
  onToggleSelect,
}: {
  msg: ChatMessage
  pulseGlow?: boolean
  expandedTools: Record<string, boolean>
  expandedInfo: Record<string, boolean>
  onToggleTool: (key: string) => void
  onToggleInfo: (key: string) => void
  onVote: (msgId: string, vote: 'up' | 'down') => void
  selected: Record<string, boolean>
  dismissed: Set<string>
  onToggleSelect: (key: string) => void
}) {
  return (
    <div className="flex gap-3 items-start">
      {/* AI avatar */}
      <div className="shrink-0" style={{ marginTop: -4, ...(pulseGlow ? { animation: 'pulse-glow 3s ease-in-out infinite' } : {}) }}>
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
              const completedCount = group.tools.filter((t) => t.status === 'complete').length
              const allDone = completedCount === group.tools.length
              const isOpen = expandedTools[key] !== undefined ? expandedTools[key] : !allDone
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
        {msg.proposal && <ProposalView proposal={msg.proposal} expandedInfo={expandedInfo} onToggleInfo={onToggleInfo} selected={selected} dismissed={dismissed} onToggleSelect={onToggleSelect} />}

        {/* Vote buttons */}
        {msg.showVote && (
          <div className="flex items-center" style={{ gap: 16, marginTop: 8 }}>
            <button
              onClick={() => onVote(msg.id, 'up')}
              className="hover:opacity-70 transition-opacity"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id="mask_vote_up" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask>
                <g mask="url(#mask_vote_up)"><path d="M15.0003 17.5H5.83366V6.66665L11.667 0.833313L12.7087 1.87498C12.8059 1.9722 12.8857 2.10415 12.9482 2.27081C13.0107 2.43748 13.042 2.5972 13.042 2.74998V3.04165L12.1253 6.66665H17.5003C17.9448 6.66665 18.3337 6.83331 18.667 7.16665C19.0003 7.49998 19.167 7.88887 19.167 8.33331V9.99998C19.167 10.0972 19.1531 10.2014 19.1253 10.3125C19.0975 10.4236 19.0698 10.5278 19.042 10.625L16.542 16.5C16.417 16.7778 16.2087 17.0139 15.917 17.2083C15.6253 17.4028 15.3198 17.5 15.0003 17.5ZM7.50033 15.8333H15.0003L17.5003 9.99998V8.33331H10.0003L11.1253 3.74998L7.50033 7.37498V15.8333ZM5.83366 6.66665V8.33331H3.33366V15.8333H5.83366V17.5H1.66699V6.66665H5.83366Z" fill={msg.voted === 'up' ? '#FC6839' : '#8D8A87'}/></g>
              </svg>
            </button>
            <button
              onClick={() => onVote(msg.id, 'down')}
              className="hover:opacity-70 transition-opacity"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id="mask_vote_down" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask>
                <g mask="url(#mask_vote_down)"><path d="M4.99967 2.5H14.1663V13.3333L8.33301 19.1667L7.29134 18.125C7.19412 18.0278 7.11426 17.8958 7.05176 17.7292C6.98926 17.5625 6.95801 17.4028 6.95801 17.25V16.9583L7.87467 13.3333H2.49967C2.05523 13.3333 1.66634 13.1667 1.33301 12.8333C0.999674 12.5 0.833008 12.1111 0.833008 11.6667V10C0.833008 9.90278 0.846897 9.79861 0.874674 9.6875C0.902452 9.57639 0.93023 9.47222 0.958008 9.375L3.45801 3.5C3.58301 3.22222 3.79134 2.98611 4.08301 2.79167C4.37467 2.59722 4.68023 2.5 4.99967 2.5ZM12.4997 4.16667H4.99967L2.49967 10V11.6667H9.99967L8.87467 16.25L12.4997 12.625V4.16667ZM14.1663 13.3333V11.6667H16.6663V4.16667H14.1663V2.5H18.333V13.3333H14.1663Z" fill={msg.voted === 'down' ? '#FC6839' : '#8D8A87'}/></g>
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
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="border bg-white overflow-visible" style={{ borderColor: isSelected ? '#FC6839' : '#D0CBC6', borderRadius: 8 }}>
      {showPreview && (
        <PreviewModal url={match.demo.preview} title={match.demo.title} onClose={() => setShowPreview(false)} />
      )}
      <div className="flex items-center" style={{ padding: 16, gap: 12 }}>
        {/* Thumbnail */}
        <img src={getDemoThumb(match.demo.title)} alt="" className="shrink-0 object-cover" style={{ width: 31, height: 31, borderRadius: 4 }} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: '#172537' }}>{match.demo.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs" style={{ color: '#6F6F6F' }}>{match.demo.creator}</span>
            <span className="text-xs font-semibold" style={{ color: '#FC6839' }}>Show more</span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center shrink-0" style={{ gap: 10 }}>
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
            <button className="hover:opacity-70 transition-opacity" onClick={() => setShowPreview(true)}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id={`mask_eye_${infoKey}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="18" height="18">
                  <rect width="18" height="18" fill="#D9D9D9"/>
                </mask>
                <g mask={`url(#mask_eye_${infoKey})`}>
                  <path d="M8.99961 12C9.93711 12 10.7341 11.672 11.3906 11.016C12.0466 10.3595 12.3746 9.5625 12.3746 8.625C12.3746 7.6875 12.0466 6.8905 11.3906 6.234C10.7341 5.578 9.93711 5.25 8.99961 5.25C8.06211 5.25 7.26511 5.578 6.60861 6.234C5.95261 6.8905 5.62461 7.6875 5.62461 8.625C5.62461 9.5625 5.95261 10.3595 6.60861 11.016C7.26511 11.672 8.06211 12 8.99961 12ZM8.99961 10.65C8.43711 10.65 7.95911 10.453 7.56561 10.059C7.17161 9.6655 6.97461 9.1875 6.97461 8.625C6.97461 8.0625 7.17161 7.58425 7.56561 7.19025C7.95911 6.79675 8.43711 6.6 8.99961 6.6C9.56211 6.6 10.0404 6.79675 10.4344 7.19025C10.8279 7.58425 11.0246 8.0625 11.0246 8.625C11.0246 9.1875 10.8279 9.6655 10.4344 10.059C10.0404 10.453 9.56211 10.65 8.99961 10.65ZM8.99961 14.25C7.26211 14.25 5.67461 13.7908 4.23711 12.8723C2.79961 11.9533 1.71211 10.7125 0.974609 9.15C0.937109 9.0875 0.912109 9.00925 0.899609 8.91525C0.887109 8.82175 0.880859 8.725 0.880859 8.625C0.880859 8.525 0.887109 8.428 0.899609 8.334C0.912109 8.2405 0.937109 8.1625 0.974609 8.1C1.71211 6.5375 2.79961 5.297 4.23711 4.3785C5.67461 3.4595 7.26211 3 8.99961 3C10.7371 3 12.3246 3.4595 13.7621 4.3785C15.1996 5.297 16.2871 6.5375 17.0246 8.1C17.0621 8.1625 17.0871 8.2405 17.0996 8.334C17.1121 8.428 17.1184 8.525 17.1184 8.625C17.1184 8.725 17.1121 8.82175 17.0996 8.91525C17.0871 9.00925 17.0621 9.0875 17.0246 9.15C16.2871 10.7125 15.1996 11.9533 13.7621 12.8723C12.3246 13.7908 10.7371 14.25 8.99961 14.25ZM8.99961 12.75C10.4121 12.75 11.7091 12.378 12.8906 11.634C14.0716 10.8905 14.9746 9.8875 15.5996 8.625C14.9746 7.3625 14.0716 6.35925 12.8906 5.61525C11.7091 4.87175 10.4121 4.5 8.99961 4.5C7.58711 4.5 6.29011 4.87175 5.10861 5.61525C3.92761 6.35925 3.02461 7.3625 2.39961 8.625C3.02461 9.8875 3.92761 10.8905 5.10861 11.634C6.29011 12.378 7.58711 12.75 8.99961 12.75Z" fill="#293748"/>
                </g>
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/preview:opacity-100 transition-opacity shadow-lg z-50" style={{ backgroundColor: '#293748' }}>
              Preview
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
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="28" height="28" rx="14" fill="#61B08B" stroke="#61B08B" strokeWidth="2"/>
                <mask id={`mask_sel_${infoKey}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="5" y="5" width="20" height="20">
                  <rect x="5" y="5" width="20" height="20" fill="#D9D9D9"/>
                </mask>
                <g mask={`url(#mask_sel_${infoKey})`}>
                  <path d="M13.0831 19.6459C12.9719 19.6459 12.8678 19.6284 12.7706 19.5934C12.6733 19.559 12.5831 19.5001 12.4998 19.4167L9.41642 16.3334C9.26364 16.1806 9.19031 15.9826 9.19697 15.7392C9.2042 15.4965 9.28419 15.2987 9.43697 15.1459C9.58975 14.9931 9.7842 14.9167 10.0203 14.9167C10.2564 14.9167 10.4509 14.9931 10.6037 15.1459L13.0831 17.6251L20.1453 10.5626C20.2981 10.4098 20.4962 10.3334 20.7395 10.3334C20.9823 10.3334 21.1801 10.4098 21.3328 10.5626C21.4856 10.7153 21.562 10.9131 21.562 11.1559C21.562 11.3993 21.4856 11.5973 21.3328 11.7501L13.6664 19.4167C13.5831 19.5001 13.4928 19.559 13.3956 19.5934C13.2984 19.6284 13.1942 19.6459 13.0831 19.6459Z" fill="white"/>
                </g>
              </svg>
            ) : (
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="28" height="28" rx="14" stroke="#FC6839" strokeWidth="2" fill="none"/>
                <mask id={`mask_add_${infoKey}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="6" y="6" width="18" height="18">
                  <rect x="6" y="6" width="18" height="18" fill="#D9D9D9"/>
                </mask>
                <g mask={`url(#mask_add_${infoKey})`}>
                  <path d="M15 20.25C14.7875 20.25 14.6095 20.178 14.466 20.034C14.322 19.8905 14.25 19.7125 14.25 19.5V15.75H10.5C10.2875 15.75 10.1093 15.678 9.96525 15.534C9.82175 15.3905 9.75 15.2125 9.75 15C9.75 14.7875 9.82175 14.6093 9.96525 14.4653C10.1093 14.3218 10.2875 14.25 10.5 14.25H14.25V10.5C14.25 10.2875 14.322 10.1093 14.466 9.96525C14.6095 9.82175 14.7875 9.75 15 9.75C15.2125 9.75 15.3908 9.82175 15.5348 9.96525C15.6783 10.1093 15.75 10.2875 15.75 10.5V14.25H19.5C19.7125 14.25 19.8905 14.3218 20.034 14.4653C20.178 14.6093 20.25 14.7875 20.25 15C20.25 15.2125 20.178 15.3905 20.034 15.534C19.8905 15.678 19.7125 15.75 19.5 15.75H15.75V19.5C15.75 19.7125 15.6783 19.8905 15.5348 20.034C15.3908 20.178 15.2125 20.25 15 20.25Z" fill="#F44C10"/>
                </g>
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
        <div className="px-3 py-2.5 rounded-lg text-xs border" style={{ margin: '0 16px 16px', borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }}>
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
  dismissed,
  onToggleSelect,
}: {
  proposal: DemoProposal
  expandedInfo: Record<string, boolean>
  onToggleInfo: (key: string) => void
  selected: Record<string, boolean>
  dismissed: Set<string>
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

      {/* Per-persona content */}
      {proposal.personas.map((persona, pi) => (
        <div key={pi} style={pi > 0 ? { marginTop: 16 } : undefined}>
          <div className="px-1">
            <div className="text-sm text-gray-900"><span className="font-semibold">{proposal.personas.length > 1 ? 'Personas' : 'Persona'}:</span> {persona.name}</div>
            {persona.painPoints.length > 0 && (
              <div className="text-sm text-gray-900 mt-0.5">
                <span className="font-semibold">Focus:</span> {persona.painPoints.join(', ')}
              </div>
            )}
          </div>

          {pi === 0 && selectedCount > 0 && (
            <div className="px-1 text-xs font-medium flex items-center gap-1.5 text-gray-900" style={{ marginTop: 16, marginBottom: 24 }}>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold" style={{ backgroundColor: '#FC6839' }}>{selectedCount}</span>
              content item{selectedCount !== 1 ? 's' : ''} selected
            </div>
          )}

          {/* Second discovery question for 2-branch template */}
          {proposal.template === '2_disco_branch' && proposal.secondDiscoveryQuestions && (
            <div className="bg-white rounded-xl p-3 border border-gray-200 mb-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Follow-up Question for {proposal.personas.length > 1 ? 'Personas' : 'Persona'}: {persona.name}
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
            <div className="flex flex-col gap-7">
              {persona.painPointMatches.map((ppGroup, gi) => (
                <div key={gi}>
                  <div className="px-1 mb-1.5">
                    <div className="font-semibold text-gray-900 uppercase tracking-wider" style={{ fontSize: 9 }}>{ppGroup.painPoint}</div>
                  </div>
                  <div className="flex flex-col" style={{ gap: 12 }}>
                    {ppGroup.matches.map((match, mi) => {
                      const infoKey = `${pi}-pp${gi}-${mi}`
                      if (dismissed.has(infoKey)) return null
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
            <div className="flex flex-col" style={{ gap: 12 }}>
              {persona.matches.map((match, mi) => {
                const infoKey = `${pi}-${mi}`
                if (dismissed.has(infoKey)) return null
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

