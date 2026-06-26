'use client'

export default function NodeResizeHandle({
  onMouseDown,
}: {
  onMouseDown: (e: React.MouseEvent) => void
}) {
  return (
    <div
      className="absolute inset-y-0 right-0 w-3 cursor-ew-resize nodrag nopan z-[100]"
      style={{ touchAction: 'none' }}
      onMouseDown={onMouseDown}
    />
  )
}
