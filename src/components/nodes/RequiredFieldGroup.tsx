'use client'

import NodeRequiredMessage from './NodeRequiredMessage'
import { NodeGhostConnectorDot, NodeInlineSourceHandle } from './NodeConnectorHandles'

export default function RequiredFieldGroup({
  showMessage,
  handleId,
  handleTop,
  handleRight,
  sourceHandle,
  ghostConnector,
  ghostConnectorTop,
  className = '',
  children,
}: {
  showMessage: boolean
  handleId?: string
  handleTop?: string | number
  /** Custom right offset for the connector handle. Defaults to NODE_HANDLE_INLINE_OFFSET. */
  handleRight?: number
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
        {handleId && <NodeInlineSourceHandle id={handleId} top={handleTop} right={handleRight} />}
        {sourceHandle && <NodeInlineSourceHandle top={handleTop} right={handleRight} />}
        {ghostConnector && <NodeGhostConnectorDot top={ghostConnectorTop ?? handleTop} />}
      </div>
      <NodeRequiredMessage show={showMessage} />
    </div>
  )
}
