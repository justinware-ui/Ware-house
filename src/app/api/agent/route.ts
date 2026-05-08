import { NextResponse } from 'next/server'
import { runAgent } from '@/lib/langchainAgent'
import type { AgentRequest, AgentResponse } from '@/types/agent'

export async function POST(req: Request) {
  try {
    const body: AgentRequest = await req.json()
    const { message, conversationHistory = [], state } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' } satisfies Partial<AgentResponse>, {
        status: 400,
      })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          message:
            'OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env.local file.',
          intent: 'unknown',
          error: 'OPENAI_API_KEY missing',
        } satisfies AgentResponse,
        { status: 500 },
      )
    }

    const response = await runAgent(message, conversationHistory, {
      personas: state?.personas ?? [],
      hasProposal: state?.hasProposal ?? false,
      contentOffset: state?.contentOffset ?? 0,
      rejectedIds: state?.rejectedIds ?? [],
      currentStep: state?.currentStep ?? 'awaiting_purpose',
    })

    return NextResponse.json(response)
  } catch (err) {
    console.error('[/api/agent] Error:', err)
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
    return NextResponse.json(
      {
        message,
        intent: 'unknown',
        error: message,
      } satisfies AgentResponse,
      { status: 500 },
    )
  }
}
