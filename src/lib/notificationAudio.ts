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
  stopTimer: number
  stop: () => void
} | null = null

/**
 * Verify that a user is currently authenticated and not on the sign-in / auth page
 * before playing any operational audio alert or sending desktop notifications.
 */
export function isUserSignedInAndOnDashboard(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const pathname = window.location.pathname || ''
    if (pathname === '/login' || pathname === '/auth' || pathname.startsWith('/login/') || pathname.startsWith('/auth/')) {
      return false
    }
    const sessionRaw = sessionStorage.getItem('smokey_auth_session_v1') || localStorage.getItem('smokey_auth_session_v1')
    if (!sessionRaw) return false
    const parsed = JSON.parse(sessionRaw)
    return Boolean(parsed && parsed.email && parsed.sessionToken)
  } catch {
    return false
  }
}

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
 * Plays the original 5-second melodic chime from Smokey Admin using Web Audio API:
 * Ascending then descending triangle-wave melody [880Hz, 1100Hz, 1320Hz, 1100Hz, 880Hz]
 * with dynamics compression.
 */
export function playOrderRingtone5s() {
  if (!isUserSignedInAndOnDashboard()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    // Stop any existing playing ringtone first to prevent overlapping noise
    stopOrderRingtone()

    const compressor = ctx.createDynamicsCompressor()
    compressor.connect(ctx.destination)

    const now = ctx.currentTime
    const totalDuration = 5.0 // exactly 5 seconds

    const oscillators: OscillatorNode[] = []

    // Original 5-second chime: ascending then descending melody [freq, startSec, durationSec]
    const notes: [number, number, number][] = [
      [880,  0.0,  0.8],
      [1100, 0.9,  0.8],
      [1320, 1.8,  0.8],
      [1100, 2.7,  0.8],
      [880,  3.6,  1.4],
    ]

    notes.forEach(([freq, start, dur]) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(compressor)
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + start)
      gain.gain.setValueAtTime(0.0001, now + start)
      gain.gain.linearRampToValueAtTime(1.0, now + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur)
      osc.start(now + start)
      osc.stop(now + start + dur + 0.05)
      oscillators.push(osc)
    })

    // Set auto-cutoff timer
    const stopTimer = window.setTimeout(() => {
      stopOrderRingtone()
    }, totalDuration * 1000)

    currentOrderRingtone = {
      stopTimer,
      stop: () => {
        window.clearTimeout(stopTimer)
        try {
          oscillators.forEach(osc => {
            try { osc.stop() } catch {}
          })
          try { compressor.disconnect() } catch {}
        } catch {}
      }
    }
  } catch (err) {
    console.warn('[Audio] Could not play notification chime:', err)
  }
}

/**
 * Play an operational sound effect (orders use the 5-second ringtone, alerts use short pings)
 */
export function playAlertChime(type: 'order' | 'warning' | 'info' | 'success' = 'order') {
  if (!isUserSignedInAndOnDashboard()) return
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
  if (!isUserSignedInAndOnDashboard()) return

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
