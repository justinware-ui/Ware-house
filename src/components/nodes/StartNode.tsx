import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Copy } from 'lucide-react'

export default function StartNode({ data }: NodeProps) {
  return (
    <div className="bg-[#302C28] border border-[#3D3834] rounded-xl px-4 py-3 shadow-sm min-w-[180px]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="text-sm font-medium text-[#F5F0EB]">
            {(data as { label: string }).label}
          </span>
        </div>
        <button className="text-[#78716C] hover:text-[#A8A29E]">
          <Copy size={14} />
        </button>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-brand-500 !border-brand-500"
        style={{ width: 12, height: 12 }}
      />
    </div>
  )
}
