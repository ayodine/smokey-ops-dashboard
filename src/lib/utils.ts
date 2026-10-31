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

export function formatDate(dateString: string | Date): string {
  if (!dateString) return '-'
  if (typeof dateString === 'string' && (dateString.toLowerCase().startsWith('today') || dateString.toLowerCase().startsWith('tomorrow') || dateString.toLowerCase().startsWith('yesterday'))) {
    return dateString
  }
  const d = new Date(dateString)
  if (isNaN(d.getTime())) {
    return String(dateString)
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatShortDate(dateString: string | Date): string {
  if (!dateString) return '-'
  if (typeof dateString === 'string' && (dateString.toLowerCase().startsWith('today') || dateString.toLowerCase().startsWith('tomorrow') || dateString.toLowerCase().startsWith('yesterday'))) {
    return dateString
  }
  const d = new Date(dateString)
  if (isNaN(d.getTime())) {
    return String(dateString)
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}
