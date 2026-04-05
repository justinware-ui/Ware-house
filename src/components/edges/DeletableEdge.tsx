import { useState, useEffect, useRef } from 'react'
import {
  getBezierPath,
  useReactFlow,
  type EdgeProps,
  Position,
} from '@xyflow/react'
import { X } from 'lucide-react'

function swingPath(
  sx: number, sy: number, sp: Position,
  tx: number, ty: number, tp: Position,
  swing: number,
): [string, number, number] {
  if (swing === 0) {
    return getBezierPath({
      sourceX: sx, sourceY: sy, sourcePosition: sp,
      targetX: tx, targetY: ty, targetPosition: tp,
    })
  }

  const dx = tx - sx
  const dy = ty - sy
  const dist = Math.sqrt(dx * dx + dy * dy) || 1
  const perpX = (-dy / dist) * swing
  const perpY = (dx / dist) * swing
  const cpDist = dist * 0.5

  let c1x = sx, c1y = sy
  if (sp === Position.Right) c1x += cpDist
  else if (sp === Position.Left) c1x -= cpDist
  else if (sp === Position.Bottom) c1y += cpDist
  else c1y -= cpDist

  let c2x = tx, c2y = ty
  if (tp === Position.Right) c2x += cpDist
  else if (tp === Position.Left) c2x -= cpDist
  else if (tp === Position.Bottom) c2y += cpDist
  else c2y -= cpDist

  c1x += perpX; c1y += perpY
  c2x += perpX; c2y += perpY

  return [
    `M ${sx},${sy} C ${c1x},${c1y} ${c2x},${c2y} ${tx},${ty}`,
    (sx + tx) / 2 + perpX * 0.5,
    (sy + ty) / 2 + perpY * 0.5,
  ]
}

export default function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
}: EdgeProps) {
  const { setEdges } = useReactFlow()
  const [swing, setSwing] = useState(0)
  const prev = useRef({ sourceX, sourceY, targetX, targetY })
  const raf = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const accum = useRef(0)
  const didMount = useRef(false)

  useEffect(() => {
    const runSway = (amp: number, dur: number) => {
      const t0 = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - t0) / dur, 1)
        const decay = Math.pow(1 - p, 1.5)
        setSwing(Math.sin(p * Math.PI * 2) * decay * amp)
        if (p < 1) raf.current = requestAnimationFrame(tick)
        else setSwing(0)
      }
      cancelAnimationFrame(raf.current)
      raf.current = requestAnimationFrame(tick)
    }

    if (!didMount.current) {
      didMount.current = true
      prev.current = { sourceX, sourceY, targetX, targetY }
      runSway(10, 1200)
      return () => cancelAnimationFrame(raf.current)
    }

    const p = prev.current
    const moved =
      Math.hypot(sourceX - p.sourceX, sourceY - p.sourceY) +
      Math.hypot(targetX - p.targetX, targetY - p.targetY)
    prev.current = { sourceX, sourceY, targetX, targetY }
    if (moved < 1) return

    accum.current += moved
    cancelAnimationFrame(raf.current)
    setSwing(0)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const a = Math.min(accum.current * 0.12, 14)
      accum.current = 0
      runSway(a, 1000)
    }, 80)

    return () => {
      clearTimeout(timer.current)
      cancelAnimationFrame(raf.current)
    }
  }, [sourceX, sourceY, targetX, targetY])

  const [edgePath, labelX, labelY] = swingPath(
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    swing,
  )

  return (
    <>
      <path d={edgePath} fill="none" strokeWidth={20} stroke="transparent" />
      <path
        d={edgePath}
        fill="none"
        style={style}
        markerEnd={markerEnd as string | undefined}
      />
      <foreignObject
        width={22}
        height={22}
        x={labelX - 11}
        y={labelY - 11}
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <button
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
          style={{ backgroundColor: '#f9fafb' }}
          onClick={() => setEdges((eds) => eds.filter((e) => e.id !== id))}
        >
          <X size={12} className="text-brand-500" strokeWidth={3} />
        </button>
      </foreignObject>
    </>
  )
}
