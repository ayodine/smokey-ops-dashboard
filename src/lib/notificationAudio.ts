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

// Ensure AudioContext is unlocked on first user interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {})
      }
    } catch {}
    window.removeEventListener('pointerdown', unlockAudio)
    window.removeEventListener('keydown', unlockAudio)
  }
  window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true })
  window.addEventListener('keydown', unlockAudio, { passive: true, once: true })
}

let lastChimeTime = 0
let currentOrderRingtone: {
  masterGain: GainNode
  stopTimer: number
  stop: () => void
} | null = null

/**
 * Manually stop any currently playing order ringtone immediately
 */
export function stopOrderRingtone() {
  if (currentOrderRingtone) {
    try {
      currentOrderRingtone.stop()
    } catch {}
    currentOrderRingtone = null
  }
}

/**
 * Check if the order ringtone is currently playing
 */
export function isOrderRingtonePlaying(): boolean {
  return currentOrderRingtone !== null
}

/**
 * Plays a loud, distinct, rhythmic hospitality order ringtone that loops for exactly 5.0 seconds and stops automatically.
 */
export function playOrderRingtone5s() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    // Stop any existing playing ringtone first to prevent overlapping noise
    stopOrderRingtone()

    const now = ctx.currentTime
    const totalDuration = 5.0 // exactly 5 seconds

    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0, now)
    masterGain.gain.linearRampToValueAtTime(0.75, now + 0.05) // Loud restaurant kitchen alert volume
    masterGain.connect(ctx.destination)

    const oscillators: OscillatorNode[] = []

    // Helper to schedule a harmonic dual-tone chime note
    const scheduleNote = (freq: number, startOffset: number, duration: number, peakGain = 0.85) => {
      const noteStart = now + startOffset
      const noteStop = noteStart + duration

      // Triangle for acoustic body and sharpness
      const osc1 = ctx.createOscillator()
      osc1.type = 'triangle'
      osc1.frequency.setValueAtTime(freq, noteStart)

      // Sine overtone for resonance and bell-like ring
      const osc2 = ctx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(freq * 2, noteStart)

      const noteGain = ctx.createGain()
      noteGain.gain.setValueAtTime(0, noteStart)
      noteGain.gain.linearRampToValueAtTime(peakGain, noteStart + 0.02)
      noteGain.gain.exponentialRampToValueAtTime(0.001, noteStop)

      osc1.connect(noteGain)
      osc2.connect(noteGain)
      noteGain.connect(masterGain)

      osc1.start(noteStart)
      osc1.stop(noteStop)
      osc2.start(noteStart)
      osc2.stop(noteStop)

      oscillators.push(osc1, osc2)
    }

    // 5-second rhythmic ring sequence:
    // 4 rhythmic double-pulse ringing bursts (at 0.0s, 1.0s, 2.0s, 3.0s) + 1 grand resolving chime (4.0s - 5.0s)
    const bursts = [0.0, 1.0, 2.0, 3.0]
    bursts.forEach((burstStart) => {
      // Pulse 1: G5 (783.99Hz) + C6 (1046.50Hz)
      scheduleNote(783.99, burstStart + 0.00, 0.28, 0.70)
      scheduleNote(1046.50, burstStart + 0.00, 0.28, 0.85)

      // Pulse 2: A5 (880.00Hz) + E6 (1318.51Hz)
      scheduleNote(880.00, burstStart + 0.32, 0.32, 0.75)
      scheduleNote(1318.51, burstStart + 0.32, 0.35, 0.90)
    })

    // Grand Finale Resolution Chord at 4.0s, sustaining and decaying cleanly to zero at 5.0s
    const finalStart = 4.0
    scheduleNote(523.25, finalStart, 0.95, 0.70)  // C5
    scheduleNote(783.99, finalStart, 0.95, 0.75)  // G5
    scheduleNote(1046.50, finalStart, 0.95, 0.85) // C6
    scheduleNote(1318.51, finalStart, 0.95, 0.90) // E6

    // Master volume envelope: taper off smoothly to 0 at exactly 5.0 seconds
    masterGain.gain.setValueAtTime(0.75, now + 4.6)
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + totalDuration)

    // Set auto-cutoff timer
    const stopTimer = window.setTimeout(() => {
      stopOrderRingtone()
    }, totalDuration * 1000)

    currentOrderRingtone = {
      masterGain,
      stopTimer,
      stop: () => {
        window.clearTimeout(stopTimer)
        try {
          const cutTime = ctx.currentTime
          masterGain.gain.cancelScheduledValues(cutTime)
          masterGain.gain.setValueAtTime(masterGain.gain.value, cutTime)
          masterGain.gain.linearRampToValueAtTime(0.001, cutTime + 0.05)
          setTimeout(() => {
            try {
              masterGain.disconnect()
              oscillators.forEach(osc => {
                try { osc.stop() } catch {}
              })
            } catch {}
          }, 60)
        } catch {}
      }
    }
  } catch {
    // Gracefully ignore audio failures (e.g. autoplay permissions)
  }
}

/**
 * Play an operational sound effect (orders use the 5-second ringtone, alerts use short pings)
 */
export function playAlertChime(type: 'order' | 'warning' | 'info' | 'success' = 'order') {
  try {
    if (type === 'order') {
      // Plays the 5-second ringtone sound
      playOrderRingtone5s()
      return
    }

    const wallNow = Date.now()
    // Throttle consecutive non-order alert chimes to at most once every 800ms
    if (wallNow - lastChimeTime < 800) return
    lastChimeTime = wallNow

    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    if (type === 'warning') {
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
    // Gracefully ignore audio failures
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
