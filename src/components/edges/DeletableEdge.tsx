import {
  BaseEdge,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react'
import { X } from 'lucide-react'

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

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <foreignObject
        width={22}
        height={22}
        x={labelX - 11}
        y={labelY - 11}
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <button
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#3D3834] transition-colors"
          style={{ backgroundColor: '#1E1B18' }}
          onClick={() => setEdges((eds) => eds.filter((e) => e.id !== id))}
        >
          <X size={12} className="text-brand-500" strokeWidth={3} />
        </button>
      </foreignObject>
    </>
  )
}
