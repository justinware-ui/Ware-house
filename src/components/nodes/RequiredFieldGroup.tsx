'use client'

import NodeRequiredMessage from './NodeRequiredMessage'
import { NodeGhostConnectorDot, NodeInlineSourceHandle } from './NodeConnectorHandles'

export default function RequiredFieldGroup({
  showMessage,
  handleId,
  handleTop,
  sourceHandle,
  ghostConnector,
  ghostConnectorTop,
  className = '',
  children,
}: {
  showMessage: boolean
  handleId?: string
  handleTop?: string | number
  sourceHandle?: boolean
  ghostConnector?: boolean
  ghostConnectorTop?: string | number
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="relative overflow-visible">
        {children}
        {handleId && <NodeInlineSourceHandle id={handleId} top={handleTop} />}
        {sourceHandle && <NodeInlineSourceHandle top={handleTop} />}
        {ghostConnector && <NodeGhostConnectorDot top={ghostConnectorTop ?? handleTop} />}
      </div>
      <NodeRequiredMessage show={showMessage} />
    </div>
  )
}
