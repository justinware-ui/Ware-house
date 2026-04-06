/**
 * SSE client hook for the demo-agent-server.
 *
 * Sends user messages to POST /chat and processes the SSE event stream,
 * dispatching typed callbacks for each event.
 */

const AGENT_URL = import.meta.env.VITE_AGENT_URL || 'http://localhost:8001'

export type AgentState = 'idle' | 'thinking' | 'talking' | 'parked'

export interface AgentStreamCallbacks {
  onStateChange?: (state: AgentState) => void
  onPartialText?: (text: string) => void
  onCompleteText?: (text: string) => void
  onToolCall?: (toolName: string, status: 'started' | 'completed') => void
  onProposalShow?: (proposal: Record<string, unknown>) => void
  onPersonaAnalysis?: (data: {
    personas: Array<{ name: string; pain_points: string[] }>
    persona_count: number
    total_pain_points: number
  }) => void
  onDemoboardUpdate?: (action: string, result: Record<string, unknown>) => void
  onError?: (error: Error) => void
  onDone?: () => void
}

let _sessionId: string | null = null

async function getSessionId(): Promise<string> {
  if (_sessionId) return _sessionId
  const res = await fetch(`${AGENT_URL}/session`, { method: 'POST' })
  const data = await res.json()
  _sessionId = data.session_id
  return _sessionId!
}

export function resetSession(): void {
  _sessionId = null
}

/**
 * Send a message to the demo agent and stream the response via SSE.
 * Returns an AbortController that can be used to cancel the stream.
 */
export async function sendMessage(
  message: string,
  callbacks: AgentStreamCallbacks,
): Promise<AbortController> {
  const controller = new AbortController()
  const sessionId = await getSessionId()

  try {
    const res = await fetch(`${AGENT_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message }),
      signal: controller.signal,
    })

    if (!res.ok) {
      throw new Error(`Agent server error: ${res.status}`)
    }

    const reader = res.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    const processEvents = async () => {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // keep incomplete line in buffer

        let eventType = ''
        let eventData = ''

        for (const rawLine of lines) {
          const line = rawLine.replace(/\r$/, '')
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            eventData = line.slice(5).trim()
          } else if (line === '' && eventType && eventData) {
            // Complete event — dispatch
            try {
              const data = JSON.parse(eventData)
              dispatchEvent(eventType, data, callbacks)
            } catch {
              // skip malformed JSON
            }
            eventType = ''
            eventData = ''
          }
        }
      }
    }

    processEvents()
      .catch((err) => {
        if (err.name !== 'AbortError') {
          callbacks.onError?.(err)
        }
      })
      .finally(() => {
        callbacks.onDone?.()
      })
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      callbacks.onError?.(err as Error)
    }
  }

  return controller
}

/**
 * Recursively converts snake_case keys to camelCase throughout an object/array.
 * The server returns Python-style snake_case; the frontend expects camelCase.
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function camelizeKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(camelizeKeys)
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[snakeToCamel(key)] = camelizeKeys(value)
    }
    return result
  }
  return obj
}

function dispatchEvent(
  eventType: string,
  data: Record<string, unknown>,
  callbacks: AgentStreamCallbacks,
): void {
  switch (eventType) {
    case 'agent_state_change':
      callbacks.onStateChange?.(data.state as AgentState)
      break
    case 'agent_message':
      if (data.message_type === 'partial') {
        callbacks.onPartialText?.(data.text as string)
      } else {
        callbacks.onCompleteText?.(data.text as string)
      }
      break
    case 'tool_call':
      callbacks.onToolCall?.(data.tool_name as string, data.status as 'started' | 'completed')
      break
    case 'proposal_show':
      callbacks.onProposalShow?.(camelizeKeys(data.proposal) as Record<string, unknown>)
      break
    case 'persona_analysis': {
      const camelized = camelizeKeys(data) as {
        personas: Array<{ name: string; pain_points: string[] }>
        persona_count: number
        total_pain_points: number
      }
      callbacks.onPersonaAnalysis?.(camelized)
      break
    }
    case 'demoboard_update':
      callbacks.onDemoboardUpdate?.(
        data.action as string,
        camelizeKeys(data.result) as Record<string, unknown>,
      )
      break
  }
}
