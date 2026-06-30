'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { NODE_HANDLE_CLASS, NODE_HANDLE_SIDE_STYLE, NODE_CARD_BORDER_RADIUS } from './nodeFieldStyles'
import { useNodeWidthResize } from './useNodeWidthResize'
import NodeResizeHandle from './NodeResizeHandle'

interface Block {
  type: string
  color: string
}

const INTERACTION_NODE_MIN_WIDTH = 140

export default function InteractionNode({ data }: NodeProps) {
  const blocks = (data as { blocks: Block[] }).blocks ?? []
  const { width, startResize } = useNodeWidthResize(INTERACTION_NODE_MIN_WIDTH, INTERACTION_NODE_MIN_WIDTH)

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative overflow-visible"
      style={{ width, borderRadius: NODE_CARD_BORDER_RADIUS }}
    >
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
      <NodeResizeHandle onMouseDown={startResize} />
    </div>
  )
}
