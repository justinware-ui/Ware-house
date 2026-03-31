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

const EXEC_KEYWORDS = ['president', 'vice president', 'vp', 'c suite', 'chief', 'ceo', 'cfo', 'cto', 'coo', 'cmo', 'director', 'executive']

function isExecutiveTitle(persona: string): boolean {
  const lower = persona.toLowerCase()
  return EXEC_KEYWORDS.some((kw) => lower.includes(kw))
}

function fuzzyMatch(query: string, target: string): number {
  const qWords = query.toLowerCase().split(/\s+/)
  const tWords = target.toLowerCase().split(/\s+/)
  let directHits = 0
  let fuzzyHits = 0
  for (const qw of qWords) {
    if (qw.length < 3) continue
    for (const tw of tWords) {
      if (tw === qw) { directHits++; break }
      if (tw.includes(qw) || qw.includes(tw)) { fuzzyHits++; break }
    }
  }
  return directHits * 2 + fuzzyHits
}

function deterministicEngagement(title: string): number {
  let hash = 0
  for (let i = 0; i < title.length; i++) hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0
  return Math.abs(hash) % 100
}

function computeConfidence(relevanceScore: number, engagementPercentile: number): ConfidenceLevel {
  const highRelevance = relevanceScore >= 2
  const mediumRelevance = relevanceScore >= 1
  const highEngagement = engagementPercentile >= 50

  if (highRelevance && highEngagement) return 'high'
  if ((highRelevance && !highEngagement) || (mediumRelevance && highEngagement)) return 'medium'
  return 'low'
}

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

function scoreAndRank(
  searchTerms: string,
  persona: string,
  allDemos: Demo[],
  offset: number,
  count: number,
): (ContentMatch & { relevanceScore: number })[] {
  const contentType: 'video' | 'tour' = isExecutiveTitle(persona) ? 'video' : 'tour'

  const scored = allDemos.map((demo) => {
    const relevanceScore = fuzzyMatch(searchTerms, `${demo.title} ${demo.tags || ''} ${demo.folder || ''}`)
    const engagementPercentile = deterministicEngagement(demo.title)
    const confidence = computeConfidence(relevanceScore, engagementPercentile)

    const searchWords = searchTerms.toLowerCase().split(/\s+/).filter((w) => w.length >= 3)
    const titleLower = demo.title.toLowerCase()
    const matchedTerms = searchWords.filter((w) => titleLower.includes(w))

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

  const results = scored.slice(offset, offset + count)

  results.forEach((r, i) => {
    if (i === 0 && r.relevanceScore > 0) {
      r.confidence = 'high'
    } else if (i < Math.ceil(count / 2) && r.relevanceScore > 0) {
      r.confidence = r.engagementPercentile >= 50 ? 'high' : 'medium'
    } else if (r.relevanceScore > 0) {
      r.confidence = r.engagementPercentile >= 60 ? 'medium' : 'low'
    } else {
      r.confidence = r.engagementPercentile >= 70 ? 'medium' : 'low'
    }
  })

  return results
}

export function matchContent(
  persona: string,
  painPoints: string[],
  allDemos: Demo[] = demos,
  offset = 0,
): ContentMatch[] {
  const searchTerms = [persona, ...painPoints].join(' ')
  return scoreAndRank(searchTerms, persona, allDemos, offset, 6)
    .map(({ relevanceScore: _, ...rest }) => rest)
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
): PainPointMatches[] {
  const usedDemoIds = new Set<string>()

  return painPoints.map((pp) => {
    const searchTerms = `${persona} ${pp}`
    const available = allDemos.filter((d) => !usedDemoIds.has(d.id))
    const matches = scoreAndRank(searchTerms, persona, available, offset, 4)
      .map(({ relevanceScore: _, ...rest }) => rest)
    matches.forEach((m) => usedDemoIds.add(m.demo.id))
    return { painPoint: pp, matches }
  })
}

export function buildProposal(
  personas: { name: string; painPoints: string[] }[],
  offset = 0,
): DemoProposal {
  const hasSubSegments = personas.some((p) => p.painPoints.length > 2)
  const template = selectTemplate(
    personas.map((p) => p.name),
    hasSubSegments,
  )

  const personaAnalyses: PersonaAnalysis[] = personas.map((p) => {
    const matches = matchContent(p.name, p.painPoints, undefined, offset)
    const painPointMatches = p.painPoints.length >= 2
      ? matchContentByPainPoint(p.name, p.painPoints, undefined, offset)
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

  if (template === 'single_asset') {
    discoveryQuestion = `Tell us more about what you're looking for`
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
    secondDiscoveryQuestions,
    personas: personaAnalyses,
    editHistory: [],
  }
}

export function generateToolCalls(personas: { name: string; painPoints: string[] }[]): ToolGroup[] {
  const hasSubSegments = personas.some((p) => p.painPoints.length > 2)
  const template = selectTemplate(personas.map((p) => p.name), hasSubSegments)
  const templateLabel = getTemplateLabel(template)

  return [
    {
      label: 'Analyzing conversation',
      tools: [
        { name: 'extract_personas', description: `Identified ${personas.length} persona(s): ${personas.map((p) => p.name).join(', ')}`, status: 'complete' },
        { name: 'classify_pain_points', description: `Mapped ${personas.reduce((s, p) => s + p.painPoints.length, 0)} pain points across personas`, status: 'complete' },
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
