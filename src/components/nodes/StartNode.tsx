'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { NODE_HANDLE_CLASS, NODE_HANDLE_SIDE_STYLE } from './nodeFieldStyles'

export default function StartNode({ data }: NodeProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm min-w-[180px]">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
          <span className="text-white text-xs font-bold">C</span>
        </div>
        <span className="text-sm font-medium text-gray-800">
          {(data as { label: string }).label}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className={NODE_HANDLE_CLASS}
        style={NODE_HANDLE_SIDE_STYLE}
      />
    </div>
  )
}
