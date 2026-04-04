let ctx: AudioContext | null = null

function getCtx() {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

export function playDing(frequency: number, duration = 0.12) {
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()

    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.18, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration)

    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + duration)
  } catch {
    // Audio not available
  }
}

export const dingHigh = () => playDing(880)
export const dingLow = () => playDing(440)
