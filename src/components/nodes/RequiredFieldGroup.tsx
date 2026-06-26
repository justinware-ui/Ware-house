'use client'

import NodeRequiredMessage from './NodeRequiredMessage'
import { NodeGhostConnectorDot, NodeInlineSourceHandle } from './NodeConnectorHandles'

export default function RequiredFieldGroup({
  showMessage,
  handleId,
  sourceHandle,
  ghostConnector,
  className = '',
  children,
}: {
  showMessage: boolean
  handleId?: string
  sourceHandle?: boolean
  ghostConnector?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="relative overflow-visible">
        {children}
        {handleId && <NodeInlineSourceHandle id={handleId} />}
        {sourceHandle && <NodeInlineSourceHandle />}
        {ghostConnector && <NodeGhostConnectorDot />}
      </div>
      <NodeRequiredMessage show={showMessage} />
    </div>
  )
}
