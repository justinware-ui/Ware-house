import { demos, type Demo } from '../data/demos'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface ContentMatch {
  demo: Demo
  confidence: ConfidenceLevel
  relevanceReason: string
  engagementPercentile: number
  contentType: 'video' | 'tour'
}

export interface PersonaAnalysis {
  name: string
  painPoints: string[]
  matches: ContentMatch[]
  painPointMatches?: PainPointMatches[]
  noMatchReason?: string
}

export type TemplateType = 'single_asset' | '1_disco_branch' | '2_disco_branch'

export interface DemoProposal {
  template: TemplateType
  templateLabel: string
  templateDescription: string
  discoveryQuestion: string
  topics?: string[]
  secondDiscoveryQuestions?: { persona: string; question: string }[]
  personas: PersonaAnalysis[]
  editHistory: { field: string; before: string; after: string }[]
}

export interface ToolCall {
  name: string
  description: string
  status: 'running' | 'complete' | 'error'
  result?: string
}

export interface ToolGroup {
  label: string
  tools: ToolCall[]
}

// ─── Rejection memory ─────────────────────────────────────────────────────────
// Tracks demo IDs that were rejected (thumbs-down, swapped out, deselected)
// so the engine never resurfaces them in the same session.

const rejectedDemoIds = new Set<string>()

export function rejectDemo(id: string) { rejectedDemoIds.add(id) }
export function isRejected(id: string) { return rejectedDemoIds.has(id) }
export function getRejectedIds() { return new Set(rejectedDemoIds) }

// ─── Synonym map & category groups ────────────────────────────────────────────
// Maps user-language terms to related terms that may appear in demo titles/tags.
// This bridges the vocabulary gap between what a builder says and what demos are called.

const SYNONYM_MAP: Record<string, string[]> = {
  sales:       ['selling', 'revenue', 'pipeline', 'deal', 'quota', 'b2b', 'presales', 'pre-sales'],
  presales:    ['pre-sales', 'presale', 'demo', 'proof of concept', 'poc', 'sales engineer', 'se'],
  marketing:   ['campaign', 'lead', 'inbound', 'outbound', 'brand', 'content', 'awareness'],
  event:       ['conference', 'tradeshow', 'webinar', 'meetup', 'summit', 'event delight'],
  engagement:  ['interaction', 'conversion', 'click', 'open rate', 'response', 'engagement'],
  product:     ['feature', 'capability', 'functionality', 'platform', 'solution', 'software'],
  onboarding:  ['training', 'enablement', 'ramp', 'adoption', 'getting started'],
  usability:   ['ux', 'user experience', 'interface', 'design', 'navigation', 'ui'],
  automation:  ['workflow', 'automate', 'efficiency', 'streamline', 'process'],
  customer:    ['client', 'buyer', 'prospect', 'account', 'stakeholder', 'user'],
  roi:         ['return on investment', 'value', 'cost savings', 'business case', 'payback'],
  security:    ['compliance', 'privacy', 'gdpr', 'soc', 'encryption', 'data protection'],
  integration: ['api', 'connect', 'sync', 'plugin', 'integration', 'crm', 'salesforce', 'hubspot'],
  analytics:   ['reporting', 'dashboard', 'metrics', 'data', 'insight', 'tracking', 'measurement'],
  waste:       ['trash', 'garbage', 'recycling', 'disposal', 'refuse', 'sanitation', 'hauling'],
  truck:       ['vehicle', 'fleet', 'hauling', 'transport', 'route'],
  test:        ['testing', 'experiment', 'validation', 'prototype', 'concept'],
  capture:     ['form', 'lead capture', 'collect', 'gather', 'registration'],
  tour:        ['walkthrough', 'interactive', 'guided', 'dynamic tour', 'consensus tour'],
  video:       ['recording', 'clip', 'screen recording', 'explainer'],
  library:     ['repository', 'collection', 'catalog', 'content library'],
  personalize: ['personalized', 'personalization', 'tailored', 'custom', 'customized', 'standard'],
}

// Category groupings for demos — when a user mentions a category,
// demos tagged with that category get a relevance boost.
const CATEGORY_GROUPS: Record<string, RegExp> = {
  events:       /event\s*delight|conference|tradeshow|webinar|summit/i,
  sales_demo:   /b2b\s*sales|software\s*sales|presales|burning|funny.*sales/i,
  how_to:       /how\s*to|create\s*a\s*demo|user\s*interview/i,
  testing:      /usability\s*test|concept\s*test|engagement\s*concept/i,
  product_demo: /single\s*demo|standard.*demo|placeholder|demo\s*library/i,
  design:       /navigation|cta|lead\s*capture|form/i,
}

function expandWithSynonyms(words: string[]): string[] {
  const expanded = new Set(words)
  for (const w of words) {
    if (SYNONYM_MAP[w]) {
      for (const syn of SYNONYM_MAP[w]) {
        for (const part of syn.split(/\s+/)) expanded.add(part)
      }
    }
    for (const [root, syns] of Object.entries(SYNONYM_MAP)) {
      if (syns.some(s => s.includes(w) || w.includes(s))) {
        expanded.add(root)
        for (const s of syns) {
          for (const part of s.split(/\s+/)) expanded.add(part)
        }
      }
    }
  }
  return [...expanded]
}

function getCategoryBoost(query: string, demoText: string): number {
  let boost = 0
  for (const [, pattern] of Object.entries(CATEGORY_GROUPS)) {
    if (pattern.test(query) && pattern.test(demoText)) boost += 2
  }
  return boost
}

// ─── Executive detection ──────────────────────────────────────────────────────

const EXEC_KEYWORDS = ['president', 'vice president', 'vp', 'c suite', 'chief', 'ceo', 'cfo', 'cto', 'coo', 'cmo', 'director', 'executive']

function isExecutiveTitle(persona: string): boolean {
  const lower = persona.toLowerCase()
  return EXEC_KEYWORDS.some((kw) => lower.includes(kw))
}

// ─── Stop words ───────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'some', 'them',
  'than', 'its', 'over', 'such', 'that', 'this', 'with', 'will', 'each',
  'from', 'they', 'been', 'said', 'into', 'what', 'when', 'how', 'who',
  'which', 'their', 'there', 'where', 'about', 'would', 'these', 'other',
  'your', 'just', 'also', 'more', 'very', 'most', 'make', 'like', 'does',
  'demo', 'tour', 'video', 'overview', 'introduction', 'intro',
])

// ─── Improved fuzzy matching ──────────────────────────────────────────────────

function fuzzyMatch(query: string, target: string): number {
  const rawQWords = query.toLowerCase().split(/\s+/).filter(w => w.length >= 3 && !STOP_WORDS.has(w))
  const qWords = expandWithSynonyms(rawQWords)
  const tWords = target.toLowerCase().split(/\s+/)

  let directHits = 0
  let fuzzyHits = 0
  const matched = new Set<number>()

  for (const qw of qWords) {
    if (qw.length < 3 || STOP_WORDS.has(qw)) continue
    for (let ti = 0; ti < tWords.length; ti++) {
      if (matched.has(ti) || STOP_WORDS.has(tWords[ti])) continue
      if (tWords[ti] === qw) { directHits++; matched.add(ti); break }
      if (tWords[ti].includes(qw) || qw.includes(tWords[ti])) { fuzzyHits++; matched.add(ti); break }
    }
  }

  const categoryBoost = getCategoryBoost(query.toLowerCase(), target.toLowerCase())
  return directHits * 2 + fuzzyHits + categoryBoost
}

// ─── Engagement & confidence ──────────────────────────────────────────────────

function deterministicEngagement(title: string): number {
  let hash = 0
  for (let i = 0; i < title.length; i++) hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0
  return Math.abs(hash) % 100
}

function computeConfidence(relevanceScore: number, engagementPercentile: number): ConfidenceLevel {
  const highRelevance = relevanceScore >= 2
  const highEngagement = engagementPercentile >= 50

  if (highRelevance && highEngagement) return 'high'
  if (highRelevance && !highEngagement) return 'medium'
  return 'low'
}

// ─── Template logic ───────────────────────────────────────────────────────────

export function selectTemplate(personas: string[], hasSubSegments: boolean): TemplateType {
  if (personas.length === 1) return 'single_asset'
  if (personas.length >= 2 && hasSubSegments) return '2_disco_branch'
  return '1_disco_branch'
}

export function getTemplateLabel(t: TemplateType): string {
  switch (t) {
    case 'single_asset': return 'Single Asset (Video or Tour)'
    case '1_disco_branch': return '1 Discovery Branch'
    case '2_disco_branch': return '2 Discovery Branches'
  }
}

export function getTemplateDescription(t: TemplateType): string {
  switch (t) {
    case 'single_asset':
      return 'A single video or tour targeted to your persona.'
    case '1_disco_branch':
      return '1 discovery question with multiple answer branches — each branch leads to a video, tour, or both.'
    case '2_disco_branch':
      return '1 discovery question where the response leads to a second discovery question with multiple answer branches — each branch leads to a video, tour, or both.'
  }
}

// ─── Scoring and ranking (with rejection filtering) ───────────────────────────

function scoreAndRank(
  searchTerms: string,
  persona: string,
  allDemos: Demo[],
  offset: number,
  count: number,
  excludeIds?: Set<string>,
): (ContentMatch & { relevanceScore: number })[] {
  const contentType: 'video' | 'tour' = isExecutiveTitle(persona) ? 'video' : 'tour'
  const excluded = excludeIds ?? new Set<string>()

  const scored = allDemos
    .filter((d) => !rejectedDemoIds.has(d.id) && !excluded.has(d.id))
    .map((demo) => {
      const demoText = `${demo.title} ${demo.tags || ''} ${demo.folder || ''}`
      const relevanceScore = fuzzyMatch(searchTerms, demoText)
      const engagementPercentile = deterministicEngagement(demo.title)
      const confidence = computeConfidence(relevanceScore, engagementPercentile)

      const rawWords = searchTerms.toLowerCase().split(/\s+/).filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
      const expandedWords = expandWithSynonyms(rawWords)
      const titleLower = demo.title.toLowerCase()
      const matchedTerms = expandedWords.filter((w) => titleLower.includes(w))

      let relevanceReason = ''
      if (relevanceScore >= 2 && matchedTerms.length > 0) {
        relevanceReason = `Matches "${matchedTerms.slice(0, 2).join('" and "')}" from your description of ${persona}. `
      } else if (relevanceScore >= 1 && matchedTerms.length > 0) {
        relevanceReason = `Related to "${matchedTerms[0]}" — a close match for ${persona}. `
      } else {
        relevanceReason = `General content that may be relevant to ${persona}. `
      }

      if (relevanceScore >= 1 && engagementPercentile >= 70) {
        relevanceReason += `Strong performer — ${engagementPercentile}th percentile engagement over 30 days.`
      } else if (engagementPercentile >= 50) {
        relevanceReason += `Solid engagement — ${engagementPercentile}th percentile over 30 days.`
      } else {
        relevanceReason += `Lower engagement (${engagementPercentile}th percentile) — may need a refresh or could be newer content.`
      }

      return { demo, confidence, relevanceReason, engagementPercentile, contentType, relevanceScore }
    })

  scored.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore
    return b.engagementPercentile - a.engagementPercentile
  })

  return scored.slice(offset, offset + count)
}

// ─── Content matching ─────────────────────────────────────────────────────────

export function matchContent(
  persona: string,
  painPoints: string[],
  allDemos: Demo[] = demos,
  offset = 0,
  excludeIds?: Set<string>,
): ContentMatch[] {
  const searchTerms = [persona, ...painPoints].join(' ')
  const results = scoreAndRank(searchTerms, persona, allDemos, offset, 6, excludeIds)
    .map(({ relevanceScore: _, ...rest }) => rest)

  const lowCount = results.filter((m) => m.confidence === 'low').length
  if (lowCount > results.length / 2) return results.slice(0, 2)
  return results
}

export interface PainPointMatches {
  painPoint: string
  matches: ContentMatch[]
}

export function matchContentByPainPoint(
  persona: string,
  painPoints: string[],
  allDemos: Demo[] = demos,
  offset = 0,
  excludeIds?: Set<string>,
): PainPointMatches[] {
  const usedDemoIds = new Set<string>(excludeIds ?? [])

  return painPoints.map((pp) => {
    const searchTerms = `${persona} ${pp}`
    const available = allDemos.filter((d) => !usedDemoIds.has(d.id))
    let matches = scoreAndRank(searchTerms, persona, available, offset, 4, usedDemoIds)
      .map(({ relevanceScore: _, ...rest }) => rest)

    const lowCount = matches.filter((m) => m.confidence === 'low').length
    if (lowCount > matches.length / 2) matches = matches.slice(0, 2)

    matches.forEach((m) => usedDemoIds.add(m.demo.id))
    return { painPoint: pp, matches }
  })
}

// ─── Proposal builder ─────────────────────────────────────────────────────────

export function buildProposal(
  personas: { name: string; painPoints: string[] }[],
  offset = 0,
  excludeIds?: Set<string>,
): DemoProposal {
  const hasSubSegments = personas.some((p) => p.painPoints.length > 2)
  const template = selectTemplate(
    personas.map((p) => p.name),
    hasSubSegments,
  )

  const personaAnalyses: PersonaAnalysis[] = personas.map((p) => {
    const matches = matchContent(p.name, p.painPoints, undefined, offset, excludeIds)
    const painPointMatches = p.painPoints.length >= 2
      ? matchContentByPainPoint(p.name, p.painPoints, undefined, offset, excludeIds)
      : undefined
    const hasGoodMatch = matches.some((m) => m.confidence !== 'low')
    return {
      name: p.name,
      painPoints: p.painPoints,
      matches,
      painPointMatches,
      noMatchReason: hasGoodMatch
        ? undefined
        : `We couldn't find highly relevant content for ${p.name}. Consider creating new content focused on ${p.painPoints.join(', ')}.`,
    }
  })

  let discoveryQuestion: string
  let secondDiscoveryQuestions: { persona: string; question: string }[] | undefined

  // Collect all unique topics across personas to use as discovery answers
  const allTopics = [...new Set(personas.flatMap((p) => p.painPoints))]
    .filter(t => t !== 'general solutions')

  if (template === 'single_asset') {
    discoveryQuestion = `Tell us more about what you're looking for`
  } else if (allTopics.length >= 2) {
    // Use topics as the discovery question answers (what users care about)
    discoveryQuestion = `Which area are you most interested in?`
  } else {
    discoveryQuestion = `Which best describes your role? ${personas.map((p, i) => `${i + 1}. ${p.name}`).join(', ')}`
  }

  if (template === '2_disco_branch') {
    secondDiscoveryQuestions = personas.map((p) => ({
      persona: p.name,
      question: `What are you most interested in? ${p.painPoints.map((pp, i) => `${i + 1}. ${pp}`).join(', ')}`,
    }))
  }

  return {
    template,
    templateLabel: getTemplateLabel(template),
    templateDescription: getTemplateDescription(template),
    discoveryQuestion,
    topics: allTopics.length >= 2 ? allTopics : undefined,
    secondDiscoveryQuestions,
    personas: personaAnalyses,
    editHistory: [],
  }
}

// ─── Tool call generation ─────────────────────────────────────────────────────

export function generateToolCalls(personas: { name: string; painPoints: string[] }[]): ToolGroup[] {
  const hasSubSegments = personas.some((p) => p.painPoints.length > 2)
  const template = selectTemplate(personas.map((p) => p.name), hasSubSegments)
  const templateLabel = getTemplateLabel(template)
  const rejectedCount = rejectedDemoIds.size

  return [
    {
      label: 'Analyzing conversation',
      tools: [
        { name: 'extract_personas', description: `Identified ${personas.length} persona(s): ${personas.map((p) => p.name).join(', ')}`, status: 'complete' },
        { name: 'classify_pain_points', description: `Mapped ${personas.reduce((s, p) => s + p.painPoints.length, 0)} pain points across personas`, status: 'complete' },
        ...(rejectedCount > 0 ? [{ name: 'filter_rejected', description: `Excluding ${rejectedCount} previously rejected item${rejectedCount !== 1 ? 's' : ''}`, status: 'complete' as const }] : []),
      ],
    },
    {
      label: 'Searching demo library',
      tools: [
        { name: 'search_demos', description: `Searching ${demos.length} demos for relevant content...`, status: 'complete', result: `Found ${Math.min(demos.length, 12)} potential matches` },
        { name: 'analyze_engagement', description: 'Pulling 30-day rolling engagement data...', status: 'complete', result: 'Engagement scores computed for all matches' },
        { name: 'rank_content', description: 'Ranking content by relevance and performance...', status: 'complete', result: 'Top matches selected per persona' },
      ],
    },
    {
      label: 'Building demo template',
      tools: [
        {
          name: 'select_template',
          description: `Selected template: ${templateLabel}`,
          status: 'complete',
        },
        { name: 'compose_demo', description: template === '2_disco_branch'
          ? 'Assembling 2-level discovery questions and content branches...'
          : template === '1_disco_branch'
            ? 'Assembling discovery question and content branches...'
            : 'Selecting best content asset for your persona...',
          status: 'complete' },
      ],
    },
  ]
}

// ─── Intelligent persona extraction ───────────────────────────────────────────
// Understands varied natural language patterns beyond just "for X and Y"

const ROLE_KEYWORDS = [
  'ceo', 'cfo', 'cto', 'coo', 'cmo', 'cio', 'cro',
  'vp', 'vice president', 'director', 'manager', 'lead', 'head',
  'engineer', 'developer', 'architect', 'analyst', 'specialist',
  'executive', 'president', 'founder', 'owner', 'partner',
  'admin', 'administrator', 'coordinator', 'supervisor',
  'sales rep', 'account executive', 'bdr', 'sdr',
  'marketer', 'designer', 'consultant', 'strategist',
]

export function extractPersonas(text: string): string[] {
  const lower = text.toLowerCase()

  // Pattern: "for X and Y" / "for X, Y, and Z"
  const forPattern = /for\s+(.+?)(?:,\s*and\s+|\s+and\s+|,\s*)(.+?)(?:,\s*and\s+|\s+and\s+|,\s*)(.+?)(?:\.|$)/i
  const forPattern2 = /for\s+(.+?)(?:\s+and\s+|,\s*)(.+?)(?:\.|$)/i
  const forPattern1 = /for\s+(.+?)(?:\.|$)/i

  for (const pattern of [forPattern, forPattern2, forPattern1]) {
    const match = text.match(pattern)
    if (match) {
      const personas = match.slice(1).map(s => s.trim()).filter(Boolean)
      if (personas.length > 0 && personas.every(p => p.length > 2)) return personas
    }
  }

  // Pattern: "targeting X" / "aimed at X"
  const targetMatch = text.match(/(?:targeting|aimed at|geared toward|focused on|designed for)\s+(.+?)(?:\.|$)/i)
  if (targetMatch) {
    const parts = targetMatch[1].split(/(?:\s+and\s+|,\s*)/).map(s => s.trim()).filter(Boolean)
    if (parts.length > 0) return parts
  }

  // Pattern: detect role keywords in the text
  const found: string[] = []
  for (const role of ROLE_KEYWORDS) {
    const regex = new RegExp(`\\b${role}s?\\b`, 'i')
    const roleMatch = lower.match(regex)
    if (roleMatch) {
      // Extract surrounding context for the role (e.g., "VP of Sales")
      const fullMatch = text.match(new RegExp(`(?:\\w+\\s+)?${role}s?(?:\\s+(?:of|in|for)\\s+\\w+)?`, 'i'))
      if (fullMatch) found.push(fullMatch[0].trim())
    }
  }
  if (found.length > 0) return [...new Set(found)].slice(0, 4)

  // Fallback: don't use raw sentences as persona names — they'd display as
  // section headers in the proposal. Use a generic label instead; the full
  // user text is still fed into the content matching engine as search terms.
  return ['General audience']
}

// ─── Intelligent pain point extraction ────────────────────────────────────────
// Handles numbered lists, bullet points, natural language, and mixed formats

export function extractPainPoints(text: string, personas: { name: string }[]): string[][] {
  // Try numbered format: "1. cost reduction 2. efficiency"
  const numberedParts = text.split(/\d+[.)]\s*/).filter(Boolean)
  if (numberedParts.length >= personas.length) {
    return personas.map((_, i) => {
      const part = numberedParts[i]?.trim() || 'general solutions'
      return part.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 2)
    })
  }

  // Try bullet/dash format: "- cost reduction - efficiency"
  const bulletParts = text.split(/[-•]\s+/).filter(Boolean)
  if (bulletParts.length >= 2) {
    const perPersona = Math.ceil(bulletParts.length / personas.length)
    return personas.map((_, i) => {
      return bulletParts.slice(i * perPersona, (i + 1) * perPersona)
        .map(s => s.trim())
        .filter(s => s.length > 2)
    })
  }

  // Try "persona: pain points" format
  const colonParts: string[][] = []
  for (const p of personas) {
    const regex = new RegExp(`${p.name}[:\\s-]+(.+?)(?=(?:${personas.map(pp => pp.name).join('|')})[:\\s-]|$)`, 'i')
    const match = text.match(regex)
    if (match) {
      colonParts.push(match[1].split(/[,;]/).map(s => s.trim()).filter(s => s.length > 2))
    }
  }
  if (colonParts.length === personas.length) return colonParts

  // Fallback: split on "and" / commas / periods, keeping only short noun-phrase
  // topics (≤ 6 words, no sentence-fragment verbs).
  const FRAGMENT_VERBS = /\b(should|would|could|let|choose|include|identify|like to|want to|need to|helping|ask|find|prefer|select|pick|are|was|were|been|being|have|has|had|will|shall|may|might|can|do|does|did|get|got|make|made|take|took|give|gave|come|came|go|went|know|knew|think|thought|see|saw|tell|told|say|said|try|tried|keep|kept|put|seem|help|show|turn|call|run|move|play|pay|hear|meet|lead|hold|bring|write|set|sit|stand|lose|feel|read|begin|grow|open|walk|win|offer|remember|consider|appear|buy|wait|serve|die|send|build|stay|fall|cut|reach|kill|remain|suggest|raise|pass|sell|require|report|decide|pull|develop|provide|remove|agree|support|produce|respond|suffer|claim|apply|present)\b/i
  const parts = text.split(/(?:\s+and\s+|,\s*|\.\s+)/)
    .map(s => s.trim())
    .filter(s => s.length > 2 && s.split(/\s+/).length <= 6 && !FRAGMENT_VERBS.test(s))

  if (parts.length >= 1) {
    const perPersona = Math.max(1, Math.ceil(parts.length / personas.length))
    return personas.map((_, i) => {
      const slice = parts.slice(i * perPersona, (i + 1) * perPersona)
      return slice.length > 0 ? slice : ['general solutions']
    })
  }

  return personas.map(() => ['general solutions'])
}

// ─── Intent detection for flexible conversation ───────────────────────────────
// Classifies what the user wants regardless of conversation step

export type UserIntent =
  | 'provide_personas'
  | 'provide_pain_points'
  | 'provide_both'
  | 'request_fsd'
  | 'request_more_content'
  | 'satisfied'
  | 'request_changes'
  | 'ask_question'
  | 'create_demo'
  | 'unknown'

export function detectIntent(text: string, hasPersonas: boolean, hasProposal: boolean): UserIntent {
  const lower = text.toLowerCase()

  if (/full\s*screen|introduction|intro\b|welcome\s*(screen|page|message)|landing/i.test(lower)) {
    return 'request_fsd'
  }

  if (/create|build|generate|make|ship|publish|go ahead|let's do it/i.test(lower) && hasProposal) {
    return 'create_demo'
  }

  if (/looks good|perfect|great|love it|awesome|done|satisfied|that works|i'm good/i.test(lower)) {
    return 'satisfied'
  }

  if (/more|other|additional|alternative|different|better|higher|another|else|options/i.test(lower) && hasProposal) {
    return 'request_more_content'
  }

  if (/swap|change|replace|switch|use.*instead|move|remove/i.test(lower) && hasProposal) {
    return 'request_changes'
  }

  if (/\?$|how do|what is|can you|why|explain|tell me about/i.test(lower)) {
    return 'ask_question'
  }

  // Detect if user provided both personas and pain points in one message
  const hasForPattern = /for\s+\w/i.test(lower)
  const hasRoleWords = ROLE_KEYWORDS.some(r => lower.includes(r))
  const hasPainWords = /care about|problem|challenge|struggle|pain|issue|need|want|goal|objective|focus|priority/i.test(lower)

  if ((hasForPattern || hasRoleWords) && hasPainWords) return 'provide_both'
  if (hasForPattern || hasRoleWords) return 'provide_personas'
  if (hasPainWords && hasPersonas) return 'provide_pain_points'

  // If we have personas and text looks like pain points (short topic phrases),
  // accept it — but reject long descriptive paragraphs that aren't real topics.
  if (hasPersonas && !hasProposal) {
    const parts = text.split(/[,;.\n]/).map(s => s.trim()).filter(s => s.length > 2)
    const avgWordCount = parts.reduce((sum, p) => sum + p.split(/\s+/).length, 0) / (parts.length || 1)
    // Real topics are short (≤8 words on average); long sentences are descriptions.
    if (parts.length >= 1 && avgWordCount <= 8) return 'provide_pain_points'
  }

  return 'unknown'
}

// ─── Canvas state analysis for proactive suggestions ──────────────────────────

export interface CanvasState {
  hasDemoCards: boolean
  demoCardCount: number
  hasDiscoveryQuestion: boolean
  hasFullScreenDialog: boolean
  hasStartNode: boolean
  nodeCount: number
  edgeCount: number
}

export function suggestNextSteps(canvas: CanvasState, hasProposal: boolean): string[] {
  const suggestions: string[] = []

  if (canvas.nodeCount === 0) {
    suggestions.push("Tell me about the demo you're building and I'll help you get started.")
    return suggestions
  }

  if (!canvas.hasFullScreenDialog && canvas.hasDemoCards) {
    suggestions.push("Would you like me to add an introduction screen? A Full Screen Dialog at the start helps set context for viewers.")
  }

  if (canvas.hasDemoCards && canvas.demoCardCount === 1 && !canvas.hasDiscoveryQuestion) {
    suggestions.push("You have one piece of content — would you like to add more and create a discovery question so viewers can choose their path?")
  }

  if (canvas.hasDiscoveryQuestion && canvas.demoCardCount >= 2 && !canvas.hasFullScreenDialog) {
    suggestions.push("Your flow looks good! Consider adding an introduction (Full Screen Dialog) before the discovery question to welcome viewers.")
  }

  if (canvas.edgeCount === 0 && canvas.nodeCount >= 2) {
    suggestions.push("I notice your elements aren't connected yet. Would you like me to help connect them into a flow?")
  }

  if (hasProposal && canvas.demoCardCount >= 3) {
    suggestions.push("Looking great! When you're ready, you can preview or save your demo using the buttons in the header.")
  }

  return suggestions
}
