import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatQuantity(num: number, uom?: string): string {
  const formatted = new Intl.NumberFormat('en-US').format(num)
  return uom ? `${formatted} ${uom}` : formatted
}

export function formatTime12h(timeStr: string): string {
  if (!timeStr) return ''
  // Convert any 24h pattern like 15:00 or 15:00:00 or 06:00 to 3:00 PM or 6:00 AM
  return timeStr.replace(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/g, (match, hStr, mStr, sStr) => {
    let h = parseInt(hStr, 10)
    if (h < 0 || h > 23) return match
    const period = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    const secPart = sStr ? `:${sStr}` : ''
    return `${h}:${mStr}${secPart} ${period}`
  })
}

export function formatDate(dateString: string | Date): string {
  if (!dateString) return '-'
  if (typeof dateString === 'string' && (dateString.toLowerCase().startsWith('today') || dateString.toLowerCase().startsWith('tomorrow') || dateString.toLowerCase().startsWith('yesterday'))) {
    return formatTime12h(dateString)
  }
  const d = new Date(dateString)
  if (isNaN(d.getTime())) {
    return formatTime12h(String(dateString))
  }
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

export function formatShortDate(dateString: string | Date): string {
  if (!dateString) return '-'
  if (typeof dateString === 'string' && (dateString.toLowerCase().startsWith('today') || dateString.toLowerCase().startsWith('tomorrow') || dateString.toLowerCase().startsWith('yesterday'))) {
    return formatTime12h(dateString)
  }
  const d = new Date(dateString)
  if (isNaN(d.getTime())) {
    return formatTime12h(String(dateString))
  }
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/**
 * Sanitizes order and dispatch notes by stripping internal attribution and system tags
 * such as "[via WhatsApp Menu]", "[Source: Instagram Link | Medium: referral]",
 * "[Delivery Promo]", and "[Scheduled Delivery: ...]", returning only pure operational notes.
 */
export function cleanOrderNotes(notes?: string | null): string {
  if (!notes) return ''
  return notes
    .replace(/\[via\s+[^\]]+\]/gi, '')
    .replace(/\[Source:[^\]]+\]/gi, '')
    .replace(/\[Delivery\s+Promo\]/gi, '')
    .replace(/\[Scheduled\s+Delivery:[^\]]+\]/gi, '')
    .replace(/\[Promo:[^\]]+\]/gi, '')
    .replace(/^\s*[\r\n]+/gm, '')
    .trim()
}
