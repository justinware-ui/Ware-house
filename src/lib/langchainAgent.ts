import { ChatOpenAI } from '@langchain/openai'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { tool } from '@langchain/core/tools'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'
import {
  buildProposal,
  generateToolCalls,
  extractPersonas,
  extractPainPoints,
  detectIntent,
  selectTemplate,
  getTemplateLabel,
  getTemplateDescription,
  type DemoProposal,
  type ToolGroup,
} from './aiEngine'
import type { AgentRequestState, AgentResponse } from '@/types/agent'

// ─── Mutable context shared between tools in a single request ──────────────

interface RunContext {
  proposal?: DemoProposal
  toolGroups?: ToolGroup[]
  personas?: { name: string; painPoints: string[] }[]
  nodeType?: 'fullScreenDialogNode' | 'ctaNode'
  fsdContent?: { header: string; message: string }
  intent?: string
  showPersonaPicker?: boolean
  showTemplatePicker?: boolean
  showVote?: boolean
  step?: string
  contentOffset?: number
}

// ─── Build tools for a single request (context-bound) ─────────────────────

function createTools(state: AgentRequestState, ctx: RunContext) {
  const extractPersonasAndPainPointsTool = tool(
    async ({ text }) => {
      const personas = extractPersonas(text)
      const personaObjs = personas.map((n) => ({ name: n, painPoints: [] as string[] }))
      const painPointsByPersona = extractPainPoints(text, personaObjs)
      const withPainPoints = personaObjs.map((p, i) => ({
        ...p,
        painPoints:
          painPointsByPersona[i]?.length > 0 ? painPointsByPersona[i] : ['general solutions'],
      }))
      ctx.personas = withPainPoints
      return JSON.stringify({ personas: withPainPoints })
    },
    {
      name: 'extract_personas_and_pain_points',
      description:
        'Extract persona names and their pain points/topics from user text. Use when the user provides information about their target audience.',
      schema: z.object({
        text: z.string().describe('The user text to extract personas and pain points from'),
      }),
    },
  )

  const buildDemoProposalTool = tool(
    async ({ personas, contentOffset, rejectedIds }) => {
      const allRejected = new Set([...(rejectedIds ?? []), ...state.rejectedIds])
      const finalPersonas = personas ?? ctx.personas ?? state.personas
      if (!finalPersonas || finalPersonas.length === 0) {
        return 'No personas available to build a proposal. Please extract personas first.'
      }
      const offset = contentOffset ?? state.contentOffset ?? 0
      const proposal = buildProposal(finalPersonas, offset, allRejected)
      const toolGroups = generateToolCalls(finalPersonas)
      ctx.proposal = proposal
      ctx.toolGroups = toolGroups
      ctx.personas = finalPersonas
      ctx.contentOffset = offset
      return `Proposal built: template=${proposal.templateLabel}, ${proposal.personas.length} persona(s), ${proposal.personas.reduce((s, p) => s + p.matches.length, 0)} total content matches.`
    },
    {
      name: 'build_demo_proposal',
      description:
        'Build a demo proposal by searching the demo library for matching content. Use when you have personas and pain points ready.',
      schema: z.object({
        personas: z
          .array(
            z.object({
              name: z.string(),
              painPoints: z.array(z.string()),
            }),
          )
          .optional()
          .describe('Personas with pain points. Uses extracted personas if omitted.'),
        contentOffset: z
          .number()
          .optional()
          .describe('Offset for pagination (0 = first page, 3 = next page, etc.)'),
        rejectedIds: z
          .array(z.string())
          .optional()
          .describe('Demo IDs to exclude from results'),
      }),
    },
  )

  const searchMoreContentTool = tool(
    async ({ query, excludeIds }) => {
      const allRejected = new Set([...(excludeIds ?? []), ...state.rejectedIds])
      const newOffset = (state.contentOffset ?? 0) + 3
      const personas = ctx.personas ?? state.personas
      if (!personas || personas.length === 0) {
        return 'No personas available to search for content.'
      }
      const proposal = buildProposal(personas, newOffset, allRejected)
      const toolGroups = generateToolCalls(personas)
      ctx.proposal = proposal
      ctx.toolGroups = toolGroups
      ctx.contentOffset = newOffset
      const hasGoodMatches = proposal.personas.some((p) =>
        p.matches.some((m) => m.confidence !== 'low'),
      )
      return `Found ${hasGoodMatches ? 'relevant' : 'lower-confidence'} additional content at offset ${newOffset}. ${proposal.personas.reduce((s, p) => s + p.matches.length, 0)} total matches.`
    },
    {
      name: 'search_more_content',
      description: 'Search for additional/alternative demo content beyond what was already shown.',
      schema: z.object({
        query: z.string().optional().describe('Optional search query to refine results'),
        excludeIds: z
          .array(z.string())
          .optional()
          .describe('Demo IDs to exclude from results'),
      }),
    },
  )

  const createFsdContentTool = tool(
    async ({ context, audience }) => {
      const audienceStr = audience || (ctx.personas ?? state.personas)?.[0]?.name || 'your audience'
      const topicStr = context || 'our product'
      const header = `Welcome to your personalized ${topicStr} experience`
      const description = `We've put together a tailored walkthrough based on what matters most to ${audienceStr}. Explore the sections below to see how ${topicStr} can help you achieve your goals.`
      ctx.fsdContent = { header, message: description }
      ctx.nodeType = 'fullScreenDialogNode'
      return `Created FSD content — Header: "${header}"`
    },
    {
      name: 'create_fsd_content',
      description:
        'Generate header and description content for a Full Screen Dialog intro screen. Use when the user asks to add an introduction screen.',
      schema: z.object({
        context: z.string().optional().describe('Topic or product context for the intro'),
        audience: z.string().optional().describe('The target audience for the intro'),
      }),
    },
  )

  const suggestTemplatePickerTool = tool(
    async () => {
      ctx.showTemplatePicker = true
      ctx.step = 'awaiting_purpose'
      const templates = ['Single Demo', 'Branching Flow', 'Persona Intro', 'Two-Step']
      return `Showing template picker with options: ${templates.join(', ')}`
    },
    {
      name: 'suggest_template_picker',
      description:
        'Show the template picker UI when the user selects a generic persona or wants to choose a flow template.',
      schema: z.object({}),
    },
  )

  const suggestPersonaPickerTool = tool(
    async () => {
      ctx.showPersonaPicker = true
      ctx.step = 'awaiting_purpose'
      return 'Showing persona picker with options: Champion, Executive, IT Admin, VP, Finance, Operations'
    },
    {
      name: 'suggest_persona_picker',
      description:
        'Show the persona picker UI when the user is unsure who the demo is for or asks for suggestions.',
      schema: z.object({}),
    },
  )

  return [
    extractPersonasAndPainPointsTool,
    buildDemoProposalTool,
    searchMoreContentTool,
    createFsdContentTool,
    suggestTemplatePickerTool,
    suggestPersonaPickerTool,
  ]
}

// ─── Build system prompt ───────────────────────────────────────────────────

function buildSystemPrompt(state: AgentRequestState): string {
  const personasSummary =
    state.personas.length > 0
      ? state.personas
          .map((p) => `${p.name} (${p.painPoints.join(', ') || 'no topics yet'})`)
          .join('; ')
      : 'none yet'

  return `You are a demo flow builder assistant for Consensus, a B2B sales demo platform.
You help users build personalized interactive demo flows by searching a library of demo videos and tours.

Current conversation state:
- Identified personas: ${personasSummary}
- Has existing proposal on canvas: ${state.hasProposal}
- Content pagination offset: ${state.contentOffset}
- Rejected demo IDs count: ${state.rejectedIds.length}
- Current step: ${state.currentStep}

Your responsibilities:
1. When a user describes their audience/personas, use extract_personas_and_pain_points to parse them.
2. When you have personas with pain points, use build_demo_proposal to find matching content.
3. When a user asks for more/different content, use search_more_content.
4. When a user asks for an introduction screen, use create_fsd_content.
5. When a user gives a generic persona (like "general audience") or selects a template type, use suggest_template_picker.
6. When the user is unsure who the demo is for, use suggest_persona_picker.

Be concise, helpful, and focused on the demo building task.
Always confirm what you found and guide the user to the next step.
When a proposal is built, let them know it's on the canvas and they can adjust anything.`
}

// ─── Main agent runner ─────────────────────────────────────────────────────

const model = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0.4,
  apiKey: process.env.OPENAI_API_KEY,
})

export async function runAgent(
  message: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  state: AgentRequestState,
): Promise<AgentResponse> {
  const ctx: RunContext = {}
  const tools = createTools(state, ctx)

  const agent = createReactAgent({ llm: model, tools })

  const historyMessages = conversationHistory.slice(-8).map((m) =>
    m.role === 'user' ? new HumanMessage(m.content) : { role: 'assistant', content: m.content },
  )

  const result = await agent.invoke({
    messages: [
      new SystemMessage(buildSystemPrompt(state)),
      ...historyMessages,
      new HumanMessage(message),
    ],
  })

  // Extract the final AI text response
  const lastMessage = result.messages[result.messages.length - 1]
  const rawContent = lastMessage.content
  let aiText: string
  if (typeof rawContent === 'string') {
    aiText = rawContent
  } else if (Array.isArray(rawContent)) {
    aiText = rawContent
      .filter((c) => typeof c === 'object' && c !== null && (c as Record<string, unknown>)['type'] === 'text')
      .map((c) => String((c as Record<string, unknown>)['text'] ?? ''))
      .join('')
  } else {
    aiText = 'Done.'
  }

  // Detect intent from original message for step routing
  const intent = detectIntent(message, state.personas.length > 0, state.hasProposal)

  const response: AgentResponse = {
    message: aiText,
    intent,
    toolGroups: ctx.toolGroups,
    proposal: ctx.proposal,
    personas: ctx.personas,
    nodeType: ctx.nodeType,
    fsdContent: ctx.fsdContent,
    showPersonaPicker: ctx.showPersonaPicker,
    showTemplatePicker: ctx.showTemplatePicker,
    showVote: !!ctx.proposal,
    contentOffset: ctx.contentOffset,
    step: ctx.proposal
      ? 'post_proposal'
      : ctx.showTemplatePicker || ctx.showPersonaPicker
        ? 'awaiting_purpose'
        : ctx.nodeType
          ? 'awaiting_fsd_help'
          : ctx.step,
  }

  return response
}
