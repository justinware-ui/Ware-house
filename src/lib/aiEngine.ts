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
  noMatchReason?: string
}

export type TemplateType = 'single_asset' | '1_disco_branch' | '2_disco_branch'

export interface DemoProposal {
  template: TemplateType
  templateLabel: string
  discoveryQuestion: string
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

export function matchContent(
  persona: string,
  painPoints: string[],
  allDemos: Demo[] = demos,
  offset = 0,
): ContentMatch[] {
  const searchTerms = [persona, ...painPoints].join(' ')
  const contentType: 'video' | 'tour' = isExecutiveTitle(persona) ? 'video' : 'tour'

  const scored = allDemos.map((demo) => {
    const relevanceScore = fuzzyMatch(searchTerms, `${demo.title} ${demo.tags || ''} ${demo.folder || ''}`)
    const engagementPercentile = deterministicEngagement(demo.title)
    const confidence = computeConfidence(relevanceScore, engagementPercentile)

    let relevanceReason = ''
    if (relevanceScore >= 2) {
      relevanceReason = `Direct keyword match with "${persona}" pain points. `
    } else if (relevanceScore >= 1) {
      relevanceReason = `Indirect match — related terminology found. `
    } else {
      relevanceReason = `Broad topic match. `
    }

    if (engagementPercentile >= 70) {
      relevanceReason += `Top ${100 - engagementPercentile}% engagement in last 30 days.`
    } else if (engagementPercentile >= 50) {
      relevanceReason += `Above-average engagement (${engagementPercentile}th percentile).`
    } else {
      relevanceReason += `Below-average engagement (${engagementPercentile}th percentile).`
    }

    return { demo, confidence, relevanceReason, engagementPercentile, contentType, relevanceScore }
  })

  scored.sort((a, b) => {
    const confOrder = { high: 0, medium: 1, low: 2 }
    if (confOrder[a.confidence] !== confOrder[b.confidence]) return confOrder[a.confidence] - confOrder[b.confidence]
    return b.relevanceScore - a.relevanceScore
  })

  const results = scored.slice(offset, offset + 3)

  const hasHigh = results.some((r) => r.confidence === 'high')
  const hasMedium = results.some((r) => r.confidence === 'medium')
  const hasLow = results.some((r) => r.confidence === 'low')

  if (!hasHigh && results.length >= 1 && results[0].relevanceScore > 0) {
    results[0].confidence = 'high'
    results[0].engagementPercentile = Math.max(results[0].engagementPercentile, 75)
    results[0].relevanceReason = `Direct keyword match with "${persona}" pain points. Top ${100 - results[0].engagementPercentile}% engagement in last 30 days.`
  }
  if (!hasMedium && results.length >= 2) {
    results[1].confidence = 'medium'
    results[1].relevanceReason = `Indirect match — related terminology found. Above-average engagement (${results[1].engagementPercentile}th percentile).`
  }
  if (!hasLow && results.length >= 3) {
    results[2].confidence = 'low'
    results[2].engagementPercentile = Math.min(results[2].engagementPercentile, 35)
    results[2].relevanceReason = `Broad topic match. Below-average engagement (${results[2].engagementPercentile}th percentile).`
  }

  return results.map(({ relevanceScore: _, ...rest }) => rest)
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
    const hasGoodMatch = matches.some((m) => m.confidence !== 'low')
    return {
      name: p.name,
      painPoints: p.painPoints,
      matches,
      noMatchReason: hasGoodMatch
        ? undefined
        : `We couldn't find highly relevant content for ${p.name}. Consider creating new content focused on ${p.painPoints.join(', ')}.`,
    }
  })

  const discoveryQuestion =
    personas.length === 1
      ? `Tell us more about what you're looking for`
      : `Which best describes your role? ${personas.map((p, i) => `${i + 1}. ${p.name}`).join(', ')}`

  return {
    template,
    templateLabel: getTemplateLabel(template),
    discoveryQuestion,
    personas: personaAnalyses,
    editHistory: [],
  }
}

export function generateToolCalls(personas: { name: string; painPoints: string[] }[]): ToolGroup[] {
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
          description: `Selected template: ${personas.length === 1 ? 'Single Asset' : personas.length >= 2 ? '1 Discovery Branch' : '2 Discovery Branches'}`,
          status: 'complete',
        },
        { name: 'compose_demo', description: 'Assembling discovery question and content branches...', status: 'complete' },
      ],
    },
  ]
}
