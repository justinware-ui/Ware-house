import { useRef, useState, useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import Header from '@/components/Header'
import FlowCanvas, { type FlowCanvasHandle } from '@/components/FlowCanvas'
import Sidebar from '@/components/Sidebar'
import { copyToClipboard, saveDemoSnapshot } from '@/lib/demoShare'
import { requestGlobalNodeValidation } from '@/components/nodes/nodeValidation'
import { hasAnyValidationErrors } from '@/components/nodes/nodeValidationStore'

export default function App() {
  const [hasContent, setHasContent] = useState(false)
  const [demoTitle, setDemoTitle] = useState('Demo Title')
  const [reviewLink, setReviewLink] = useState<string | null>(null)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const canvasRef = useRef<FlowCanvasHandle>(null)

  useEffect(() => {
    const href = window.location.href
    if (window.location.hash.startsWith('#d=') || window.location.search.includes('share=')) {
      setReviewLink(href)
    }
  }, [])

  const showSaveNotice = (message: string) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
    setSaveNotice(message)
    noticeTimerRef.current = setTimeout(() => setSaveNotice(null), 4000)
  }

  const handleSaveAndContinue = () => {
    requestGlobalNodeValidation()

    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        if (hasAnyValidationErrors()) return

        const snapshot = canvasRef.current?.getSnapshot()
        if (!snapshot || snapshot.nodes.length === 0) return

        const { url } = saveDemoSnapshot({
          title: demoTitle,
          nodes: snapshot.nodes,
          edges: snapshot.edges,
          savedAt: new Date().toISOString(),
        })

        window.history.replaceState(null, '', url)
        setReviewLink(url)

        const copied = await copyToClipboard(url)
        showSaveNotice(
          copied
            ? 'Prototype saved. Review link copied to clipboard.'
            : 'Prototype saved. Copy the link from your browser address bar.',
        )
      })
    })
  }

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <Header
          hasContent={hasContent}
          title={demoTitle}
          reviewLink={reviewLink}
          saveNotice={saveNotice}
          onTitleChange={setDemoTitle}
          onSaveAndContinue={handleSaveAndContinue}
        />
        <div className="flex flex-1 overflow-hidden">
          <FlowCanvas
            ref={canvasRef}
            onContentChange={setHasContent}
            onTitleLoad={setDemoTitle}
          />
          <Sidebar />
        </div>
      </div>
    </ReactFlowProvider>
  )
}
