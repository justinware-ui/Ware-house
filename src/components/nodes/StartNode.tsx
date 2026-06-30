'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { NODE_HANDLE_CLASS, NODE_HANDLE_SIDE_STYLE, NODE_CARD_BORDER_RADIUS } from './nodeFieldStyles'
import { useNodeWidthResize } from './useNodeWidthResize'
import NodeResizeHandle from './NodeResizeHandle'

const START_NODE_MIN_WIDTH = 140

export default function StartNode({ data }: NodeProps) {
  const { width, startResize } = useNodeWidthResize(180, START_NODE_MIN_WIDTH)

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm relative overflow-visible"
      style={{ width, borderRadius: NODE_CARD_BORDER_RADIUS }}
    >
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
      <NodeResizeHandle onMouseDown={startResize} />
    </div>
  )
}
