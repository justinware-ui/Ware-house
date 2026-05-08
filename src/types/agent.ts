import type { DemoProposal, ToolGroup } from '@/lib/aiEngine'

export interface AgentRequestState {
  personas: { name: string; painPoints: string[] }[]
  hasProposal: boolean
  contentOffset: number
  rejectedIds: string[]
  currentStep: string
}

export interface AgentRequest {
  message: string
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
  state: AgentRequestState
}

export interface AgentResponse {
  message: string
  toolGroups?: ToolGroup[]
  proposal?: DemoProposal
  intent: string
  personas?: { name: string; painPoints: string[] }[]
  showPersonaPicker?: boolean
  showTemplatePicker?: boolean
  showVote?: boolean
  nodeType?: 'fullScreenDialogNode' | 'ctaNode'
  fsdContent?: { header: string; message: string }
  step?: string
  contentOffset?: number
  error?: string
}
