import { useEffect, useRef, useState } from 'react'

/**
 * Returns `true` whenever the user has clicked inside the node card (and not on
 * an action button or drag-grip), and `false` as soon as they click anywhere
 * outside the card.
 *
 * Uses capture-phase listeners so ReactFlow's own event handling cannot block
 * the outside-click detection.
 */
export function useNodeActive(cardRef: React.RefObject<HTMLElement | null>) {
  const [nodeActive, setNodeActive] = useState(false)
  // Keep a stable ref so the capture listener can read the latest value
  const nodeActiveRef = useRef(false)

  useEffect(() => {
    // Capture phase fires before any stopPropagation on child elements
    const handleCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const inside = !!cardRef.current?.contains(target)

      if (inside) {
        if (!target.closest('button') && !target.closest('[data-drag-grip]')) {
          nodeActiveRef.current = true
          setNodeActive(true)
        }
      } else {
        if (nodeActiveRef.current) {
          nodeActiveRef.current = false
          setNodeActive(false)
        }
      }
    }

    document.addEventListener('mousedown', handleCapture, true)
    return () => document.removeEventListener('mousedown', handleCapture, true)
  }, [cardRef])

  return nodeActive
}
