import type { Edge, Node } from '@xyflow/react'

export type DemoSnapshot = {
  title: string
  nodes: Node[]
  edges: Edge[]
  savedAt: string
}

const LOCAL_PREFIX = 'warehouse-demo-share:'

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function createShareId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

export function saveDemoSnapshot(snapshot: DemoSnapshot): { id: string; url: string; usedHash: boolean } {
  const id = createShareId()
  const json = JSON.stringify(snapshot)

  try {
    localStorage.setItem(`${LOCAL_PREFIX}${id}`, json)
  } catch {
    // localStorage may be full — hash fallback still works on this device
  }

  const origin = window.location.origin
  const pathname = window.location.pathname || '/'
  const encoded = toBase64Url(json)

  // Prefer hash URL so the demo opens on any device without a backend.
  if (encoded.length <= 120_000) {
    return { id, url: `${origin}${pathname}#d=${encoded}`, usedHash: true }
  }

  return { id, url: `${origin}${pathname}?share=${id}`, usedHash: false }
}

export function loadDemoFromLocation(): DemoSnapshot | null {
  const hash = window.location.hash
  if (hash.startsWith('#d=')) {
    try {
      return JSON.parse(fromBase64Url(hash.slice(3))) as DemoSnapshot
    } catch {
      return null
    }
  }

  const shareId = new URLSearchParams(window.location.search).get('share')
  if (!shareId) return null

  try {
    const raw = localStorage.getItem(`${LOCAL_PREFIX}${shareId}`)
    return raw ? (JSON.parse(raw) as DemoSnapshot) : null
  } catch {
    return null
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
