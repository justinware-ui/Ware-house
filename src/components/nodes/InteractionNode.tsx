'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { NODE_HANDLE_CLASS, NODE_HANDLE_SIDE_STYLE } from './nodeFieldStyles'

interface Block {
  type: string
  color: string
}

export default function InteractionNode({ data }: NodeProps) {
  const blocks = (data as { blocks: Block[] }).blocks ?? []

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm min-w-[140px]">
      <Handle
        type="target"
        position={Position.Left}
        className={NODE_HANDLE_CLASS}
        style={NODE_HANDLE_SIDE_STYLE}
      />
      <div className="flex gap-2">
        {blocks.map((block, i) => (
          <div
            key={i}
            className="w-10 h-14 rounded-md"
            style={{ backgroundColor: block.color + '30', borderLeft: `3px solid ${block.color}` }}
          />
        ))}
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
