// Web Audio API synthesizer for operational notifications and alerts
// Avoids external audio asset dependencies and works reliably across modern browsers.

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return null
    if (!audioCtx) {
      audioCtx = new AudioContextClass()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }
    return audioCtx
  } catch {
    return null
  }
}

let lastChimeTime = 0

/**
 * Play a gentle, professional chime when a new live notification or order alert arrives
 */
export function playAlertChime(type: 'order' | 'warning' | 'info' | 'success' = 'order') {
  try {
    const wallNow = Date.now()
    // Throttle consecutive alert chimes to at most once every 1200ms to prevent audio spam
    if (wallNow - lastChimeTime < 1200) return
    lastChimeTime = wallNow

    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    if (type === 'order') {
      // Prominent, loud, multi-tone kitchen & dispatch alert fanfare (~1.8 seconds)
      // Notes: E5 (659Hz) -> G#5 (830Hz) -> B5 (987Hz) -> E6 (1318Hz), concluding in an emphatic harmonic chime
      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0, now)
      masterGain.gain.linearRampToValueAtTime(0.60, now + 0.04) // Loud, clear kitchen alert level
      masterGain.gain.setValueAtTime(0.60, now + 1.2)
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8)
      masterGain.connect(ctx.destination)

      const notes = [
        { freq: 659.25, start: 0.00, dur: 0.22 }, // E5
        { freq: 830.61, start: 0.20, dur: 0.24 }, // G#5
        { freq: 987.77, start: 0.42, dur: 0.26 }, // B5
        { freq: 1318.51, start: 0.66, dur: 0.55 }, // E6 (apex)
        // Sustained harmonic resolution chord
        { freq: 659.25, start: 1.15, dur: 0.65 }, // E5
        { freq: 987.77, start: 1.15, dur: 0.65 }, // B5
        { freq: 1318.51, start: 1.15, dur: 0.65 }, // E6
      ]

      notes.forEach(({ freq, start, dur }) => {
        const noteStart = now + start
        const noteStop = noteStart + dur

        // Primary tone (triangle for fullness)
        const osc1 = ctx.createOscillator()
        osc1.type = 'triangle'
        osc1.frequency.setValueAtTime(freq, noteStart)

        // Warm harmonic overtone (sine)
        const osc2 = ctx.createOscillator()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(freq * 2, noteStart)

        const noteGain = ctx.createGain()
        noteGain.gain.setValueAtTime(0, noteStart)
        noteGain.gain.linearRampToValueAtTime(0.85, noteStart + 0.02)
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteStop)

        osc1.connect(noteGain)
        osc2.connect(noteGain)
        noteGain.connect(masterGain)

        osc1.start(noteStart)
        osc1.stop(noteStop)
        osc2.start(noteStart)
        osc2.stop(noteStop)
      })
    } else if (type === 'warning') {
      // Subtle alert pulse (C5 -> E5 -> C5)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, now)
      osc.frequency.setValueAtTime(659.25, now + 0.08)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.35)
    } else {
      // Soft ping
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, now)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.25)
    }
  } catch {
    // Gracefully ignore audio failures (e.g. autoplay permissions)
  }
}

/**
 * Request browser desktop notification permission and dispatch native notification if granted
 */
export function sendDesktopNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return

  try {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        ...options,
      })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, {
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            ...options,
          })
        }
      }).catch(() => {})
    }
  } catch {
    // Ignore environments where Notification constructor fails
  }
}

