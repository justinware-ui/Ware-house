export function shouldSkipNodeCardClickTarget(target: HTMLElement) {
  return !!(
    target.closest('button') ||
    target.closest('[data-drag-grip]') ||
    target.closest('[data-toolbar]') ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  )
}

function getShellFocusableInput(shell: HTMLElement | null) {
  return shell?.querySelector<HTMLElement>('input, textarea, [contenteditable="true"]') ?? null
}

function focusPrimaryField(card: HTMLElement) {
  const primaryShell = card.querySelector<HTMLElement>('[data-input-shell][data-primary-field]')
  getShellFocusableInput(primaryShell)?.focus()
}

/**
 * Card click handler shared by node types. Auto-focuses the primary field
 * (Header / Screengrab name / Question) only while the node has no content yet.
 * Other field shells still receive focus when clicked directly.
 */
export function handleNodeCardClick(
  e: React.MouseEvent<HTMLDivElement>,
  {
    nodeIsEmpty,
    onFilledChromeClick,
    onNonPrimaryShellClick,
  }: {
    nodeIsEmpty: boolean
    /** Called when the user clicks node chrome and the node already has content. */
    onFilledChromeClick?: () => void
    /** Called before focusing a non-primary field shell. */
    onNonPrimaryShellClick?: () => void
  },
) {
  const target = e.target as HTMLElement
  if (shouldSkipNodeCardClickTarget(target)) return

  const card = e.currentTarget as HTMLElement
  const nearestShell = target.closest<HTMLElement>('[data-input-shell]')

  if (!nearestShell) {
    if (nodeIsEmpty) {
      focusPrimaryField(card)
    } else {
      onFilledChromeClick?.()
    }
    return
  }

  const input = getShellFocusableInput(nearestShell)
  const isPrimaryShell = nearestShell.hasAttribute('data-primary-field')

  if (isPrimaryShell) {
    if (nodeIsEmpty) input?.focus()
  } else {
    onNonPrimaryShellClick?.()
    input?.focus()
  }
}
