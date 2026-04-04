import { useState, useRef, useCallback, useEffect } from 'react'

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const activeRef = useRef(false)
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(onTranscript)
  callbackRef.current = onTranscript
  const resultOffsetRef = useRef(0)
  const pendingResetRef = useRef(false)

  const isSupported = typeof window !== 'undefined' &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition)

  const cleanupAudio = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    analyserRef.current = null
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {})
    }
    audioCtxRef.current = null
  }, [])

  const cleanup = useCallback(() => {
    activeRef.current = false
    if (restartTimer.current) clearTimeout(restartTimer.current)
    restartTimer.current = null
    try { recognitionRef.current?.abort() } catch { /* */ }
    recognitionRef.current = null
    cleanupAudio()
    setIsListening(false)
    resultOffsetRef.current = 0
    pendingResetRef.current = false
  }, [cleanupAudio])

  useEffect(() => () => cleanup(), [cleanup])

  const launchRecognition = useCallback(() => {
    if (!isSupported || !activeRef.current) return

    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    recognitionRef.current = rec
    resultOffsetRef.current = 0
    pendingResetRef.current = false

    rec.onresult = (event: SpeechRecognitionEvent) => {
      if (pendingResetRef.current) {
        let finalCount = 0
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) finalCount = i + 1
        }
        resultOffsetRef.current = finalCount || event.results.length
        pendingResetRef.current = false
      }

      let text = ''
      for (let i = resultOffsetRef.current; i < event.results.length; i++) {
        text += event.results[i][0].transcript
      }
      if (text.trim()) {
        callbackRef.current(text.trim())
      } else {
        callbackRef.current('')
      }
    }

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        cleanup()
      }
    }

    rec.onend = () => {
      if (activeRef.current) {
        restartTimer.current = setTimeout(() => {
          if (activeRef.current) launchRecognition()
        }, 250)
      } else {
        setIsListening(false)
      }
    }

    try {
      rec.start()
    } catch {
      cleanup()
    }
  }, [isSupported, cleanup])

  const toggle = useCallback(() => {
    if (activeRef.current) {
      cleanup()
      return
    }

    if (!isSupported) return

    activeRef.current = true
    setIsListening(true)

    launchRecognition()

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      if (!activeRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = stream
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.7
      source.connect(analyser)
      analyserRef.current = analyser
    }).catch(() => {})
  }, [isSupported, cleanup, launchRecognition])

  const resetTranscript = useCallback(() => {
    pendingResetRef.current = true
  }, [])

  return { isListening, toggle, isSupported, analyserRef, resetTranscript }
}
