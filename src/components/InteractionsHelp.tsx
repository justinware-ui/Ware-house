'use client'

import { useState } from 'react'
import helpIcon from '../assets/help-icon.svg'
import interactionsHelpGuide from '../assets/interactions-help-guide.svg'

export function InteractionsHelpIcon({
  visible = true,
  onOpenChange,
}: {
  visible?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const setOpen = (next: boolean) => onOpenChange?.(next)

  return (
    <button
      type="button"
      aria-label="What do interactions do?"
      className="inline-flex shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FC6839]/40"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 250ms ease-in' }}
      onMouseEnter={() => setOpen(true)}
      onFocus={() => setOpen(true)}
    >
      <img src={helpIcon} alt="" width={16} height={16} className="h-4 w-4" />
    </button>
  )
}

export function InteractionsHelpGuide({ open }: { open: boolean }) {
  if (!open) return null

  return (
    <div className="absolute inset-0 z-30">
      <img
        src={interactionsHelpGuide}
        alt="Guide explaining each interaction type"
        className="block h-auto w-full"
        draggable={false}
      />
    </div>
  )
}

export function useInteractionsHelp() {
  const [open, setOpen] = useState(false)
  return { open, setOpen }
}
