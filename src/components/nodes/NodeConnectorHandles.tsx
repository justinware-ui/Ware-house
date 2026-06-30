'use client'

import { Handle, Position } from '@xyflow/react'
import {
  NODE_HANDLE_CLASS,
  NODE_HANDLE_INLINE_OFFSET,
  NODE_HANDLE_SIZE,
} from './nodeFieldStyles'

const HANDLE_RESET_CLASS =
  '!absolute !inset-0 !transform-none !top-0 !left-0 !right-0 !bottom-0'

function HandleAnchor({
  style,
  children,
}: {
  style: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <div
      className="absolute z-10 nodrag nopan"
      style={{ width: NODE_HANDLE_SIZE, height: NODE_HANDLE_SIZE, ...style }}
    >
      {children}
    </div>
  )
}

export function NodeInlineSourceHandle({
  id,
  top = '50%',
  right = NODE_HANDLE_INLINE_OFFSET,
}: {
  id?: string
  top?: string | number
  right?: number
}) {
  return (
    <HandleAnchor
      style={{
        top,
        right,
        transform: 'translate(50%, -50%)',
      }}
    >
      <Handle
        type="source"
        position={Position.Right}
        id={id}
        className={`${NODE_HANDLE_CLASS} ${HANDLE_RESET_CLASS}`}
        style={{ width: '100%', height: '100%' }}
      />
    </HandleAnchor>
  )
}

export function NodeGhostConnectorDot({
  top = '50%',
  right = NODE_HANDLE_INLINE_OFFSET,
}: {
  top?: string | number
  right?: number
}) {
  return (
    <div
      className="absolute rounded-full border-2 border-white pointer-events-none z-10 nodrag nopan"
      style={{
        width: NODE_HANDLE_SIZE,
        height: NODE_HANDLE_SIZE,
        top,
        right,
        transform: 'translate(50%, -50%)',
        backgroundColor: '#FC6839',
      }}
      aria-hidden
    />
  )
}

export function NodeSideTargetHandle() {
  return (
    <HandleAnchor
      style={{
        top: '50%',
        left: 0,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={`${NODE_HANDLE_CLASS} ${HANDLE_RESET_CLASS}`}
        style={{ width: '100%', height: '100%' }}
      />
    </HandleAnchor>
  )
}

export function NodeSideSourceHandle() {
  return (
    <HandleAnchor
      style={{
        top: '50%',
        right: 0,
        transform: 'translate(50%, -50%)',
      }}
    >
      <Handle
        type="source"
        position={Position.Right}
        className={`${NODE_HANDLE_CLASS} ${HANDLE_RESET_CLASS}`}
        style={{ width: '100%', height: '100%' }}
      />
    </HandleAnchor>
  )
}
