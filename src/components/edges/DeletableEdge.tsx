import { useState, useEffect, useRef } from 'react'
import {
  useReactFlow,
  type EdgeProps,
  Position,
} from '@xyflow/react'
import { X } from 'lucide-react'

function ctrlOffset(distance: number, curvature: number) {
  return distance >= 0
    ? 0.5 * distance
    : curvature * 25 * Math.sqrt(-distance)
}

function ctrlPoint(
  pos: Position,
  x1: number, y1: number,
  x2: number, y2: number,
  c: number,
): [number, number] {
  if (pos === Position.Left) return [x1 - ctrlOffset(x1 - x2, c), y1]
  if (pos === Position.Right) return [x1 + ctrlOffset(x2 - x1, c), y1]
  if (pos === Position.Top) return [x1, y1 - ctrlOffset(y1 - y2, c)]
  return [x1, y1 + ctrlOffset(y2 - y1, c)]
}

function swingPath(
  sx: number, sy: number, sp: Position,
  tx: number, ty: number, tp: Position,
  swing: number,
): [string, number, number] {
  const [c1x, c1y] = ctrlPoint(sp, sx, sy, tx, ty, 0.25)
  const [c2x, c2y] = ctrlPoint(tp, tx, ty, sx, sy, 0.25)

  let s1x = c1x, s1y = c1y, s2x = c2x, s2y = c2y

  if (swing !== 0) {
    const dx = tx - sx
    const dy = ty - sy
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const perpX = (-dy / dist) * swing
    const perpY = (dx / dist) * swing
    s1x += perpX; s1y += perpY
    s2x += perpX; s2y += perpY
  }

  const midX = 0.125 * sx + 0.375 * s1x + 0.375 * s2x + 0.125 * tx
  const midY = 0.125 * sy + 0.375 * s1y + 0.375 * s2y + 0.125 * ty

  return [
    `M${sx},${sy} C${s1x},${s1y} ${s2x},${s2y} ${tx},${ty}`,
    midX,
    midY,
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
