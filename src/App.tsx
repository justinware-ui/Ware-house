import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import Header from '@/components/Header'
import FlowCanvas from '@/components/FlowCanvas'
import Sidebar from '@/components/Sidebar'

export default function App() {
  const [hasContent, setHasContent] = useState(false)

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <Header hasContent={hasContent} />
        <div className="flex flex-1 overflow-hidden">
          <FlowCanvas onContentChange={setHasContent} />
          <Sidebar />
        </div>
      </div>
    </ReactFlowProvider>
  )
}
