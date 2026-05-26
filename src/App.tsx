import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import Header from '@/components/Header'
import FlowCanvas from '@/components/FlowCanvas'
import Sidebar from '@/components/Sidebar'

export default function App() {
  const [hasContent, setHasContent] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <Header hasContent={hasContent} onPreview={() => setPreviewOpen(true)} />
        <div className="flex flex-1 overflow-hidden">
          <FlowCanvas
            onContentChange={setHasContent}
            previewOpen={previewOpen}
            onPreviewClose={() => setPreviewOpen(false)}
          />
          <Sidebar />
        </div>
      </div>
    </ReactFlowProvider>
  )
}
