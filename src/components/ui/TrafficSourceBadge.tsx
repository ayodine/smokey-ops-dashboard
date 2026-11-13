import React from 'react'
import { Globe } from 'lucide-react'
import { ParsedAttribution } from '@/lib/cartAttribution'

const FacebookLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5 shrink-0' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path
      d="M16.671 15.469l.533-3.469h-3.328v-2.25c0-.949.465-1.875 1.957-1.875h1.514V4.922s-1.374-.234-2.688-.234c-2.742 0-4.535 1.662-4.535 4.671v2.641H7.08v3.469h3.044v8.385a12.1 12.1 0 003.752 0v-8.385h2.795z"
      fill="#FFFFFF"
    />
  </svg>
)

const InstagramLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5 shrink-0' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="ig-grad-badge" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FD5949" />
        <stop offset="50%" stopColor="#D6249F" />
        <stop offset="100%" stopColor="#285AEB" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad-badge)" />
    <rect x="6" y="6" width="12" height="12" rx="3.5" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="2.8" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
    <circle cx="16.2" cy="7.8" r="1" fill="#FFFFFF" />
  </svg>
)

const SnapchatLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5 shrink-0' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect width="24" height="24" rx="6" fill="#FFFC00" />
    <path
      d="M12.03 4.5c-2.22 0-3.8 1.56-3.8 3.98 0 .56.06 1.38.1 1.98-.32.14-.69.08-.95-.03-.2-.08-.44-.03-.54.17-.09.18-.02.4.14.51.48.32.98.54 1.29.74.16.1.2.27.11.46-.45.95-1.36 1.72-2.5 2.13-.26.09-.41.36-.34.62.06.23.28.39.52.38.58-.02 1.15.08 1.65.28.18.07.31.22.36.41.07.25.25.43.51.48.46.09.96.05 1.48.23.62.21 1.13.69 1.98.69s1.36-.48 1.98-.69c.52-.18 1.02-.14 1.48-.23.26-.05.44-.23.51-.48.05-.19.18-.34.36-.41.5-.2 1.07-.3 1.65-.28.24.01.46-.15.52-.38.07-.26-.08-.53-.34-.62-1.14-.41-2.05-1.18-2.5-2.13-.09-.19-.05-.36.11-.46.31-.2.81-.42 1.29-.74.16-.11.23-.33.14-.51-.1-.2-.34-.25-.54-.17-.26.11-.63.17-.95.03.04-.6.1-1.42.1-1.98 0-2.42-1.58-3.98-3.8-3.98z"
      fill="#FFFFFF"
      stroke="#18181B"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
  </svg>
)

const GoogleLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5 shrink-0' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)

const WhatsAppLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5 shrink-0' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#25D366" />
    <path
      d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"
      fill="#FFFFFF"
    />
  </svg>
)

const TikTokLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5 shrink-0' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect width="24" height="24" rx="6" fill="#111111" />
    <path
      d="M16.6 8.2a3.9 3.9 0 01-2.3-2.4V5h-2.5v9.4a2.1 2.1 0 11-1.5-2V9.8a4.6 4.6 0 104 4.6V9.7a6.3 6.3 0 003.7 1.2V8.4c-.5 0-1-.1-1.4-.2z"
      fill="#FFFFFF"
    />
  </svg>
)

const XLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5 shrink-0' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect width="24" height="24" rx="6" fill="#0F172A" />
    <path
      d="M16.99 5.5h2.29l-5.01 5.72L20.16 18.5h-4.62l-3.62-4.73-4.14 4.73H5.49l5.36-6.12L5.2 5.5h4.73l3.27 4.32L16.99 5.5zm-.8 11.68h1.27L9.22 6.75H7.86l8.33 10.43z"
      fill="#FFFFFF"
    />
  </svg>
)

export const TrafficSourceIcon: React.FC<{ platform: string; className?: string }> = ({ platform, className }) => {
  const p = (platform || '').toLowerCase()
  if (p.includes('facebook')) return <FacebookLogoSvg className={className} />
  if (p.includes('instagram')) return <InstagramLogoSvg className={className} />
  if (p.includes('snapchat')) return <SnapchatLogoSvg className={className} />
  if (p.includes('google')) return <GoogleLogoSvg className={className} />
  if (p.includes('whatsapp')) return <WhatsAppLogoSvg className={className} />
  if (p.includes('tiktok')) return <TikTokLogoSvg className={className} />
  if (p.includes('twitter') || p === 'x') return <XLogoSvg className={className} />
  return <Globe className={className || 'w-3.5 h-3.5 shrink-0 text-zinc-500'} />
}

export const TrafficSourceBadge: React.FC<{ attribution: ParsedAttribution }> = ({ attribution }) => {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap"
      style={{
        backgroundColor: attribution.bg,
        color: attribution.color,
        border: `1px solid ${attribution.border}`,
      }}
    >
      <TrafficSourceIcon platform={attribution.platform} className="w-3.5 h-3.5 shrink-0" />
      <span>{attribution.badgeText}</span>
    </span>
  )
}
