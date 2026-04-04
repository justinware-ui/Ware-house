import { useRef, useEffect, type RefObject } from 'react'

const BAR_COUNT = 32
const BAR_GAP = 2
const MIN_HEIGHT = 2
const MAX_HEIGHT = 20

export default function AudioWaveform({
  analyserRef,
  active,
}: {
  analyserRef: RefObject<AnalyserNode | null>
  active: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current)
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }

    const draw = () => {
      const canvas = canvasRef.current
      const analyser = analyserRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, rect.width, rect.height)

      const barWidth = (rect.width - (BAR_COUNT - 1) * BAR_GAP) / BAR_COUNT
      const dataArray = new Uint8Array(analyser?.frequencyBinCount ?? 128)

      if (analyser) {
        analyser.getByteFrequencyData(dataArray)
      }

      const step = Math.max(1, Math.floor(dataArray.length / BAR_COUNT))

      for (let i = 0; i < BAR_COUNT; i++) {
        const raw = analyser ? dataArray[i * step] / 255 : 0
        const h = MIN_HEIGHT + raw * (MAX_HEIGHT - MIN_HEIGHT)
        const x = i * (barWidth + BAR_GAP)
        const y = rect.height - h

        const gradient = ctx.createLinearGradient(x, y, x, rect.height)
        gradient.addColorStop(0, `rgba(252, 104, 57, ${0.4 + raw * 0.6})`)
        gradient.addColorStop(1, `rgba(252, 104, 57, ${0.15 + raw * 0.3})`)
        ctx.fillStyle = gradient

        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, h, 1)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, analyserRef])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="w-full pointer-events-none"
      style={{ height: MAX_HEIGHT }}
    />
  )
}
